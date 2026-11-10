import type { ColSpan, Scenario } from './domain/types';
import { moveBox, resizeBox } from './grid/rowLayout';
import type { Rows } from './grid/rowLayout';

export type Lang = 'en' | 'es' | 'ar';
export type TimingRange = '6h' | '12h' | '24h';
export type ChartStyle = 'bars' | 'pie';
export type FloorFilter = 'all' | 'attention' | 'unassigned' | 'idle';
export type TeamSortKey = 'prep' | 'avgAssignmentSeconds' | 'avgPickingSeconds' | 'avgPackingSeconds' | 'pfr' | 'failRate' | 'ordersCount';
export type SortDir = 'asc' | 'desc';

export interface State {
  rows: Rows;
  range: TimingRange;
  chartStyle: ChartStyle;
  scenario: Scenario;
  filter: FloorFilter;
  sort: { key: TeamSortKey; dir: SortDir };
  lang: Lang;
}

export type Action =
  | { type: 'resize'; box: string; size: ColSpan }
  | { type: 'move'; active: string; over: string }
  | { type: 'range'; range: TimingRange }
  | { type: 'chartStyle'; chartStyle: ChartStyle }
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'filter'; filter: FloorFilter }
  | { type: 'sort'; key: TeamSortKey }
  | { type: 'lang'; lang: Lang }
  | { type: 'jump'; preset: string };

// Hot zone first (PRD: header strip, order queue, SKU and picker alerts),
// warm zone below (shift metrics, orders timing, picker team).
export const DEFAULT_ROWS: Rows = [['floor'], ['sku_alerts', 'picker_alerts'], ['shift_metrics'], ['orders_timing'], ['picker_team']];
const DEFAULT_SORT = { key: 'prep', dir: 'desc' } as const;

export const initialState: State = {
  rows: DEFAULT_ROWS,
  range: '24h',
  chartStyle: 'bars',
  scenario: 'normal',
  filter: 'all',
  sort: DEFAULT_SORT,
  lang: 'en',
};

function apply(s: State, a: Action): State {
  switch (a.type) {
    case 'resize':
      return { ...s, rows: resizeBox(s.rows, a.box, a.size) };
    case 'move':
      return { ...s, rows: moveBox(s.rows, a.active, a.over) };
    case 'range':
      return { ...s, range: a.range };
    case 'chartStyle':
      return { ...s, chartStyle: a.chartStyle };
    case 'scenario':
      return { ...s, scenario: a.scenario };
    case 'filter':
      return { ...s, filter: a.filter };
    case 'sort':
      // Same column again flips the direction; a new column starts high → low.
      return { ...s, sort: s.sort.key === a.key ? { key: a.key, dir: s.sort.dir === 'desc' ? 'asc' : 'desc' } : { key: a.key, dir: 'desc' } };
    case 'lang':
      return { ...s, lang: a.lang };
    case 'jump': {
      const preset = PRESETS.find((p) => p.id === a.preset);
      if (!preset) return s;
      // Presets are action replays through this same reducer; the language survives the jump.
      return preset.actions.reduce(apply, { ...initialState, lang: s.lang });
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
}

export const PRESETS: Preset[] = [
  { id: 'default', code: 'SM1', group: 'Shift view', label: 'Default shift view', actions: [] },
  { id: 'filter-attention', code: 'SM2', group: 'Orders & pickers', label: 'Filter · Needs attention', actions: [{ type: 'filter', filter: 'attention' }] },
  { id: 'filter-unassigned', code: 'SM3', group: 'Orders & pickers', label: 'Filter · Unassigned orders', actions: [{ type: 'filter', filter: 'unassigned' }] },
  { id: 'filter-idle', code: 'SM4', group: 'Orders & pickers', label: 'Filter · Idle pickers', actions: [{ type: 'filter', filter: 'idle' }] },
  { id: 'team-sorted', code: 'SM5', group: 'Picker team', label: 'Sorted by fail rate', actions: [{ type: 'sort', key: 'failRate' }] },
  { id: 'timing-pie', code: 'SM6', group: 'Orders timing', label: 'Pie chart', actions: [{ type: 'chartStyle', chartStyle: 'pie' }] },
  { id: 'layout-resize', code: 'SM7', group: 'Layout', label: 'Orders & pickers resized to M', actions: [{ type: 'resize', box: 'floor', size: 2 }] },
  {
    id: 'layout-full-row',
    code: 'SM8',
    group: 'Layout',
    label: 'Box dropped onto a full row',
    actions: [
      { type: 'resize', box: 'shift_metrics', size: 1 },
      { type: 'move', active: 'picker_team', over: 'shift_metrics' },
    ],
  },
  { id: 'spike', code: 'SM10', group: 'Shift states', label: 'Late-order spike, idle pickers', actions: [{ type: 'scenario', scenario: 'spike' }] },
  { id: 'quiet', code: 'SM11', group: 'Shift states', label: 'Quiet shift · empty states', actions: [{ type: 'scenario', scenario: 'quiet' }] },
  { id: 'closed', code: 'SM12', group: 'Shift states', label: 'Store closed', actions: [{ type: 'scenario', scenario: 'closed' }] },
  { id: 'slow', code: 'SM13', group: 'Data', label: 'Slow API · loading', actions: [{ type: 'scenario', scenario: 'slow' }] },
  { id: 'error', code: 'SM14', group: 'Data', label: 'API error', actions: [{ type: 'scenario', scenario: 'error' }] },
];

const replay = (id: string) => PRESETS.find((p) => p.id === id)!.actions.reduce(apply, initialState).rows;
const sameRows = (a: Rows, b: Rows) => JSON.stringify(a) === JSON.stringify(b);
const LAYOUT_RESIZE = replay('layout-resize');
const LAYOUT_FULL_ROW = replay('layout-full-row');

/** View code derived from the state, never hard-coded per screen. SM9 = any other layout the tester builds. */
export function codeFor(s: State): string {
  if (s.scenario === 'error') return 'SM14';
  if (s.scenario === 'slow') return 'SM13';
  if (s.scenario === 'closed') return 'SM12';
  if (s.scenario === 'quiet') return 'SM11';
  if (s.scenario === 'spike') return 'SM10';
  if (!sameRows(s.rows, DEFAULT_ROWS)) {
    if (sameRows(s.rows, LAYOUT_RESIZE)) return 'SM7';
    if (sameRows(s.rows, LAYOUT_FULL_ROW)) return 'SM8';
    return 'SM9';
  }
  if (s.chartStyle === 'pie') return 'SM6';
  if (s.sort.key !== DEFAULT_SORT.key || s.sort.dir !== DEFAULT_SORT.dir) return 'SM5';
  if (s.filter === 'attention') return 'SM2';
  if (s.filter === 'unassigned') return 'SM3';
  if (s.filter === 'idle') return 'SM4';
  return 'SM1';
}
