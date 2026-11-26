import type { StoreRow } from './monitoring';

export type BlockId = 'live' | 'perf' | 'extras' | 'table';
export type Unit = 'pct' | 'min' | 'sec' | 'count' | 'num';

/**
 * Data points from the Information Architecture that go beyond the core signals.
 * Each one is only offered in the blocks where it makes sense: live country state, last-hour performance,
 * market extras, or the per-store ranking table. Values are placeholders generated per store.
 */
export interface Metric {
  key: string;
  label: string;
  cat: string;
  unit: Unit;
  good: 'low' | 'high';
  target: number;
  base: number;
  blocks: BlockId[];
  /** Name of the row in the Information Architecture, for the rationale, source and feasibility. */
  ia: string;
}

const m = (key: string, label: string, cat: string, unit: Unit, good: 'low' | 'high', target: number, base: number, blocks: BlockId[], ia: string): Metric => ({ key, label, cat, unit, good, target, base, blocks, ia });

export const METRICS: Metric[] = [
  m('nsfr', 'nSFR', 'Quality', 'pct', 'high', 95, 96.4, ['table'], 'nSFR'),
  m('dispatch', 'Dispatch time', 'Speed', 'min', 'low', 6, 5.5, ['live', 'table'], 'Dispatch time'),
  m('delivery', 'Total delivery time', 'Speed', 'min', 'low', 35, 33, ['live', 'perf'], 'Total delivery time'),
  m('vsForecast', 'Orders vs forecast', 'Order flow', 'pct', 'low', 10, 21.5, ['live', 'perf'], 'Orders and units vs forecast'),
  m('slow', 'Slow orders', 'Speed', 'pct', 'low', 8, 9.3, ['perf', 'table'], 'Slow orders'),
  m('modified', 'Modified orders', 'Order flow', 'pct', 'low', 1.5, 1.1, ['perf', 'extras'], 'Modified orders and forced pre-orders'),
  m('forced', 'Forced pre-orders', 'Order flow', 'pct', 'low', 0.15, 0.09, ['extras'], 'Modified orders and forced pre-orders'),
  m('ipt', 'Item picking time (IPT)', 'Speed', 'sec', 'low', 18, 17.5, ['perf', 'table'], 'Item picking time (IPT)'),
  m('utr', 'UTR', 'Staffing', 'num', 'high', 108, 104, ['extras', 'table'], 'UTR'),
  m('abs', 'Average basket size (ABS)', 'Staffing', 'num', 'low', 18, 16, ['extras', 'table'], 'Average basket size (ABS)'),
  m('wape', 'Forecast accuracy (WAPE)', 'Staffing', 'pct', 'low', 12, 13, ['extras'], 'Forecast accuracy (WAPE)'),
  m('newSeamless', 'New Seamless', 'Quality', 'pct', 'high', 85, 85.3, ['perf', 'extras'], 'New Seamless'),
  m('helpCenter', 'Help Center sessions', 'Quality', 'pct', 'low', 4, 4, ['perf', 'extras'], 'Help Center sessions'),
  m('complaints', 'Complaints per 100 orders', 'Quality', 'num', 'low', 1.5, 1.2, ['table'], 'Complaint causes'),
  m('offline', 'Offline time today', 'Availability', 'min', 'low', 15, 12, ['table'], 'Store offline time'),
  m('buffer', 'Sales buffer SKUs', 'Availability', 'count', 'low', 20, 18, ['table'], 'Sales buffer (hidden stock)'),
  m('confirming', 'SKUs stuck in confirming', 'Availability', 'count', 'low', 5, 4, ['table'], 'SKUs stuck in confirming'),
  m('putaway', 'Time to putaway', 'Inbound', 'min', 'low', 45, 40, ['table'], 'Time to putaway'),
  m('invoices', 'Supplier invoices loaded', 'Inbound', 'pct', 'high', 95, 90, ['table'], 'Supplier invoices loaded'),
  m('cycle', 'Cycle count compliance', 'Store controls', 'pct', 'high', 90, 80, ['table'], 'Cycle count compliance'),
  m('tasks', 'Expiry and temperature tasks', 'Store controls', 'pct', 'high', 90, 85, ['table'], 'Expiry, fruit and vegetable and temperature tasks'),
  m('checklist', 'Daily checklist compliance', 'Store controls', 'pct', 'high', 80, 70, ['table'], 'Daily checklist'),
  m('cost', 'Labor, waste and packaging vs budget', 'Cost', 'pct', 'low', 100, 98, ['extras'], 'Store labor, waste (merma) and packaging cost'),
];

export const METRIC: Record<string, Metric> = Object.fromEntries(METRICS.map((x) => [x.key, x]));

/** Category of every data point, core signals included; the edit window groups its toggles by it. */
export const CAT: Record<string, string> = {
  late: 'Order flow', unassigned: 'Order flow', assign: 'Speed', prep: 'Speed', instore: 'Speed', awt: 'Speed', pickers: 'Staffing', pfr: 'Quality', fail: 'Quality', age: 'Escalation',
  nsfr: 'Quality', basket: 'Staffing', refunds: 'Quality', forecast: 'Order flow',
  ...Object.fromEntries(METRICS.map((x) => [x.key, x.cat])),
};
export const CAT_ORDER = ['Order flow', 'Speed', 'Staffing', 'Quality', 'Availability', 'Inbound', 'Store controls', 'Cost', 'Escalation'];
export const byCat = (keys: string[]) => [...keys].sort((a, b) => CAT_ORDER.indexOf(CAT[a] ?? '') - CAT_ORDER.indexOf(CAT[b] ?? ''));

const rand = (seed: string) => {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

/** Placeholder value for one store: its own spread around the market baseline, worse where the store is under pressure. */
export function storeValue(x: Metric, s: StoreRow) {
  const stress = 1 + (s.late - 10) / 200;
  // nSFR is a share of orders: realistic range 91-99.5%, a little lower where the store is under pressure.
  if (x.key === 'nsfr') return Math.min(99.5, 99.5 - rand(`${s.id}${x.key}`) * 8 * stress);
  const f = (0.82 + 0.36 * rand(`${s.id}${x.key}`)) * (x.good === 'low' ? stress : 1 / stress);
  return x.base * f;
}

export function countryValue(x: Metric, list: StoreRow[]) {
  const w = list.reduce((n, s) => n + s.orders, 0) || 1;
  return list.reduce((n, s) => n + storeValue(x, s) * s.orders, 0) / w;
}

export type MBand = 'meets' | 'mild' | 'high';
export const metricBand = (x: Metric, v: number): MBand => {
  const r = x.good === 'low' ? v / x.target : x.target / v;
  return r <= 1 ? 'meets' : r <= 1.15 ? 'mild' : 'high';
};
