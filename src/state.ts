import type { Scenario } from './domain/types';

export type Lang = 'en' | 'es' | 'ar';
export type TimingRange = '1h' | '6h' | '12h' | '24h';
export const RANGES: TimingRange[] = ['1h', '6h', '12h', '24h'];
export const RANGE_HOURS: Record<TimingRange, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 };
export type TeamSortKey = 'prep' | 'avgAssignmentSeconds' | 'avgPickingSeconds' | 'avgPackingSeconds' | 'pfr' | 'failRate' | 'ordersCount';
export type SortDir = 'asc' | 'desc';
/** 1 = Cockpit Polish 1B (talabat); 2 = DMarts Portal layout (Cape default theme). Same content. */
export type Version = 1 | 2;

// Cockpit Polish 1B: a now bar over a shift board. The layout is fixed, so the
// state only holds what the manager can change plus the mock-data scenario.
export interface State {
  range: TimingRange;
  scenario: Scenario;
  sort: { key: TeamSortKey; dir: SortDir };
  lang: Lang;
  version: Version;
}

export type Action =
  | { type: 'range'; range: TimingRange }
  | { type: 'scenario'; scenario: Scenario }
  | { type: 'sort'; key: TeamSortKey }
  | { type: 'lang'; lang: Lang }
  | { type: 'version'; version: Version }
  | { type: 'jump'; preset: string };

const DEFAULT_SORT = { key: 'prep', dir: 'desc' } as const;

export const initialState: State = {
  range: '24h',
  scenario: 'normal',
  sort: DEFAULT_SORT,
  lang: 'en',
  version: 1,
};

function apply(s: State, a: Action): State {
  switch (a.type) {
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
      return { ...s, version: a.version };
    case 'jump': {
      const preset = PRESETS.find((p) => p.id === a.preset);
      if (!preset) return s;
      // Presets are action replays through this same reducer; the language and the version survive the jump.
      return preset.actions.reduce(apply, { ...initialState, lang: s.lang, version: s.version });
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
  { id: 'team-sorted', code: 'SM2', group: 'Shift performance', label: 'Picker team by fail rate', actions: [{ type: 'sort', key: 'failRate' }] },
  { id: 'range-6h', code: 'SM3', group: 'Shift performance', label: 'Last 6h', actions: [{ type: 'range', range: '6h' }] },
  { id: 'spike', code: 'SM4', group: 'Shift states', label: 'Late-order spike', actions: [{ type: 'scenario', scenario: 'spike' }] },
  { id: 'quiet', code: 'SM5', group: 'Shift states', label: 'Idle store · nothing late', actions: [{ type: 'scenario', scenario: 'quiet' }] },
  { id: 'closed', code: 'SM6', group: 'Shift states', label: 'Store closed', actions: [{ type: 'scenario', scenario: 'closed' }] },
  { id: 'slow', code: 'SM7', group: 'Data', label: 'Slow API · loading', actions: [{ type: 'scenario', scenario: 'slow' }] },
  { id: 'error', code: 'SM8', group: 'Data', label: 'API error', actions: [{ type: 'scenario', scenario: 'error' }] },
];

/** View code derived from the state, never hard-coded per screen. SM9 = any other combination the tester builds. */
export function codeFor(s: State): string {
  const byScenario: Partial<Record<Scenario, string>> = { spike: 'SM4', quiet: 'SM5', closed: 'SM6', slow: 'SM7', error: 'SM8' };
  const sorted = s.sort.key !== DEFAULT_SORT.key || s.sort.dir !== DEFAULT_SORT.dir;
  const ranged = s.range !== initialState.range;
  if (s.scenario !== 'normal') return !sorted && !ranged ? byScenario[s.scenario]! : 'SM9';
  if (sorted && ranged) return 'SM9';
  if (sorted) return s.sort.key === 'failRate' && s.sort.dir === 'desc' ? 'SM2' : 'SM9';
  if (ranged) return s.range === '6h' ? 'SM3' : 'SM9';
  return 'SM1';
}
