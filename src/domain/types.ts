// Mirrors Cockpit-Shift-View-schema.sql. Field names match the SQL columns/views
// 1:1 so the mock API in mockApi.ts can be swapped for real Supabase queries
// without touching any component.

export type OrderStage = 'unassigned' | 'picking' | 'packing' | 'ready_for_rider' | 'completed' | 'cancelled';
export type PfStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type PickerStatus = 'idle' | 'picking' | 'packing' | 'offline';
export type BoxDataStatus = 'live' | 'placeholder' | 'to_confirm';
export type ColSpan = 1 | 2 | 3;

export interface Store {
  id: string;
  name: string;
  externalRef: string;
  status: 'open' | 'closed';
  vendorsOpen: number;
  vendorsTotal: number;
}

// Mock-data scenario: lets the prototype reach states the live stream would
// only produce on a bad day (spike, closed store, slow or failing API).
export type Scenario = 'normal' | 'spike' | 'quiet' | 'closed' | 'slow' | 'error';

// Orders & pickers is one connected list (critique Aug 17, items 1–2): each
// open order points at its picker, each picker carries today's performance.
export interface FloorOrder {
  orderId: string;
  externalOrderId: string;
  stage: 'unassigned' | 'picking' | 'packing';
  items: number;
  minutesInStage: number;
  lateByMinutes: number | null;
  pfPending: boolean;
  pickerId: string | null;
}

export interface FloorPicker {
  pickerId: string;
  displayName: string;
  status: PickerStatus;
  minutesInStatus: number;
  ordersToday: number;
  failRate: number;
}

export interface FloorSnapshot {
  orders: FloorOrder[];
  pickers: FloorPicker[];
  readyForRider: number;
}

export interface ShiftMetrics {
  successfulOrders: number;
  receivedOrders: number;
  issueRate: number;
  avgAssignmentSeconds: number;
  avgPickingSeconds: number;
  avgPackingSeconds: number;
  pfr: number;
  updatedAt: string; // ISO — Recent tier
}

export interface OrderTimingBucket {
  bucketStart: string; // ISO, hour-truncated
  assignmentAvgSeconds: number;
  pickingAvgSeconds: number;
  packingAvgSeconds: number;
  completedCount: number;
}

export interface PickerTeamRow {
  pickerId: string;
  displayName: string;
  ordersCount: number;
  avgAssignmentSeconds: number;
  avgPickingSeconds: number;
  avgPackingSeconds: number;
  pfr: number;
  failRate: number;
}

export interface BoxConfig {
  key: string;
  labelI18nKey: string;
  defaultColSpan: ColSpan;
  minColSpan: ColSpan;
  maxColSpan: ColSpan;
  dataStatus: BoxDataStatus;
  category: string;
}

// Layout state is now row groups (string[][], see grid/rowLayout.ts) rather
// than a flat per-box entry — a box's span is always derived from how many
// boxes share its row, never stored independently.

export type AlertSeverity = 'warning' | 'error';

// Preview content only — boxes.data_status stays 'placeholder' in schema.sql
// until the Slice 2 stream referenced in Cockpit-Shift-View-IA-v1.md §2 exists.
export interface SkuAlertRow {
  sku: string;
  name: string;
  soh: number;
  threshold: number;
  severity: AlertSeverity;
}

export type PickerAlertType = 'idle' | 'noCheckIn' | 'failRate' | 'slowPicking';

export interface PickerAlertRow {
  pickerId: string;
  displayName: string;
  alertType: PickerAlertType;
  value: number;
  threshold: number;
  severity: AlertSeverity;
}
