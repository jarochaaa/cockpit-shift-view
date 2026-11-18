import { orderTimingFor } from '../../domain/mockData';
import { attentionFor, cancellationsFor, historyFor, peopleFor, shiftFor, stageOrdersFor, teamFor, vendorsFor } from '../../domain/prod';
import type { Scenario } from '../../domain/types';

// Same latency/error contract as the other mock endpoints, so every section shows its loading and error state.
const LATENCY: Record<Scenario, number> = { normal: 150, spike: 150, quiet: 150, empty: 150, closed: 150, slow: 4000, error: 400 };
const respond = <T,>(s: Scenario, data: T) =>
  new Promise<T>((ok, fail) => setTimeout(() => (s === 'error' ? fail(new Error('mock API error')) : ok(data)), LATENCY[s]));

export const fetchVendors = (s: Scenario) => respond(s, vendorsFor(s));
export const fetchAttention = (s: Scenario) => respond(s, attentionFor(s));
export const fetchPeople = (s: Scenario) => respond(s, peopleFor(s));
export const fetchStageOrders = (s: Scenario) => respond(s, stageOrdersFor(s));
export const fetchShift = (s: Scenario) => respond(s, shiftFor(s));
export const fetchTeam = (s: Scenario) => respond(s, teamFor(s));
export const fetchTiming = (s: Scenario) => respond(s, s === 'empty' ? [] : orderTimingFor(s));
export const fetchHistory = (s: Scenario) => respond(s, historyFor(s));
export const fetchCancellations = (s: Scenario) => respond(s, cancellationsFor(s));
