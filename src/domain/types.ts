// Mirrors Cockpit-Shift-View-schema.sql. Field names match the SQL columns/views
// 1:1 so the mock API in mockApi.ts can be swapped for real Supabase queries
// without touching any component.

export type OrderStage = 'unassigned' | 'picking' | 'packing' | 'ready_for_rider' | 'completed' | 'cancelled';
export type PfStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type PickerStatus = 'idle' | 'picking' | 'packing' | 'offline';

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
export type Scenario = 'normal' | 'spike' | 'quiet' | 'empty' | 'closed' | 'slow' | 'error';

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

// ---- Store Management Cockpit sections (warehouse list, order history, cancellations, order issues) ----

export interface Warehouse {
  id: string;
  name: string;
  type: 'WAREHOUSE_TYPE_DMART';
}

export type HistoryStage = 'pending_assignment' | 'on_hold' | 'picking' | 'packaging' | 'ready_for_pickup' | 'awaiting_approval' | 'successful' | 'cancelled';

export interface OrderHistoryRow {
  orderId: string;
  shortCode: string;
  stage: HistoryStage;
  fulfillment: 'full' | 'partial';
  /** Minutes left before the rider pickup; negative = late; null once the order left the store. */
  timeToPickupMinutes: number | null;
  receivedAt: string;
  customer: string;
  picker: string | null;
  amount: number;
  cancelledAt: string | null;
}

export interface CancellationRow {
  orderId: string;
  shortCode: string;
  cancelledAt: string;
  reason: string;
  items: number;
  picker: string | null;
  status: 'pending_return' | 'settled';
}

export type IssueSignal = 'complaint' | 'refund' | 'compensation' | 'review';
export type IssueReason = 'missing' | 'quality' | 'wrong_item' | 'expired' | 'late' | 'other' | 'unmapped';
export type IssueCause = 'in_store' | 'delivery' | 'customer_preference' | 'unclear';

export interface OrderIssue {
  id: string;
  orderId: string;
  shortCode: string;
  signal: IssueSignal;
  reason: IssueReason;
  cause: IssueCause;
  item: string;
  picker: string | null;
  amount: number | null;
  reviewed: boolean;
  /** 0 = today, 1 = yesterday, and so on. */
  daysAgo: number;
  at: string;
}
