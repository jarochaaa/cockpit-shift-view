import type {
  CancellationRow,
  FloorSnapshot,
  HistoryStage,
  OrderHistoryRow,
  OrderIssue,
  Warehouse,
  OrderTimingBucket,
  PickerTeamRow,
  Scenario,
  ShiftMetrics,
  Store,
} from './types';

// No PII: placeholder store, "Picker NN" names and short fake order ids (v4 §5).
const pickerName = (n: number) => `Picker ${String(n).padStart(2, '0')}`;

export const MOCK_STORE: Store = {
  id: 'store_1',
  name: 'QA_001_Test_Store',
  externalRef: 'QA_001',
  status: 'open',
  vendorsOpen: 4,
  vendorsTotal: 4,
};

const FLOOR_NORMAL: FloorSnapshot = {
  readyForRider: 2,
  orders: [
    { orderId: 'o1', externalOrderId: '67891', stage: 'picking', items: 14, minutesInStage: 9, lateByMinutes: 6, pfPending: false, pickerId: 'p02' },
    { orderId: 'o2', externalOrderId: '67892', stage: 'unassigned', items: 5, minutesInStage: 8, lateByMinutes: 3, pfPending: false, pickerId: null },
    { orderId: 'o3', externalOrderId: '67893', stage: 'packing', items: 7, minutesInStage: 2, lateByMinutes: null, pfPending: true, pickerId: 'p05' },
    { orderId: 'o4', externalOrderId: '67894', stage: 'picking', items: 9, minutesInStage: 1, lateByMinutes: null, pfPending: false, pickerId: 'p01' },
    { orderId: 'o5', externalOrderId: '67895', stage: 'packing', items: 3, minutesInStage: 1, lateByMinutes: null, pfPending: false, pickerId: 'p07' },
    { orderId: 'o6', externalOrderId: '67896', stage: 'unassigned', items: 11, minutesInStage: 2, lateByMinutes: null, pfPending: false, pickerId: null },
  ],
  pickers: [
    { pickerId: 'p01', displayName: pickerName(1), status: 'picking', minutesInStatus: 1, ordersToday: 62, failRate: 0 },
    { pickerId: 'p02', displayName: pickerName(2), status: 'picking', minutesInStatus: 9, ordersToday: 65, failRate: 0.0152 },
    { pickerId: 'p05', displayName: pickerName(5), status: 'packing', minutesInStatus: 2, ordersToday: 50, failRate: 0.0196 },
    { pickerId: 'p07', displayName: pickerName(7), status: 'packing', minutesInStatus: 1, ordersToday: 74, failRate: 0 },
    { pickerId: 'p03', displayName: pickerName(3), status: 'idle', minutesInStatus: 53, ordersToday: 19, failRate: 0.05 },
    { pickerId: 'p04', displayName: pickerName(4), status: 'idle', minutesInStatus: 31, ordersToday: 27, failRate: 0 },
    { pickerId: 'p10', displayName: pickerName(10), status: 'idle', minutesInStatus: 19, ordersToday: 33, failRate: 0 },
    { pickerId: 'p06', displayName: pickerName(6), status: 'idle', minutesInStatus: 12, ordersToday: 21, failRate: 0.0455 },
    { pickerId: 'p08', displayName: pickerName(8), status: 'idle', minutesInStatus: 4, ordersToday: 12, failRate: 0 },
    { pickerId: 'p09', displayName: pickerName(9), status: 'offline', minutesInStatus: 96, ordersToday: 4, failRate: 0 },
    { pickerId: 'p11', displayName: pickerName(11), status: 'offline', minutesInStatus: 40, ordersToday: 20, failRate: 0.0588 },
  ],
};

// A bad half hour: more orders breach their promise time while pickers sit idle.
const FLOOR_SPIKE: FloorSnapshot = {
  readyForRider: 5,
  orders: [
    { orderId: 's1', externalOrderId: '67901', stage: 'unassigned', items: 8, minutesInStage: 14, lateByMinutes: 11, pfPending: false, pickerId: null },
    { orderId: 's2', externalOrderId: '67902', stage: 'unassigned', items: 4, minutesInStage: 12, lateByMinutes: 9, pfPending: false, pickerId: null },
    { orderId: 's3', externalOrderId: '67903', stage: 'unassigned', items: 12, minutesInStage: 10, lateByMinutes: 7, pfPending: false, pickerId: null },
    { orderId: 's4', externalOrderId: '67904', stage: 'picking', items: 15, minutesInStage: 16, lateByMinutes: 12, pfPending: false, pickerId: 'p02' },
    { orderId: 's5', externalOrderId: '67905', stage: 'picking', items: 6, minutesInStage: 11, lateByMinutes: 5, pfPending: false, pickerId: 'p01' },
    { orderId: 's6', externalOrderId: '67906', stage: 'packing', items: 9, minutesInStage: 6, lateByMinutes: 4, pfPending: true, pickerId: 'p05' },
    { orderId: 's7', externalOrderId: '67907', stage: 'packing', items: 3, minutesInStage: 2, lateByMinutes: null, pfPending: false, pickerId: 'p07' },
    { orderId: 's8', externalOrderId: '67908', stage: 'unassigned', items: 7, minutesInStage: 3, lateByMinutes: null, pfPending: false, pickerId: null },
    { orderId: 's9', externalOrderId: '67909', stage: 'unassigned', items: 2, minutesInStage: 1, lateByMinutes: null, pfPending: false, pickerId: null },
  ],
  pickers: FLOOR_NORMAL.pickers.map((p) =>
    p.status === 'idle' ? { ...p, minutesInStatus: p.minutesInStatus + 15 } : p.status === 'offline' && p.pickerId === 'p11' ? { ...p, status: 'idle', minutesInStatus: 22 } : p,
  ),
};

const FLOOR_QUIET: FloorSnapshot = {
  readyForRider: 0,
  orders: [],
  pickers: FLOOR_NORMAL.pickers.map((p) => (p.status === 'offline' ? p : { ...p, status: 'idle', minutesInStatus: 6 })),
};

const FLOOR_CLOSED: FloorSnapshot = {
  readyForRider: 0,
  orders: [],
  pickers: FLOOR_NORMAL.pickers.map((p) => ({ ...p, status: 'offline', minutesInStatus: 120 })),
};

export function floorFor(scenario: Scenario): FloorSnapshot {
  if (scenario === 'spike') return FLOOR_SPIKE;
  if (scenario === 'quiet') return FLOOR_QUIET;
  if (scenario === 'empty') return { readyForRider: 0, orders: [], pickers: [] };
  if (scenario === 'closed') return FLOOR_CLOSED;
  return FLOOR_NORMAL;
}

export const MOCK_SHIFT_METRICS: ShiftMetrics = {
  successfulOrders: 387,
  receivedOrders: 395,
  issueRate: 0.0102,
  avgAssignmentSeconds: 18,
  avgPickingSeconds: 78,
  avgPackingSeconds: 18,
  pfr: 0.0052,
  updatedAt: minutesAgo(4),
};

// Picker team totals add up to the 387 successful orders in Shift metrics.
const TEAM_SECONDS: Record<string, [number, number, number]> = {
  p01: [12, 84, 12], p02: [12, 84, 12], p03: [18, 48, 24], p04: [54, 66, 42], p05: [18, 90, 18], p06: [6, 78, 18],
  p07: [18, 72, 12], p08: [6, 78, 18], p09: [18, 114, 12], p10: [18, 66, 12], p11: [30, 114, 30],
};
const TEAM_PFR: Record<string, number> = { p05: 0.02, p07: 0.0135 };

export const MOCK_PICKER_TEAM: PickerTeamRow[] = FLOOR_NORMAL.pickers.map((p) => {
  const [assign, pick, pack] = TEAM_SECONDS[p.pickerId];
  return {
    pickerId: p.pickerId,
    displayName: p.displayName,
    ordersCount: p.ordersToday,
    avgAssignmentSeconds: assign,
    avgPickingSeconds: pick,
    avgPackingSeconds: pack,
    pfr: TEAM_PFR[p.pickerId] ?? 0,
    failRate: p.failRate,
  };
});

export function orderTimingFor(scenario: Scenario): OrderTimingBucket[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const isNightLull = hour >= 3 && hour <= 7;
    const isSpikeHour = scenario === 'spike' && hour >= 21;
    const quiet = scenario === 'quiet' ? 0.4 : 1;
    return {
      bucketStart: hourAgo(23 - hour),
      assignmentAvgSeconds: isNightLull ? 8 : (isSpikeHour ? 90 : 18 + Math.round(Math.sin(hour) * 10)),
      pickingAvgSeconds: isNightLull ? 20 : (isSpikeHour ? 150 : 70 + Math.round(Math.cos(hour / 2) * 30)),
      packingAvgSeconds: isNightLull ? 6 : 15 + Math.round(Math.sin(hour / 3) * 8),
      completedCount: isNightLull ? 1 : Math.round((8 + Math.round(Math.abs(Math.sin(hour / 2)) * 20)) * quiet),
    };
  });
}

// ---- Store Management Cockpit sections. Placeholder names only (no PII), BHD amounts. ----

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'wh-qa-001', name: 'QA_001_Test_Store', type: 'WAREHOUSE_TYPE_DMART' },
  { id: 'wh-qa-002', name: 'QA_002_Live_Vendor_Test', type: 'WAREHOUSE_TYPE_DMART' },
  { id: 'wh-qa-003', name: 'QA_003_Test_5-1', type: 'WAREHOUSE_TYPE_DMART' },
  { id: 'wh-qa-004', name: 'QA_004_Ticket_Test', type: 'WAREHOUSE_TYPE_DMART' },
];

const customer = (n: number) => `Customer ${String(n).padStart(2, '0')}`;
const short = (n: number) => `${['K', 'M', 'R', 'T', 'W'][n % 5]}${(4200 + n * 37) % 9000}`;

// Open orders come from the live floor; the rest of the day is finished work.
function historyFor(floor: FloorSnapshot): OrderHistoryRow[] {
  const open: OrderHistoryRow[] = floor.orders.map((o, i) => ({
    orderId: o.externalOrderId,
    shortCode: short(i),
    stage: (o.stage === 'unassigned' ? 'pending_assignment' : o.stage === 'packing' ? (o.pfPending ? 'awaiting_approval' : 'packaging') : 'picking') as HistoryStage,
    fulfillment: o.pfPending ? 'partial' : 'full',
    timeToPickupMinutes: o.lateByMinutes != null ? -o.lateByMinutes : 12 - o.minutesInStage,
    receivedAt: minutesAgo(o.minutesInStage + 4),
    customer: customer(i + 1),
    picker: o.pickerId ? floor.pickers.find((p) => p.pickerId === o.pickerId)?.displayName ?? null : null,
    amount: 4.25 + i * 3.1,
    cancelledAt: null,
  }));
  const done: OrderHistoryRow[] = Array.from({ length: 34 }, (_, i) => {
    const cancelled = i % 11 === 4;
    const ready = i < 3;
    return {
      orderId: String(67880 - i),
      shortCode: short(i + 10),
      stage: cancelled ? 'cancelled' : ready ? 'ready_for_pickup' : 'successful',
      fulfillment: i % 7 === 3 ? 'partial' : 'full',
      timeToPickupMinutes: ready ? 4 - i : null,
      receivedAt: minutesAgo(18 + i * 21),
      customer: customer(i + 20),
      picker: `Picker ${String((i % 11) + 1).padStart(2, '0')}`,
      amount: 2.5 + ((i * 7) % 23) + 0.75,
      cancelledAt: cancelled ? minutesAgo(10 + i * 21) : null,
    };
  });
  return [...open, ...done];
}

export function orderHistoryFor(scenario: Scenario): OrderHistoryRow[] {
  return scenario === 'quiet' || scenario === 'empty' ? [] : historyFor(floorFor(scenario));
}

const CANCELLATIONS: CancellationRow[] = [
  { orderId: '67876', shortCode: 'R4533', cancelledAt: minutesAgo(26), reason: 'Customer cancelled', items: 6, picker: 'Picker 04', status: 'pending_return' },
  { orderId: '67869', shortCode: 'K4422', cancelledAt: minutesAgo(52), reason: 'Item unavailable', items: 3, picker: 'Picker 02', status: 'pending_return' },
  { orderId: '67858', shortCode: 'W4718', cancelledAt: minutesAgo(118), reason: 'Rider not assigned', items: 9, picker: 'Picker 07', status: 'pending_return' },
  { orderId: '67847', shortCode: 'M4310', cancelledAt: minutesAgo(205), reason: 'Customer cancelled', items: 2, picker: 'Picker 01', status: 'settled' },
  { orderId: '67836', shortCode: 'T4629', cancelledAt: minutesAgo(340), reason: 'Payment failed', items: 4, picker: null, status: 'settled' },
];

export function cancellationsFor(scenario: Scenario): CancellationRow[] {
  return scenario === 'quiet' || scenario === 'empty' || scenario === 'closed' ? [] : CANCELLATIONS;
}

const ISSUES: OrderIssue[] = [
  { id: 'i1', orderId: '67881', shortCode: 'K4199', signal: 'complaint', reason: 'missing', cause: 'in_store', item: 'Fresh Milk 1L', picker: 'Picker 03', amount: 0.85, reviewed: false, daysAgo: 0, at: minutesAgo(35) },
  { id: 'i2', orderId: '67874', shortCode: 'M4291', signal: 'refund', reason: 'quality', cause: 'in_store', item: 'Free-range Eggs 12pk', picker: 'Picker 06', amount: 1.9, reviewed: false, daysAgo: 0, at: minutesAgo(80) },
  { id: 'i3', orderId: '67870', shortCode: 'R4411', signal: 'compensation', reason: 'late', cause: 'delivery', item: 'Sourdough Loaf', picker: 'Picker 02', amount: 1.0, reviewed: false, daysAgo: 0, at: minutesAgo(140) },
  { id: 'i4', orderId: '67862', shortCode: 'T4502', signal: 'complaint', reason: 'wrong_item', cause: 'in_store', item: 'Greek Yoghurt 500g', picker: 'Picker 03', amount: 1.25, reviewed: true, daysAgo: 0, at: minutesAgo(210) },
  { id: 'i5', orderId: '67851', shortCode: 'W4633', signal: 'review', reason: 'other', cause: 'customer_preference', item: 'Basmati Rice 5kg', picker: 'Picker 11', amount: null, reviewed: false, daysAgo: 0, at: minutesAgo(260) },
  { id: 'i6', orderId: '67844', shortCode: 'K4380', signal: 'refund', reason: 'expired', cause: 'in_store', item: 'Fresh Milk 1L', picker: 'Picker 06', amount: 0.85, reviewed: true, daysAgo: 1, at: minutesAgo(1500) },
  { id: 'i7', orderId: '67833', shortCode: 'M4264', signal: 'complaint', reason: 'unmapped', cause: 'unclear', item: 'Chicken Breast 1kg', picker: null, amount: null, reviewed: false, daysAgo: 2, at: minutesAgo(3000) },
];

export function orderIssuesFor(scenario: Scenario): OrderIssue[] {
  return scenario === 'quiet' || scenario === 'empty' || scenario === 'closed' ? [] : ISSUES;
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hourAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export const warehouseName = (id: string) => MOCK_WAREHOUSES.find((w) => w.id === id)?.name ?? MOCK_STORE.name;
