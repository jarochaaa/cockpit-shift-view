import { useCallback, useState } from 'react';
import { METRICS, byCat } from '../../domain/metrics';
import type { BlockId } from '../../domain/metrics';

export type EditBlock = 'live' | 'perf' | 'table';
const more = (b: BlockId) => METRICS.filter((x) => x.blocks.includes(b)).map((x) => x.key);

/** Every block accepts a fixed number of data points; the user picks which ones to show. */
export const BLOCKS: Record<EditBlock, { capacity: number; options: string[]; defaults: string[] }> = {
  live: { capacity: 4, options: byCat(['late', 'assign', 'unassigned', 'pickers', 'prep', 'instore', 'awt', 'pfr', 'fail', ...more('live')]), defaults: ['late', 'assign', 'unassigned', 'pickers'] },
  perf: { capacity: 6, options: byCat([...new Set(['instore', 'awt', 'pfr', 'fail', 'late', 'assign', 'prep', 'pickers', 'unassigned', 'nsfr', 'basket', 'refunds', 'forecast', ...more('perf'), ...more('extras')])]), defaults: ['instore', 'awt', 'pfr', 'fail', 'nsfr', 'basket'] },
  table: { capacity: 6, options: byCat(['late', 'assign', 'unassigned', 'pickers', 'prep', 'instore', 'awt', 'pfr', 'fail', 'age', ...more('table')]), defaults: ['late', 'assign', 'pickers', 'prep', 'awt', 'pfr'] },
};

const KEY = 'msm-data-layout-v2';
type Prefs = Partial<Record<EditBlock, string[]>>;

const read = (): Prefs => {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
};

/** Per-block selection, kept in the browser so each user keeps their own template. */
export function useLayoutPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(read);
  const get = (id: EditBlock): string[] => {
    const b = BLOCKS[id];
    const saved = (prefs[id] ?? []).filter((k) => b.options.includes(k));
    return (saved.length ? saved : b.defaults).slice(0, b.capacity);
  };
  const set = useCallback((id: EditBlock, keys: string[]) => {
    setPrefs((p) => {
      const next = { ...p, [id]: keys };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage blocked: the choice still applies for this visit */
      }
      return next;
    });
  }, []);
  return { get, set };
}
