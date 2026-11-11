import type { CancellationRow, FloorSnapshot, OrderHistoryRow, OrderIssue, OrderTimingBucket, PickerTeamRow, Scenario, ShiftMetrics, Store, Warehouse } from './types';
import { MOCK_PICKER_TEAM, MOCK_SHIFT_METRICS, MOCK_STORE, MOCK_WAREHOUSES, cancellationsFor, floorFor, orderHistoryFor, orderIssuesFor, orderTimingFor } from './mockData';

// Every export here is async and shaped like a Postgres query result, so
// swapping to real Supabase calls (see schema.sql's views) means changing
// this file only — no component touches Supabase directly. The scenario
// argument only exists for the prototype (spike, closed store, slow/failing API).

const LATENCY_MS: Record<Scenario, number> = { normal: 150, spike: 150, quiet: 150, empty: 150, closed: 150, slow: 4000, error: 400 };

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
  if (scenario === 'empty') return respond(scenario, { ...MOCK_SHIFT_METRICS, successfulOrders: 0, receivedOrders: 0, issueRate: 0, avgAssignmentSeconds: 0, avgPickingSeconds: 0, avgPackingSeconds: 0, pfr: 0 });
  return respond(scenario, MOCK_SHIFT_METRICS);
}

export function fetchOrderTiming(scenario: Scenario): Promise<OrderTimingBucket[]> {
  return respond(scenario, scenario === 'empty' ? [] : orderTimingFor(scenario));
}

export function fetchPickerTeam(scenario: Scenario): Promise<PickerTeamRow[]> {
  return respond(scenario, scenario === 'empty' ? [] : MOCK_PICKER_TEAM);
}

export function fetchWarehouses(scenario: Scenario): Promise<Warehouse[]> {
  return respond(scenario, MOCK_WAREHOUSES);
}

export function fetchOrderHistory(scenario: Scenario): Promise<OrderHistoryRow[]> {
  return respond(scenario, orderHistoryFor(scenario));
}

export function fetchCancellations(scenario: Scenario): Promise<CancellationRow[]> {
  return respond(scenario, cancellationsFor(scenario));
}

export function fetchOrderIssues(scenario: Scenario): Promise<OrderIssue[]> {
  return respond(scenario, orderIssuesFor(scenario));
}
