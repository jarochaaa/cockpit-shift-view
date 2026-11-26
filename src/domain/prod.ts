// Production-shaped data for the Store Management Cockpit, mirrored from the live
// plugin (talabat UAE, Nov 18 2026). Every name, id and amount is a placeholder:
// no customer, picker or rider data from production is copied (no PII).
import type { Scenario } from './types';

export type StageKey = 'unassigned' | 'picking' | 'packing' | 'ready_for_rider';
export type Activity = 'picking' | 'packing' | 'putaway' | 'receiving' | 'idle';
export type CancelledBy = 'Customer' | 'Transport' | 'Vendor';

export interface Vendor {
  name: string;
  open: boolean;
}

/** One row in "Needs attention": a cancelled order whose stock waits to go back, or a late order. */
export interface AttentionRow {
  orderId: string;
  kind: 'return' | 'late';
  units: number;
  lines: number;
  /** Minutes the row has been waiting (returns) or minutes past the promise time (late). */
  minutes: number;
}

export interface Person {
  id: string;
  name: string;
  activity: Activity;
  /** Seconds in the current activity. */
  seconds: number;
}

/** Open order behind a stage pill (the drawer list). */
export interface StageOrder {
  orderId: string;
  stage: StageKey;
  picker: string | null;
  rider: string | null;
  shelf: string | null;
  bags: number;
  seconds: number;
}

export interface TeamRow {
  id: string;
  name: string;
  assignment: number;
  picking: number;
  pickingPerItem: number;
  packing: number;
  pfr: number;
  failRate: number;
  successful: number;
  /** Seconds per SKU while receiving stock, null when the picker did not receive today. */
  receivingPerSku: number | null;
  receivingUnits: number;
}

export type HistoryStage = 'pending_assignment' | 'on_hold' | 'picking' | 'packaging' | 'ready_for_pickup' | 'awaiting_approval' | 'successful' | 'cancelled';

export interface HistoryRow {
  orderId: string;
  shortCode: string;
  stage: HistoryStage;
  fulfillment: 'full' | 'partial';
  /** 'finished' once picked up, 'cancelled', or minutes to pickup (negative = late). */
  timeToPickup: 'finished' | 'cancelled' | number;
  receivedAt: string;
  customer: string;
  picker: string | null;
  amount: number;
  cancelledAt: string | null;
}

export type CancelStatus = 'pending_return' | 'returned' | 'dismissed' | 'cancelled';

export interface CancelRow {
  orderId: string;
  shortCode: string;
  status: CancelStatus;
  receivedAt: string;
  customer: string;
  picker: string | null;
  amount: number;
  cancelledAt: string;
  reason: string | null;
  cancelledBy: CancelledBy;
}

export interface OrderItem {
  name: string;
  sku: string;
  picked: number;
  ordered: number;
  price: number;
}

export interface OrderEvent {
  at: string;
  label: string;
}

export interface OrderDetail {
  orderId: string;
  stage: HistoryStage;
  returnStatus: 'pending_return' | 'returned' | null;
  cancelledAt: string | null;
  shortCode: string;
  receivedAt: string;
  promisedAt: string;
  picker: string | null;
  shelf: string;
  bags: number | null;
  customer: string;
  payment: { type: string; method: string; original: number; confirmed: number };
  items: OrderItem[];
  events: OrderEvent[];
}

// ---------- helpers ----------
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const pad = (n: number) => String(n).padStart(2, '0');
export const pickerName = (n: number) => `Picker ${pad(n)}`;
const customer = (n: number) => `Customer ${pad(n)}`;
const rider = (n: number) => `Rider ${pad(n)}`;
const orderNo = (n: number) => String(4728300000 + n * 7919);

// ---------- store + vendors ----------
const VENDORS: Vendor[] = [
  { name: 'Unknown vendor', open: true },
  { name: 'Store Mart – Pet Shop', open: true },
  { name: 'Store Mart – Wellness', open: true },
  { name: 'Store Mart', open: false },
];
export const vendorsFor = (s: Scenario): Vendor[] => (s === 'closed' ? VENDORS.map((v) => ({ ...v, open: false })) : VENDORS);

// ---------- needs attention ----------
const RETURNS: AttentionRow[] = [
  [7, 1, 10014],
  [8, 8, 8571],
  [6, 3, 6623],
  [1, 1, 6577],
  [4, 4, 4360],
  [4, 4, 2787],
  [1, 1, 2769],
  [12, 9, 1666],
  [7, 6, 999],
  [18, 12, 4],
  [4, 3, 0],
].map(([units, lines, minutes], i) => ({ orderId: orderNo(i + 1), kind: 'return' as const, units, lines, minutes }));

const LATE: AttentionRow[] = [
  [15, 12],
  [8, 11],
  [4, 9],
  [12, 7],
  [6, 5],
].map(([units, minutes], i) => ({ orderId: orderNo(40 + i), kind: 'late' as const, units, lines: units, minutes }));

export function attentionFor(s: Scenario): AttentionRow[] {
  if (s === 'empty' || s === 'quiet') return [];
  if (s === 'spike') return [...LATE, ...RETURNS.slice(0, 4)];
  return RETURNS;
}

// ---------- people right now ----------
const PEOPLE: Person[] = [
  { id: 'p02', name: pickerName(2), activity: 'idle', seconds: 409 },
  { id: 'p09', name: pickerName(9), activity: 'idle', seconds: 1370 },
  { id: 'p03', name: pickerName(3), activity: 'putaway', seconds: 250 },
  { id: 'p01', name: pickerName(1), activity: 'picking', seconds: 185 },
  { id: 'p04', name: pickerName(4), activity: 'picking', seconds: 322 },
  { id: 'p05', name: pickerName(5), activity: 'packing', seconds: 96 },
  { id: 'p06', name: pickerName(6), activity: 'picking', seconds: 540 },
  { id: 'p07', name: pickerName(7), activity: 'packing', seconds: 210 },
  { id: 'p08', name: pickerName(8), activity: 'putaway', seconds: 145 },
  { id: 'p10', name: pickerName(10), activity: 'picking', seconds: 74 },
  { id: 'p11', name: pickerName(11), activity: 'packing', seconds: 388 },
  { id: 'p12', name: pickerName(12), activity: 'picking', seconds: 251 },
  { id: 'p13', name: pickerName(13), activity: 'putaway', seconds: 502 },
  { id: 'p14', name: pickerName(14), activity: 'picking', seconds: 133 },
];

export function peopleFor(s: Scenario): Person[] {
  if (s === 'empty' || s === 'closed') return [];
  if (s === 'quiet') return PEOPLE.map((p) => ({ ...p, activity: 'idle', seconds: p.seconds + 360 }));
  if (s === 'spike')
    return [
      { id: 'p01', name: pickerName(1), activity: 'picking', seconds: 660 },
      { id: 'p04', name: pickerName(4), activity: 'picking', seconds: 960 },
      { id: 'p05', name: pickerName(5), activity: 'packing', seconds: 360 },
      { id: 'p03', name: pickerName(3), activity: 'putaway', seconds: 250 },
      ...PEOPLE.filter((p) => p.activity === 'idle').map((p) => ({ ...p, seconds: p.seconds + 900 })),
    ];
  return PEOPLE;
}

// ---------- open orders by stage (stage pills + drawer) ----------
const shelf = (n: number) => `A-${pad(((n * 7) % 40) + 1)}`;
function stageOrders(counts: Record<StageKey, number>): StageOrder[] {
  const out: StageOrder[] = [];
  let n = 0;
  (Object.keys(counts) as StageKey[]).forEach((stage) => {
    for (let i = 0; i < counts[stage]; i++) {
      n++;
      out.push({
        orderId: orderNo(60 + n),
        stage,
        picker: stage === 'unassigned' ? null : pickerName(((n * 3) % 9) + 1),
        rider: stage === 'ready_for_rider' ? rider(n) : null,
        shelf: stage === 'ready_for_rider' || stage === 'packing' ? shelf(n) : null,
        bags: stage === 'ready_for_rider' ? (n % 3) + 1 : 0,
        seconds: [6712, 6450, 1590, 628, 420, 300, 240, 180][(n - 1) % 8],
      });
    }
  });
  return out;
}

export function stageOrdersFor(s: Scenario): StageOrder[] {
  if (s === 'empty' || s === 'quiet' || s === 'closed') return [];
  if (s === 'spike') return stageOrders({ unassigned: 5, picking: 2, packing: 2, ready_for_rider: 5 });
  return stageOrders({ unassigned: 0, picking: 0, packing: 0, ready_for_rider: 4 });
}

// ---------- shift performance ----------
export interface Shift {
  successful: number;
  assignment: number;
  picking: number;
  packing: number;
  dispatch: number | null;
  pfr: number;
  failRate: number;
}
export const shiftFor = (s: Scenario): Shift =>
  s === 'empty'
    ? { successful: 0, assignment: 0, picking: 0, packing: 0, dispatch: null, pfr: 0, failRate: 0 }
    : { successful: 148, assignment: 8, picking: 70, packing: 22, dispatch: 304, pfr: 0, failRate: 0.0327 };

// ---------- picker team ----------
const TEAM: TeamRow[] = [
  [1, 4, 35, 11, 12, 0, 0, 5, 11, 131],
  [2, 11, 59, 13, 20, 0, 0, 6, null, 0],
  [3, 8, 66, 11, 44, 0, 0.0667, 14, 9, 26],
  [4, 10, 59, 11, 10, 0, 0, 10, null, 0],
  [5, 11, 70, 13, 13, 0, 0, 24, 25, 607],
  [6, 8, 96, 19, 46, 0, 0, 12, null, 0],
  [7, 7, 72, 10, 27, 0, 0.0811, 34, null, 0],
  [8, 8, 45, 13, 21, 0, 0, 7, null, 0],
  [9, 7, 81, 15, 16, 0, 0.027, 36, null, 0],
].map(([n, assignment, picking, pickingPerItem, packing, pfr, failRate, successful, receivingPerSku, receivingUnits]) => ({
  id: `p${pad(n as number)}`,
  name: pickerName(n as number),
  assignment: assignment as number,
  picking: picking as number,
  pickingPerItem: pickingPerItem as number,
  packing: packing as number,
  pfr: pfr as number,
  failRate: failRate as number,
  successful: successful as number,
  receivingPerSku: receivingPerSku as number | null,
  receivingUnits: receivingUnits as number,
}));
export const teamFor = (s: Scenario): TeamRow[] => (s === 'empty' ? [] : TEAM);

/** Fail rate above this turns red and marks the row (production threshold). */
export const FAIL_ALERT = 0.05;

// ---------- order history ----------
const STAGE_CYCLE: HistoryStage[] = ['ready_for_pickup', 'ready_for_pickup', 'cancelled', 'cancelled', 'cancelled', 'successful', 'cancelled', 'successful', 'ready_for_pickup', 'ready_for_pickup', 'cancelled'];
export function historyFor(s: Scenario): HistoryRow[] {
  if (s === 'empty' || s === 'quiet') return [];
  const open: HistoryRow[] = stageOrdersFor(s)
    .filter((o) => o.stage !== 'ready_for_rider')
    .map((o, i) => ({
      orderId: o.orderId,
      shortCode: String(1980 + i),
      stage: o.stage === 'unassigned' ? 'pending_assignment' : o.stage === 'picking' ? 'picking' : 'packaging',
      fulfillment: 'full',
      timeToPickup: i < 3 ? -(6 - i * 2) : 8 + i,
      receivedAt: ago(4 + i * 2),
      customer: customer(i + 1),
      picker: o.picker,
      amount: 30 + i * 11.4,
      cancelledAt: null,
    }));
  const done: HistoryRow[] = Array.from({ length: 58 }, (_, i) => {
    const stage = i < STAGE_CYCLE.length ? STAGE_CYCLE[i] : i % 9 === 4 ? 'cancelled' : 'successful';
    return {
      orderId: orderNo(100 + i),
      shortCode: String(1975 - i),
      stage,
      fulfillment: i % 13 === 6 ? 'partial' : 'full',
      timeToPickup: stage === 'cancelled' ? 'cancelled' : 'finished',
      receivedAt: ago(9 + i * 7),
      customer: customer(10 + (i % 60)),
      picker: pickerName((i % 9) + 1),
      amount: 22.5 + ((i * 37) % 160) + 0.38,
      cancelledAt: stage === 'cancelled' ? ago(i * 7) : null,
    };
  });
  return [...open, ...done];
}

// ---------- cancellations ----------
const REASONS: [string | null, CancelledBy][] = [
  ['Unprofessional behaviour', 'Transport'],
  ['Unable to find', 'Customer'],
  ['No courier', 'Transport'],
  ['Unprofessional behaviour', 'Transport'],
  ['Unprofessional behaviour', 'Transport'],
  ['Fraud prank', 'Customer'],
  ['Food quality spillage', 'Vendor'],
  ['Unprofessional behaviour', 'Transport'],
  ['Unable to pay', 'Customer'],
  ['No courier', 'Transport'],
  ['Late delivery', 'Transport'],
  ['Too busy', 'Vendor'],
  ['Address incomplete misstated', 'Customer'],
  ['Mistake error', 'Customer'],
  ['Order modification not possible', 'Customer'],
  ['Duplicate order', 'Customer'],
  ['Reason unknown', 'Customer'],
  [null, 'Vendor'],
];
export function cancellationsFor(s: Scenario): CancelRow[] {
  if (s === 'empty' || s === 'quiet' || s === 'closed') return [];
  const pending: CancelRow[] = RETURNS.slice(0, 9).map((r, i) => ({
    orderId: r.orderId,
    shortCode: String(4153 + i * 611).slice(0, 4),
    status: 'pending_return',
    receivedAt: ago(r.minutes + 40),
    customer: customer(i + 1),
    picker: pickerName((i % 9) + 1),
    amount: 26.14 + i * 17.3,
    cancelledAt: ago(r.minutes),
    reason: REASONS[i][0],
    cancelledBy: REASONS[i][1],
  }));
  const settled: CancelRow[] = Array.from({ length: 16 }, (_, i) => ({
    orderId: orderNo(200 + i),
    shortCode: String(613 - i * 37),
    status: i === 14 ? 'dismissed' : i % 5 === 4 ? 'cancelled' : 'returned',
    receivedAt: ago(90 + i * 95),
    customer: customer(30 + i),
    picker: pickerName((i % 9) + 1),
    amount: 30.22 + ((i * 41) % 180),
    cancelledAt: ago(60 + i * 95),
    reason: REASONS[(i + 9) % REASONS.length][0],
    cancelledBy: REASONS[(i + 9) % REASONS.length][1],
  }));
  return [...pending, ...settled];
}

// ---------- order detail (drawer) ----------
const ITEMS: [string, string, number][] = [
  ['Arabic Loaf Bread, Medium, 5 Pieces', '500169', 2.75],
  ['Long Life Sliced White Bread, 600g', '903082', 2.72],
  ['Potato Chips, 15g', '501432', 0.75],
  ['Instant Coffee Jar, 47.5g', '901601', 12.75],
  ['Cream Cheese Jar, 240g', '504238', 11.49],
  ['Peanut Butter Creamy, 340g', '500603', 8.95],
  ['Body Lotion, 400ml', '900341', 16.47],
  ['Petroleum Jelly, 100ml', '900344', 7.46],
  ['Water Bottle Pack, 24 x 200ml', '506855', 12.0],
  ['Gentle Cleanser, 236ml', '929059', 68.0],
];

export function orderDetail(orderId: string, s: Scenario): OrderDetail {
  const seed = Number(orderId.slice(-3)) || 1;
  const cancel = cancellationsFor(s === 'empty' ? 'normal' : s).find((c) => c.orderId === orderId);
  const hist = historyFor(s === 'empty' ? 'normal' : s).find((h) => h.orderId === orderId);
  const stage: HistoryStage = cancel ? 'cancelled' : (hist?.stage ?? 'ready_for_pickup');
  const n = (seed % 6) + 3;
  const items = Array.from({ length: n }, (_, i) => {
    const [name, sku, price] = ITEMS[(seed + i) % ITEMS.length];
    const qty = i === 1 ? 4 : 1;
    return { name, sku, picked: qty, ordered: qty, price: price * qty };
  });
  const total = items.reduce((t, i) => t + i.price, 0);
  const received = cancel?.receivedAt ?? hist?.receivedAt ?? ago(40);
  const r = new Date(received).getTime();
  const at = (m: number) => new Date(r + m * 1000).toISOString();
  const events: OrderEvent[] = [
    { at: at(0), label: 'Order placed by customer' },
    { at: at(1), label: 'Assigned to rider' },
    { at: at(3), label: 'Picking started' },
    { at: at(176), label: 'Ready for pickup' },
    { at: at(303), label: 'Picked up by rider' },
  ];
  if (stage === 'cancelled') events.push({ at: cancel?.cancelledAt ?? at(1440), label: 'Order cancelled' });
  return {
    orderId,
    stage,
    returnStatus: cancel ? (cancel.status === 'pending_return' ? 'pending_return' : cancel.status === 'returned' ? 'returned' : null) : null,
    cancelledAt: cancel?.cancelledAt ?? hist?.cancelledAt ?? null,
    shortCode: `#${cancel?.shortCode ?? hist?.shortCode ?? '5113'}`,
    receivedAt: received,
    promisedAt: at(1020),
    picker: cancel?.picker ?? hist?.picker ?? pickerName(4),
    shelf: shelf(seed),
    bags: seed % 2 ? 1 : null,
    customer: cancel?.customer ?? hist?.customer ?? customer(1),
    payment: seed % 2 ? { type: 'Cash on delivery', method: 'Cash', original: total, confirmed: total } : { type: 'Prepaid', method: 'Credit Card', original: total, confirmed: total },
    items,
    events,
  };
}

// ---------- formatting (production style) ----------
/** 100 → "1m 40s", 8 → "8s", 3725 → "1h 2m 5s". */
export function duration(seconds: number): string {
  const s = Math.round(seconds);
  if (s <= 0) return '0s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : '', r && !h ? `${r}s` : ''].filter(Boolean).join(' ') || '0s';
}
/** Waiting time for a return: "<1m", "4m", "16h 39m". */
export function waiting(minutes: number): string {
  if (minutes < 1) return '<1m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}
export const aed = (n: number) => `AED ${n.toFixed(2)}`;
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();
