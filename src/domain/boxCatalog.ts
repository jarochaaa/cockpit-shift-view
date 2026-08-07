import type { BoxConfig } from './types';

// Matches the `boxes` table seed in Cockpit-Shift-View-schema.sql exactly.
// Every box spans the full 1–3 (S/M/L) range — the old per-box min/max
// restrictions fought the fluid row-rebalancing model (see grid/rowLayout.ts):
// height at M/S now adapts via row-stretch + an internal-scroll safety cap
// instead of forcing a box to stay wide, so the span restriction is no
// longer needed to protect content-heavy boxes.
export const BOX_CATALOG: BoxConfig[] = [
  { key: 'needs_attention', labelI18nKey: 'box.needs_attention.label', defaultColSpan: 2, minColSpan: 1, maxColSpan: 3, dataStatus: 'live', category: 'queue' },
  { key: 'people_tasks', labelI18nKey: 'box.people_tasks.label', defaultColSpan: 1, minColSpan: 1, maxColSpan: 3, dataStatus: 'live', category: 'roster' },
  { key: 'shift_metrics', labelI18nKey: 'box.shift_metrics.label', defaultColSpan: 3, minColSpan: 1, maxColSpan: 3, dataStatus: 'live', category: 'metrics' },
  { key: 'orders_timing', labelI18nKey: 'box.orders_timing.label', defaultColSpan: 2, minColSpan: 1, maxColSpan: 3, dataStatus: 'live', category: 'chart' },
  { key: 'picker_team', labelI18nKey: 'box.picker_team.label', defaultColSpan: 3, minColSpan: 1, maxColSpan: 3, dataStatus: 'live', category: 'table' },
  { key: 'sku_alerts', labelI18nKey: 'box.sku_alerts.label', defaultColSpan: 1, minColSpan: 1, maxColSpan: 3, dataStatus: 'placeholder', category: 'queue' },
  { key: 'picker_alerts', labelI18nKey: 'box.picker_alerts.label', defaultColSpan: 1, minColSpan: 1, maxColSpan: 3, dataStatus: 'placeholder', category: 'queue' },
];

export function getBoxConfig(key: string): BoxConfig {
  const box = BOX_CATALOG.find((b) => b.key === key);
  if (!box) throw new Error(`Unknown box key: ${key}`);
  return box;
}
