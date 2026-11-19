import type { HistoryStage } from './domain/prod';
import type { IssueCause, IssueReason, IssueSignal, Scenario } from './domain/types';

export type Lang = 'en' | 'es' | 'ar';
export type TimingRange = 'today' | '1h' | '6h' | '12h' | '24h';
export const RANGES: TimingRange[] = ['today', '1h', '6h', '12h', '24h'];
export const RANGE_HOURS: Record<TimingRange, number> = { today: 24, '1h': 1, '6h': 6, '12h': 12, '24h': 24 };
/** Picker team columns as production shows them; 'default' keeps the API order (no column sorted). */
export type TeamSortKey = 'default' | 'name' | 'assignment' | 'picking' | 'pickingPerItem' | 'packing' | 'prep' | 'pfr' | 'failRate' | 'successful' | 'receivingPerSku';
export type SortDir = 'asc' | 'desc';
/** legacy = the Store Management Cockpit as it ships in production (talabat); cape = DMarts Portal layout on the default Cape theme. */
export type Version = 'legacy' | 'cape';
/** The plugin's routes: warehouse list, then one warehouse's overview, order history, cancellations and order issues. */
export type Page = 'monitoring' | 'warehouses' | 'overview' | 'orders' | 'cancellations' | 'issues';
export type HistoryDate = 'any' | '1h' | '4h' | 'today' | 'yesterday' | '7d';
export type CancelTab = 'pending_return' | 'settled' | 'all';
export type IssueTab = 'new' | 'reviewed' | 'all';

export interface HistoryFilters {
  stage: HistoryStage | 'all';
  fulfillment: 'all' | 'full' | 'partial';
  date: HistoryDate;
  orderId: string;
  customer: string;
  picker: string;
  pageSize: 10 | 20 | 50 | 100;
  page: number;
}

export interface IssueFilters {
  tab: IssueTab;
  groupBy: 'order' | 'picker';
  range: 'today' | '7d';
  signal: IssueSignal | 'all';
  reason: IssueReason | 'all';
  cause: IssueCause | 'all';
  picker: string;
}

export interface State {
  page: Page;
  warehouseId: string;
  range: TimingRange;
  scenario: Scenario;
  sort: { key: TeamSortKey; dir: SortDir };
  lang: Lang;
  version: Version;
  history: HistoryFilters;
  cancelTab: CancelTab;
  issues: IssueFilters;
}

export type Action =
  | { type: 'page'; page: Page; warehouseId?: string }
  | { type: 'range'; range: TimingRange }
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'sort'; key: TeamSortKey }
  | { type: 'lang'; lang: Lang }
  | { type: 'version'; version: Version }
  | { type: 'history'; patch: Partial<HistoryFilters> }
  | { type: 'cancelTab'; tab: CancelTab }
  | { type: 'issues'; patch: Partial<IssueFilters> }
  | { type: 'jump'; preset: string };

const DEFAULT_SORT = { key: 'default', dir: 'desc' } as const;
const DEFAULT_HISTORY: HistoryFilters = { stage: 'all', fulfillment: 'all', date: 'any', orderId: '', customer: '', picker: '', pageSize: 20, page: 1 };
const DEFAULT_ISSUES: IssueFilters = { tab: 'new', groupBy: 'order', range: 'today', signal: 'all', reason: 'all', cause: 'all', picker: 'all' };

export const initialState: State = {
  page: 'monitoring',
  warehouseId: 'wh-qa-001',
  range: 'today',
  scenario: 'normal',
  sort: DEFAULT_SORT,
  lang: 'en',
  version: 'cape',
  history: DEFAULT_HISTORY,
  cancelTab: 'pending_return',
  issues: DEFAULT_ISSUES,
};

function apply(s: State, a: Action): State {
  switch (a.type) {
    case 'page':
      return { ...s, page: a.page, warehouseId: a.warehouseId ?? s.warehouseId };
    case 'range':
      return { ...s, range: a.range };
    case 'scenario':
      return { ...s, scenario: a.scenario };
    case 'sort':
      // Same column again flips the direction; a new column starts high → low.
      return { ...s, sort: s.sort.key === a.key ? { key: a.key, dir: s.sort.dir === 'desc' ? 'asc' : 'desc' } : { key: a.key, dir: 'desc' } };
    case 'lang':
      return { ...s, lang: a.lang };
    case 'version':
      // Multi-Store Monitoring exists only in the Cape Version; Legacy falls back to its warehouse list.
      return { ...s, version: a.version, page: a.version === 'legacy' && s.page === 'monitoring' ? 'overview' : s.page };
    case 'history':
      // Any filter change goes back to the first page of results.
      return { ...s, history: { ...s.history, page: 1, ...a.patch } };
    case 'cancelTab':
      return { ...s, cancelTab: a.tab };
    case 'issues':
      return { ...s, issues: { ...s.issues, ...a.patch } };
    case 'jump': {
      const preset = PRESETS.find((p) => p.id === a.preset);
      if (!preset) return s;
      // Presets are action replays through this same reducer; the language and the version survive the jump.
      return preset.actions.reduce(apply, { ...initialState, page: 'overview', lang: s.lang, version: s.version });
    }
  }
}

export const reducer = apply;

export interface Preset {
  id: string;
  code: string;
  group: string;
  label: string;
  actions: Action[];
  /** Code in the Legacy Version when it differs (Legacy keeps its original numbering). */
  legacyCode?: string;
  capeOnly?: boolean;
  legacyOnly?: boolean;
}

/** Presets available in a version, with the code that version shows. */
export const presetsFor = (v: Version): Preset[] => PRESETS.filter((p) => (v === 'cape' ? !p.legacyOnly : !p.capeOnly)).map((p) => (v === 'legacy' && p.legacyCode ? { ...p, code: p.legacyCode } : p));

export const PRESETS: Preset[] = [
  { id: 'default', code: 'SM1', group: 'Overview', label: 'Warehouse overview', actions: [] },
  { id: 'team-sorted', code: 'SM2', group: 'Overview', label: 'Picker team by fail rate', actions: [{ type: 'sort', key: 'failRate' }] },
  { id: 'range-6h', code: 'SM3', group: 'Overview', label: 'Shift performance · last 6h', actions: [{ type: 'range', range: '6h' }] },
  { id: 'monitoring', code: 'SM10', group: 'Multi-store', label: 'Country Monitor · peak evening', actions: [{ type: 'page', page: 'monitoring' }], capeOnly: true },
  { id: 'warehouses', code: 'SM13', legacyCode: 'SM10', group: 'Pages', label: 'Warehouse list', actions: [{ type: 'page', page: 'warehouses' }] },
  { id: 'orders', code: 'SM11', group: 'Pages', label: 'Order history', actions: [{ type: 'page', page: 'orders' }] },
  { id: 'cancellations', code: 'SM12', group: 'Pages', label: 'Cancellations', actions: [{ type: 'page', page: 'cancellations' }] },
  { id: 'spike', code: 'SM4', group: 'Shift states', label: 'Busy shift · late orders', actions: [{ type: 'scenario', scenario: 'spike' }] },
  { id: 'quiet', code: 'SM5', group: 'Shift states', label: 'Idle store · nothing late', actions: [{ type: 'scenario', scenario: 'quiet' }] },
  { id: 'empty', code: 'SM14', group: 'Shift states', label: 'No data yet', actions: [{ type: 'scenario', scenario: 'empty' }] },
  { id: 'closed', code: 'SM6', group: 'Shift states', label: 'Store closed', actions: [{ type: 'scenario', scenario: 'closed' }] },
  { id: 'slow', code: 'SM7', group: 'Data', label: 'Slow API · loading', actions: [{ type: 'scenario', scenario: 'slow' }] },
  { id: 'error', code: 'SM8', group: 'Data', label: 'API error', actions: [{ type: 'scenario', scenario: 'error' }] },
];

const PAGE_CODE: Record<Exclude<Page, 'overview'>, string> = { monitoring: 'SM10', warehouses: 'SM13', orders: 'SM11', cancellations: 'SM12', issues: 'SM9' };
const SCENARIO_CODE: Partial<Record<Scenario, string>> = { spike: 'SM4', quiet: 'SM5', empty: 'SM14', closed: 'SM6', slow: 'SM7', error: 'SM8' };
const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

/** View code derived from the state, never hard-coded per screen. SM9 = any other combination the tester builds. */
export function codeFor(s: State): string {
  const sorted = !same(s.sort, DEFAULT_SORT);
  const ranged = s.range !== initialState.range;
  const filtered = !same(s.history, DEFAULT_HISTORY) || s.cancelTab !== initialState.cancelTab || !same(s.issues, DEFAULT_ISSUES);
  const pristine = !sorted && !ranged && !filtered;
  if (s.page !== 'overview') return s.scenario === 'normal' && pristine ? (s.version === 'legacy' && s.page === 'warehouses' ? 'SM10' : PAGE_CODE[s.page]) : 'SM9';
  if (s.scenario !== 'normal') return pristine ? SCENARIO_CODE[s.scenario]! : 'SM9';
  if (filtered || (sorted && ranged)) return 'SM9';
  if (sorted) return s.sort.key === 'failRate' && s.sort.dir === 'desc' ? 'SM2' : 'SM9';
  if (ranged) return s.range === '6h' ? 'SM3' : 'SM9';
  return 'SM1';
}
