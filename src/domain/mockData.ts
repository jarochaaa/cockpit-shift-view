import type {
  NeedsAttentionRow,
  OrderTimingBucket,
  PersonRow,
  PickerAlertRow,
  PickerTeamRow,
  ShiftMetrics,
  SkuAlertRow,
  Store,
} from './types';

export const MOCK_STORE: Store = {
  id: 'store_1',
  name: 'UAE_Dubai_DS_8 — Jumeira',
  externalRef: 'UAE_Dubai_DS_8',
  status: 'open',
  vendorsOpen: 4,
  vendorsTotal: 4,
};

// Deliberately more rows than fit in one box height — stress-tests the
// internal scroll every box now has (see Cockpit-Shift-View-IA-v1.md §3).
export const MOCK_NEEDS_ATTENTION: NeedsAttentionRow[] = [
  { orderId: 'o1', externalOrderId: '3802810388', stage: 'picking', assignedPickerName: 'DUL Rashid Rashid', overdueByMinutes: 6, pfStatus: 'none' },
  { orderId: 'o2', externalOrderId: '3802810401', stage: 'unassigned', assignedPickerName: null, overdueByMinutes: 3, pfStatus: 'none' },
  { orderId: 'o3', externalOrderId: '3802810415', stage: 'packing', assignedPickerName: 'Kajal Kumar', overdueByMinutes: null, pfStatus: 'pending' },
  { orderId: 'o4', externalOrderId: '3802810430', stage: 'picking', assignedPickerName: 'Omar Al-Farsi', overdueByMinutes: 11, pfStatus: 'none' },
  { orderId: 'o5', externalOrderId: '3802810442', stage: 'unassigned', assignedPickerName: null, overdueByMinutes: 9, pfStatus: 'none' },
  { orderId: 'o6', externalOrderId: '3802810457', stage: 'packing', assignedPickerName: 'Lucia Fernandez', overdueByMinutes: null, pfStatus: 'pending' },
  { orderId: 'o7', externalOrderId: '3802810468', stage: 'picking', assignedPickerName: 'Ahmed Zayed', overdueByMinutes: 4, pfStatus: 'none' },
  { orderId: 'o8', externalOrderId: '3802810475', stage: 'unassigned', assignedPickerName: null, overdueByMinutes: 2, pfStatus: 'none' },
  { orderId: 'o9', externalOrderId: '3802810481', stage: 'packing', assignedPickerName: 'Nina Petrova', overdueByMinutes: 7, pfStatus: 'none' },
];

export const MOCK_PEOPLE: PersonRow[] = [
  { pickerId: 'p1', displayName: 'DUL Alber Yaw', status: 'picking', statusChangedAt: minutesAgo(1.3), currentOrderExternalId: '3802810423' },
  { pickerId: 'p2', displayName: 'DUL Rashid Rashid', status: 'picking', statusChangedAt: minutesAgo(4.8), currentOrderExternalId: '3802810388' },
  { pickerId: 'p3', displayName: 'Anthony Baguio Zolina', status: 'idle', statusChangedAt: minutesAgo(52.8), currentOrderExternalId: null },
  { pickerId: 'p4', displayName: 'TG Jawad Raziq', status: 'idle', statusChangedAt: minutesAgo(31.4), currentOrderExternalId: null },
  { pickerId: 'p5', displayName: 'DUL Eric Tagoe', status: 'idle', statusChangedAt: minutesAgo(18.7), currentOrderExternalId: null },
  { pickerId: 'p12', displayName: 'Omar Al-Farsi', status: 'picking', statusChangedAt: minutesAgo(2.1), currentOrderExternalId: '3802810430' },
  { pickerId: 'p13', displayName: 'Lucia Fernandez', status: 'packing', statusChangedAt: minutesAgo(0.6), currentOrderExternalId: '3802810457' },
  { pickerId: 'p14', displayName: 'Ahmed Zayed', status: 'picking', statusChangedAt: minutesAgo(3.4), currentOrderExternalId: '3802810468' },
  { pickerId: 'p15', displayName: 'Nina Petrova', status: 'packing', statusChangedAt: minutesAgo(1.9), currentOrderExternalId: '3802810481' },
  { pickerId: 'p16', displayName: 'Kwame Asante', status: 'idle', statusChangedAt: minutesAgo(9.2), currentOrderExternalId: null },
  { pickerId: 'p17', displayName: 'Priya Nair', status: 'idle', statusChangedAt: minutesAgo(24.5), currentOrderExternalId: null },
  { pickerId: 'p18', displayName: 'Yusuf Demir', status: 'offline', statusChangedAt: minutesAgo(96), currentOrderExternalId: null },
  { pickerId: 'p19', displayName: 'Fatima Haddad', status: 'idle', statusChangedAt: minutesAgo(41.2), currentOrderExternalId: null },
  { pickerId: 'p20', displayName: 'Carlos Medina', status: 'picking', statusChangedAt: minutesAgo(5.7), currentOrderExternalId: '3802810490' },
  { pickerId: 'p21', displayName: 'Boris Ivanov', status: 'idle', statusChangedAt: minutesAgo(14.3), currentOrderExternalId: null },
];

export const MOCK_PICKER_TEAM: PickerTeamRow[] = [
  { pickerId: 'p1', displayName: 'DUL Alber Yaw', ordersCount: 62, avgAssignmentSeconds: 12, avgPickingSeconds: 84, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p6', displayName: 'John Donell Pilaspilas Sustiguer', ordersCount: 27, avgAssignmentSeconds: 54, avgPickingSeconds: 66, avgPackingSeconds: 42, pfr: 0, failRate: 0 },
  { pickerId: 'p7', displayName: 'Sharlene Marcia Maponga', ordersCount: 4, avgAssignmentSeconds: 18, avgPickingSeconds: 114, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p8', displayName: 'Reinheart Musngi', ordersCount: 50, avgAssignmentSeconds: 18, avgPickingSeconds: 90, avgPackingSeconds: 18, pfr: 0, failRate: 0.0196 },
  { pickerId: 'p2', displayName: 'DUL Rashid Rashid', ordersCount: 65, avgAssignmentSeconds: 12, avgPickingSeconds: 84, avgPackingSeconds: 12, pfr: 0, failRate: 0.0152 },
  { pickerId: 'p9', displayName: 'Mohammad Tawqueer Raza', ordersCount: 21, avgAssignmentSeconds: 6, avgPickingSeconds: 78, avgPackingSeconds: 18, pfr: 0, failRate: 0.0455 },
  { pickerId: 'p5', displayName: 'DUL Eric Tagoe', ordersCount: 74, avgAssignmentSeconds: 18, avgPickingSeconds: 72, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p10', displayName: 'Ederlyn Centino', ordersCount: 12, avgAssignmentSeconds: 6, avgPickingSeconds: 78, avgPackingSeconds: 18, pfr: 0, failRate: 0 },
  { pickerId: 'p11', displayName: 'Kajal Kumar', ordersCount: 33, avgAssignmentSeconds: 18, avgPickingSeconds: 66, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p3', displayName: 'Anthony Baguio Zolina', ordersCount: 19, avgAssignmentSeconds: 18, avgPickingSeconds: 48, avgPackingSeconds: 24, pfr: 0, failRate: 0.05 },
  { pickerId: 'p12', displayName: 'Omar Al-Farsi', ordersCount: 41, avgAssignmentSeconds: 12, avgPickingSeconds: 90, avgPackingSeconds: 18, pfr: 0, failRate: 0 },
  { pickerId: 'p13', displayName: 'Lucia Fernandez', ordersCount: 58, avgAssignmentSeconds: 6, avgPickingSeconds: 72, avgPackingSeconds: 12, pfr: 0.0086, failRate: 0 },
  { pickerId: 'p14', displayName: 'Ahmed Zayed', ordersCount: 36, avgAssignmentSeconds: 24, avgPickingSeconds: 96, avgPackingSeconds: 24, pfr: 0, failRate: 0.0278 },
  { pickerId: 'p15', displayName: 'Nina Petrova', ordersCount: 47, avgAssignmentSeconds: 12, avgPickingSeconds: 78, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p16', displayName: 'Kwame Asante', ordersCount: 29, avgAssignmentSeconds: 18, avgPickingSeconds: 102, avgPackingSeconds: 18, pfr: 0, failRate: 0.0345 },
  { pickerId: 'p17', displayName: 'Priya Nair', ordersCount: 55, avgAssignmentSeconds: 6, avgPickingSeconds: 66, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p18', displayName: 'Yusuf Demir', ordersCount: 8, avgAssignmentSeconds: 30, avgPickingSeconds: 108, avgPackingSeconds: 30, pfr: 0, failRate: 0.125 },
  { pickerId: 'p19', displayName: 'Fatima Haddad', ordersCount: 44, avgAssignmentSeconds: 12, avgPickingSeconds: 84, avgPackingSeconds: 18, pfr: 0, failRate: 0 },
  { pickerId: 'p20', displayName: 'Carlos Medina', ordersCount: 39, avgAssignmentSeconds: 18, avgPickingSeconds: 90, avgPackingSeconds: 18, pfr: 0, failRate: 0.0256 },
  { pickerId: 'p21', displayName: 'Boris Ivanov', ordersCount: 22, avgAssignmentSeconds: 24, avgPickingSeconds: 96, avgPackingSeconds: 24, pfr: 0, failRate: 0.0455 },
  { pickerId: 'p22', displayName: 'Chidi Okafor', ordersCount: 51, avgAssignmentSeconds: 6, avgPickingSeconds: 72, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p23', displayName: 'Mei Ling Tan', ordersCount: 63, avgAssignmentSeconds: 6, avgPickingSeconds: 60, avgPackingSeconds: 12, pfr: 0, failRate: 0 },
  { pickerId: 'p24', displayName: 'Rosa Delgado', ordersCount: 17, avgAssignmentSeconds: 30, avgPickingSeconds: 114, avgPackingSeconds: 30, pfr: 0, failRate: 0.0588 },
  { pickerId: 'p25', displayName: 'Aisha Rahman', ordersCount: 34, avgAssignmentSeconds: 12, avgPickingSeconds: 78, avgPackingSeconds: 18, pfr: 0, failRate: 0.0294 },
];

export const MOCK_SHIFT_METRICS: ShiftMetrics = {
  successfulOrders: 387,
  issueRate: 0.0102,
  avgAssignmentSeconds: 18,
  avgPickingSeconds: 78,
  avgPackingSeconds: 18,
  pfr: 0,
  updatedAt: minutesAgo(4),
};

export const MOCK_ORDER_TIMING: OrderTimingBucket[] = Array.from({ length: 24 }, (_, hour) => {
  const isNightLull = hour >= 3 && hour <= 7;
  return {
    bucketStart: hourAgo(23 - hour),
    assignmentAvgSeconds: isNightLull ? 8 : 18 + Math.round(Math.sin(hour) * 10),
    pickingAvgSeconds: isNightLull ? 20 : 70 + Math.round(Math.cos(hour / 2) * 30),
    packingAvgSeconds: isNightLull ? 6 : 15 + Math.round(Math.sin(hour / 3) * 8),
    completedCount: isNightLull ? 1 : 8 + Math.round(Math.abs(Math.sin(hour / 2)) * 20),
  };
});

// Preview content — see the note on SkuAlertRow/PickerAlertRow in types.ts.
export const MOCK_SKU_ALERTS: SkuAlertRow[] = [
  { sku: 'SKU-10234', name: 'Fresh Milk 1L', soh: 2, threshold: 10, severity: 'error' },
  { sku: 'SKU-10877', name: 'Basmati Rice 5kg', soh: 4, threshold: 15, severity: 'error' },
  { sku: 'SKU-11290', name: 'Free-range Eggs 12pk', soh: 6, threshold: 20, severity: 'warning' },
  { sku: 'SKU-11304', name: 'Greek Yoghurt 500g', soh: 3, threshold: 12, severity: 'error' },
  { sku: 'SKU-11477', name: 'Chicken Breast 1kg', soh: 5, threshold: 18, severity: 'warning' },
  { sku: 'SKU-11602', name: 'Sourdough Loaf', soh: 1, threshold: 8, severity: 'error' },
  { sku: 'SKU-11810', name: 'Orange Juice 1L', soh: 7, threshold: 20, severity: 'warning' },
  { sku: 'SKU-11955', name: 'Baby Spinach 200g', soh: 2, threshold: 10, severity: 'error' },
];

export const MOCK_PICKER_ALERTS: PickerAlertRow[] = [
  { pickerId: 'p18', displayName: 'Yusuf Demir', alertType: 'No Pelican check-in', detail: 'Shift started 96m ago, no login recorded', severity: 'error' },
  { pickerId: 'p3', displayName: 'Anthony Baguio Zolina', alertType: 'Idle over threshold', detail: 'Idle for 53m — threshold is 30m', severity: 'warning' },
  { pickerId: 'p4', displayName: 'TG Jawad Raziq', alertType: 'Idle over threshold', detail: 'Idle for 31m — threshold is 30m', severity: 'warning' },
  { pickerId: 'p19', displayName: 'Fatima Haddad', alertType: 'Idle over threshold', detail: 'Idle for 41m — threshold is 30m', severity: 'warning' },
  { pickerId: 'p24', displayName: 'Rosa Delgado', alertType: 'Fail rate spike', detail: 'Fail rate 5.88% over last 10 orders', severity: 'error' },
  { pickerId: 'p16', displayName: 'Kwame Asante', alertType: 'Slow picking', detail: 'Avg pick time 46% above shift average', severity: 'warning' },
];

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function hourAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}
