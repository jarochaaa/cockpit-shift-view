import type { ColSpan } from '../domain/types';

// A box's rendered width is ALWAYS exactly however many boxes share its row:
// 1 -> L (full), 2 -> M (half), 3 -> S (third). Row membership is the only
// state that matters — span is a pure function of it, never stored
// separately, so it can never drift out of sync with what's on screen.
const COUNT_TO_SPAN: Record<number, ColSpan> = { 1: 3, 2: 2, 3: 1 };
const SPAN_TO_COUNT: Record<ColSpan, number> = { 3: 1, 2: 2, 1: 3 };

export function spanForRowSize(count: number): ColSpan {
  return COUNT_TO_SPAN[Math.min(Math.max(count, 1), 3)] ?? 1;
}

export function countForSpan(span: ColSpan): number {
  return SPAN_TO_COUNT[span];
}

export type Rows = string[][];

// Only used once, to build the very first layout from BOX_CATALOG's
// defaultColSpan values — a simple greedy left-to-right pack. Every
// subsequent change goes through moveBox/resizeBox below, which mutate
// row membership directly instead of re-deriving it from scratch (that's
// what caused an edit to one row to ripple into an unrelated row further
// down the sequence).
const SPAN_FRACTION: Record<ColSpan, number> = { 1: 1 / 3, 2: 1 / 2, 3: 1 };
const EPSILON = 0.02;

export function packInitialRows(orderedKeys: string[], defaultSpanByKey: Record<string, ColSpan>): Rows {
  const rows: Rows = [];
  let current: string[] = [];
  let currentFraction = 0;

  for (const key of orderedKeys) {
    const span = defaultSpanByKey[key] ?? 3;
    if (span === 3) {
      if (current.length) {
        rows.push(current);
        current = [];
        currentFraction = 0;
      }
      rows.push([key]);
      continue;
    }
    const fraction = SPAN_FRACTION[span];
    if (current.length && currentFraction + fraction > 1 + EPSILON) {
      rows.push(current);
      current = [];
      currentFraction = 0;
    }
    current.push(key);
    currentFraction += fraction;
  }
  if (current.length) rows.push(current);
  return rows;
}

// Drag `activeKey` to sit right after `overKey`. If `overKey`'s row is
// already full (3 boxes), the dropped box becomes its own new row next to
// it instead of overflowing. The row the box left just has one fewer
// member — no separate "rebalance" step needed, since span is derived.
export function moveBox(rows: Rows, activeKey: string, overKey: string): Rows {
  if (activeKey === overKey) return rows;
  const result = rows.map((r) => [...r]);

  const fromRowIndex = result.findIndex((r) => r.includes(activeKey));
  if (fromRowIndex === -1) return rows;

  const fromRow = result[fromRowIndex];
  const remaining = fromRow.filter((k) => k !== activeKey);
  if (remaining.length) result[fromRowIndex] = remaining;
  else result.splice(fromRowIndex, 1);

  const toRowIndex = result.findIndex((r) => r.includes(overKey));
  if (toRowIndex === -1) {
    result.push([activeKey]);
    return result;
  }

  const toRow = result[toRowIndex];
  if (toRow.length >= 3) {
    result.splice(toRowIndex + 1, 0, [activeKey]);
    return result;
  }

  const overIdx = toRow.indexOf(overKey);
  result[toRowIndex] = [...toRow.slice(0, overIdx + 1), activeKey, ...toRow.slice(overIdx + 1)];
  return result;
}

// Manual S/M/L click. Shrinking splits the row at the clicked box: up to
// (targetCount - 1) *preceding* neighbors join it, everything after spills
// into its own new row. Growing pulls boxes in from the next row (then the
// previous row if that's not enough) — never further than the immediate
// neighbor, so a resize can't reach across the page.
export function resizeBox(rows: Rows, boxKey: string, targetSize: ColSpan): Rows {
  const targetCount = countForSpan(targetSize);
  const result = rows.map((r) => [...r]);
  let rowIndex = result.findIndex((r) => r.includes(boxKey));
  if (rowIndex === -1) return rows;

  const row = result[rowIndex];
  if (row.length === targetCount) return rows;

  if (row.length > targetCount) {
    const idx = row.indexOf(boxKey);
    const needBefore = targetCount - 1;
    const beforeAll = row.slice(0, idx);
    const before = beforeAll.slice(Math.max(0, beforeAll.length - needBefore));
    const newGroup = [...before, boxKey];
    const beforeLeftover = beforeAll.slice(0, beforeAll.length - before.length);
    const afterLeftover = row.slice(idx + 1);

    const replacement: Rows = [];
    if (beforeLeftover.length) replacement.push(beforeLeftover);
    replacement.push(newGroup);
    if (afterLeftover.length) replacement.push(afterLeftover);
    result.splice(rowIndex, 1, ...replacement);
    return result;
  }

  let need = targetCount - row.length;
  let newRow = [...row];

  if (need > 0 && rowIndex + 1 < result.length) {
    const nextRow = result[rowIndex + 1];
    const takeCount = Math.min(need, nextRow.length);
    newRow = [...newRow, ...nextRow.slice(0, takeCount)];
    need -= takeCount;
    const remainder = nextRow.slice(takeCount);
    if (remainder.length) result[rowIndex + 1] = remainder;
    else result.splice(rowIndex + 1, 1);
  }

  if (need > 0 && rowIndex - 1 >= 0) {
    const prevRow = result[rowIndex - 1];
    const takeCount = Math.min(need, prevRow.length);
    newRow = [...prevRow.slice(prevRow.length - takeCount), ...newRow];
    const remainder = prevRow.slice(0, prevRow.length - takeCount);
    if (remainder.length) result[rowIndex - 1] = remainder;
    else {
      result.splice(rowIndex - 1, 1);
      rowIndex -= 1;
    }
  }

  result[rowIndex] = newRow;
  return result;
}
