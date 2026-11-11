import type { CancellationRow, OrderHistoryRow, OrderIssue } from '../domain/types';
import type { CancelTab, HistoryFilters, IssueFilters } from '../state';

export const HISTORY_STAGES = ['all', 'pending_assignment', 'on_hold', 'picking', 'packaging', 'ready_for_pickup', 'awaiting_approval', 'successful', 'cancelled'] as const;
export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const ISSUE_SIGNALS = ['all', 'complaint', 'refund', 'compensation', 'review'] as const;
export const ISSUE_REASONS = ['all', 'missing', 'quality', 'wrong_item', 'expired', 'late', 'other', 'unmapped'] as const;
export const ISSUE_CAUSES = ['all', 'in_store', 'delivery', 'customer_preference', 'unclear'] as const;

/** Order history: filters, then the current page. */
export function historyView(rows: OrderHistoryRow[], f: HistoryFilters) {
  const q = (v: string) => v.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (f.stage === 'all' || r.stage === f.stage) &&
      (f.fulfillment === 'all' || r.fulfillment === f.fulfillment) &&
      (!q(f.orderId) || r.orderId.includes(q(f.orderId)) || r.shortCode.toLowerCase().includes(q(f.orderId))) &&
      (!q(f.customer) || r.customer.toLowerCase().includes(q(f.customer))),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / f.pageSize));
  const page = Math.min(f.page, pages);
  return { total: filtered.length, pages, page, rows: filtered.slice((page - 1) * f.pageSize, page * f.pageSize), first: (page - 1) * f.pageSize + 1 };
}

export function cancellationView(rows: CancellationRow[], tab: CancelTab) {
  const counts = { pending_return: rows.filter((r) => r.status === 'pending_return').length, settled: rows.filter((r) => r.status === 'settled').length, all: rows.length };
  return { counts, rows: tab === 'all' ? rows : rows.filter((r) => r.status === tab) };
}

/** Order issues: KPIs over the chosen range, then tab + filters, optionally grouped by picker. */
export function issuesView(all: OrderIssue[], f: IssueFilters) {
  const inRange = all.filter((i) => (f.range === 'today' ? i.daysAgo === 0 : i.daysAgo < 7));
  const yesterday = all.filter((i) => i.daysAgo === 1).length;
  const orders = new Set(inRange.map((i) => i.orderId));
  const inStore = new Set(inRange.filter((i) => i.cause === 'in_store').map((i) => i.orderId));
  const money = inRange.reduce((n, i) => n + (i.amount ?? 0), 0);
  const items = new Map<string, number>();
  inRange.forEach((i) => items.set(i.item, (items.get(i.item) ?? 0) + 1));
  const top = [...items.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const counts = { new: inRange.filter((i) => !i.reviewed).length, reviewed: inRange.filter((i) => i.reviewed).length, all: inRange.length };
  const pickers = [...new Set(inRange.map((i) => i.picker).filter((p): p is string => p != null))].sort();
  const rows = inRange.filter(
    (i) =>
      (f.tab === 'all' || (f.tab === 'new' ? !i.reviewed : i.reviewed)) &&
      (f.signal === 'all' || i.signal === f.signal) &&
      (f.reason === 'all' || i.reason === f.reason) &&
      (f.cause === 'all' || i.cause === f.cause) &&
      (f.picker === 'all' || i.picker === f.picker),
  );
  const groups =
    f.groupBy === 'picker'
      ? [...new Set(rows.map((r) => r.picker ?? '—'))].map((p) => ({ key: p, rows: rows.filter((r) => (r.picker ?? '—') === p) })).sort((a, b) => b.rows.length - a.rows.length)
      : [];
  return { kpis: { orders: orders.size, money: inRange.length ? money : null, inStore: inStore.size, top }, counts, pickers, rows, groups, yesterday };
}

export const formatMoney = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, { style: 'currency', currency: 'BHD', minimumFractionDigits: 3 }).format(n);

export const formatClock = (iso: string, lang: string) => new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : lang, { hour: '2-digit', minute: '2-digit' });

export const nowClock = (lang: string) => new Date().toLocaleTimeString(lang === 'ar' ? 'ar-u-nu-latn' : lang, { hour: '2-digit', minute: '2-digit', hour12: false });
