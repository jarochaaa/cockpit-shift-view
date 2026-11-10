import type { FloorOrder, FloorSnapshot, Store } from '../domain/types';
import type { Loaded } from './useMock';

/** Live state derived once from the store + floor snapshot, so both Cockpit versions show the same numbers. */
export function deriveLive(store: Loaded<Store>, floor: Loaded<FloorSnapshot>) {
  const f = floor.status === 'ready' ? floor.data : null;
  const closed = store.status === 'ready' && store.data.status === 'closed';
  const failed = store.status === 'error' || floor.status === 'error';
  const ready = f != null && !failed;
  const loading = !failed && (floor.status === 'loading' || store.status === 'loading');

  const count = (stage: FloorOrder['stage']) => f?.orders.filter((o) => o.stage === stage).length ?? 0;
  const late = (f?.orders.filter((o) => o.lateByMinutes != null) ?? []).sort((a, b) => b.lateByMinutes! - a.lateByMinutes!);
  const pickers = new Map(f?.pickers.map((p) => [p.pickerId, p]));
  const working = (f?.orders.filter((o) => o.pickerId && o.stage !== 'unassigned') ?? []).sort((a, b) => b.minutesInStage - a.minutesInStage);
  const idle = f?.pickers.filter((p) => p.status === 'idle').length ?? 0;
  // The live dot turns red only while there are open orders; an idle store keeps it neutral.
  const live = ready && !closed && f.orders.length > 0;
  const showLists = ready && !closed && (late.length > 0 || working.length > 0);

  return {
    ready,
    loading,
    closed,
    failed,
    live,
    showLists,
    late,
    working,
    idle,
    pickerName: (id: string | null) => (id ? (pickers.get(id)?.displayName ?? null) : null),
    stages: { unassigned: count('unassigned'), picking: count('picking'), packing: count('packing'), readyForRider: f?.readyForRider ?? 0 },
  };
}

export type Live = ReturnType<typeof deriveLive>;
