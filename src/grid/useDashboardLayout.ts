import { useCallback, useEffect, useMemo, useState } from 'react';
import { BOX_CATALOG } from '../domain/boxCatalog';
import type { ColSpan } from '../domain/types';
import { moveBox, packInitialRows, resizeBox, spanForRowSize } from './rowLayout';
import type { Rows } from './rowLayout';

// Mirrors `dashboard_layouts`: row_index/position_in_row per box (see
// Cockpit-Shift-View-schema.sql). Persisted to localStorage for the
// prototype; swap loadRows/saveRows for a Supabase select/upsert on that
// table and every box keeps working unchanged.
function storageKey(userId: string, storeId: string) {
  return `dashboard_layout:${userId}:${storeId}`;
}

function defaultRows(): Rows {
  const keys = BOX_CATALOG.map((b) => b.key);
  const hints: Record<string, ColSpan> = {};
  BOX_CATALOG.forEach((b) => {
    hints[b.key] = b.defaultColSpan;
  });
  return packInitialRows(keys, hints);
}

function loadRows(userId: string, storeId: string): Rows {
  const raw = localStorage.getItem(storageKey(userId, storeId));
  const known = new Set(BOX_CATALOG.map((b) => b.key));
  if (!raw) return defaultRows();
  try {
    const parsed = JSON.parse(raw) as Rows;
    const validRows = parsed.filter(Array.isArray).map((row) => row.filter((key) => known.has(key)));
    const seen = new Set(validRows.flat());
    const missing = BOX_CATALOG.filter((b) => !seen.has(b.key)).map((b) => [b.key]);
    const rows = [...validRows.filter((r) => r.length > 0), ...missing];
    return rows.length ? rows : defaultRows();
  } catch {
    return defaultRows();
  }
}

export function useDashboardLayout(userId: string, storeId: string) {
  const [rows, setRows] = useState<Rows>(() => loadRows(userId, storeId));

  useEffect(() => {
    localStorage.setItem(storageKey(userId, storeId), JSON.stringify(rows));
  }, [rows, userId, storeId]);

  const orderedKeys = useMemo(() => rows.flat(), [rows]);

  const resolvedColSpan = useCallback(
    (boxKey: string) => {
      const row = rows.find((r) => r.includes(boxKey));
      return row ? spanForRowSize(row.length) : 3;
    },
    [rows],
  );

  const setColSpan = useCallback((boxKey: string, size: ColSpan) => {
    setRows((prev) => resizeBox(prev, boxKey, size));
  }, []);

  const reorder = useCallback((activeKey: string, overKey: string) => {
    setRows((prev) => moveBox(prev, activeKey, overKey));
  }, []);

  return { orderedKeys, setColSpan, reorder, resolvedColSpan };
}
