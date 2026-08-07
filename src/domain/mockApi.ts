import type { ChromeStageCounts } from './types';
import {
  MOCK_NEEDS_ATTENTION,
  MOCK_ORDER_TIMING,
  MOCK_PEOPLE,
  MOCK_PICKER_ALERTS,
  MOCK_PICKER_TEAM,
  MOCK_SHIFT_METRICS,
  MOCK_SKU_ALERTS,
  MOCK_STORE,
} from './mockData';

// Every export here is async and shaped like a Postgres query result, so
// swapping to real Supabase calls (see schema.sql's views) means changing
// this file only — no component touches Supabase directly.

export async function fetchStore() {
  return MOCK_STORE;
}

export async function fetchChromeStageCounts(): Promise<ChromeStageCounts> {
  return {
    unassigned: 1,
    picking: 1,
    packing: 2,
    readyForRider: 1,
    idlePickers: MOCK_PEOPLE.filter((p) => p.status === 'idle').length,
    lateOrders: MOCK_NEEDS_ATTENTION.filter((o) => (o.overdueByMinutes ?? 0) > 0).length,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchNeedsAttention() {
  return MOCK_NEEDS_ATTENTION;
}

export async function fetchPeople() {
  return MOCK_PEOPLE;
}

export async function fetchShiftMetrics() {
  return MOCK_SHIFT_METRICS;
}

export async function fetchOrderTiming() {
  return MOCK_ORDER_TIMING;
}

export async function fetchPickerTeam() {
  return MOCK_PICKER_TEAM;
}

export async function fetchSkuAlerts() {
  return MOCK_SKU_ALERTS;
}

export async function fetchPickerAlerts() {
  return MOCK_PICKER_ALERTS;
}
