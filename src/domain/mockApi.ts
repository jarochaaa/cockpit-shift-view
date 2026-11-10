import type { FloorSnapshot, OrderTimingBucket, PickerTeamRow, Scenario, ShiftMetrics, Store } from './types';
import { MOCK_PICKER_TEAM, MOCK_SHIFT_METRICS, MOCK_STORE, floorFor, orderTimingFor } from './mockData';

// Every export here is async and shaped like a Postgres query result, so
// swapping to real Supabase calls (see schema.sql's views) means changing
// this file only — no component touches Supabase directly. The scenario
// argument only exists for the prototype (spike, closed store, slow/failing API).

const LATENCY_MS: Record<Scenario, number> = { normal: 150, spike: 150, quiet: 150, closed: 150, slow: 4000, error: 400 };

function respond<T>(scenario: Scenario, data: T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (scenario === 'error' ? reject(new Error('mock API error')) : resolve(data)), LATENCY_MS[scenario]);
  });
}

export function fetchStore(scenario: Scenario): Promise<Store> {
  return respond(scenario, scenario === 'closed' ? { ...MOCK_STORE, status: 'closed', vendorsOpen: 0 } : MOCK_STORE);
}

export function fetchFloor(scenario: Scenario): Promise<FloorSnapshot> {
  return respond(scenario, floorFor(scenario));
}

export function fetchShiftMetrics(scenario: Scenario): Promise<ShiftMetrics> {
  return respond(scenario, MOCK_SHIFT_METRICS);
}

export function fetchOrderTiming(scenario: Scenario): Promise<OrderTimingBucket[]> {
  return respond(scenario, orderTimingFor(scenario));
}

export function fetchPickerTeam(scenario: Scenario): Promise<PickerTeamRow[]> {
  return respond(scenario, MOCK_PICKER_TEAM);
}
