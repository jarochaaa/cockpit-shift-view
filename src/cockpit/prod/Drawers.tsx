import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { aed, duration, orderDetail } from '../../domain/prod';
import type { HistoryStage, StageKey, StageOrder } from '../../domain/prod';
import type { Scenario } from '../../domain/types';
import { CapeIcon } from '../legacy/icons';

export const STAGE_LABEL: Record<HistoryStage, string> = {
  pending_assignment: 'Pending Assignment',
  on_hold: 'On Hold',
  picking: 'Picking',
  packaging: 'Packaging',
  ready_for_pickup: 'Ready for Pickup',
  awaiting_approval: 'Awaiting Approval',
  successful: 'Successful',
  cancelled: 'Cancelled',
};
export const LIVE_STAGE_LABEL: Record<StageKey, string> = { unassigned: 'Unassigned', picking: 'Picking', packing: 'Packing', ready_for_rider: 'Ready for Rider' };

/** Badge tone per stage, as production colours them. */
export const stageTone = (s: HistoryStage | StageKey) =>
  s === 'cancelled' ? 'danger' : s === 'successful' ? 'success' : s === 'ready_for_pickup' || s === 'ready_for_rider' ? 'info' : s === 'on_hold' || s === 'awaiting_approval' || s === 'pending_assignment' || s === 'unassigned' ? 'warning' : 'neutral';

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`pd-badge pd-badge--${tone}`}>{children}</span>;
}

/** Right-hand drawer with a dimmed backdrop; Escape or the backdrop closes it. */
export function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="pd-layer">
      <div className="pd-backdrop" onClick={onClose} aria-hidden />
      <div className="pd-drawer" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="pd-drawer__head">
          <h2>{title}</h2>
          <button type="button" className="pd-icon-btn" aria-label="Close drawer" onClick={onClose}>
            <CapeIcon name="close" size={20} />
          </button>
        </header>
        <div className="pd-drawer__body">{children}</div>
        {footer && <footer className="pd-drawer__foot">{footer}</footer>}
      </div>
    </div>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const eventClock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toLowerCase();
const day = (iso: string) => {
  const d = new Date(iso);
  const n = d.getDate();
  const suf = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${d.toLocaleDateString('en-US', { month: 'long' })} ${n}${suf}, ${d.getFullYear()}`;
};

function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="pd-kv">
      <dt>{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Order detail drawer: opened from Needs attention, the stage lists, Order history and Cancellations. */
export function OrderDrawer({ orderId, scenario, onClose, onReturn }: { orderId: string; scenario: Scenario; onClose: () => void; onReturn?: (id: string) => void }) {
  const o = orderDetail(orderId, scenario);
  const [allEvents, setAllEvents] = useState(false);
  const events = allEvents ? o.events : o.events.slice(0, 6);
  const pending = o.returnStatus === 'pending_return';
  return (
    <Drawer
      title={`Order #${o.orderId}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="pd-btn pd-btn--ghost" onClick={onClose}>
            Close
          </button>
          {pending && (
            <>
              <button type="button" className="pd-btn pd-btn--ghost" onClick={onClose}>
                Dismiss
              </button>
              <button
                type="button"
                className="pd-btn pd-btn--primary"
                onClick={() => {
                  onReturn?.(o.orderId);
                  onClose();
                }}
              >
                Return products
              </button>
            </>
          )}
        </>
      }
    >
      <section className="pd-sec">
        <h3>Order info</h3>
        <dl className="pd-kvs">
          <KV k="Stage">
            <Badge tone={stageTone(o.stage)}>{STAGE_LABEL[o.stage]}</Badge>
          </KV>
          {o.returnStatus && (
            <KV k="Return status">
              <Badge tone={pending ? 'warning' : 'success'}>{pending ? 'Pending return' : 'Returned'}</Badge>
            </KV>
          )}
          {o.cancelledAt && <KV k="Cancelled at">{when(o.cancelledAt)}</KV>}
          <KV k="Short code">{o.shortCode}</KV>
          <KV k="Received">{clock(o.receivedAt)}</KV>
          <KV k="Promised">{clock(o.promisedAt)}</KV>
          <KV k="Picker">{o.picker ?? '—'}</KV>
          <KV k="Shelf codes">{o.shelf}</KV>
          <KV k="Bag count">{o.bags ?? ''}</KV>
        </dl>
      </section>
      <div className="pd-cards">
        <section className="pd-card">
          <h3>Customer</h3>
          <dl className="pd-kvs">
            <KV k="Name">{o.customer}</KV>
          </dl>
        </section>
        <section className="pd-card">
          <h3>Payment</h3>
          <dl className="pd-kvs">
            <KV k="Type">{o.payment.type}</KV>
            <KV k="Method">{o.payment.method}</KV>
            <KV k="Original">{aed(o.payment.original)}</KV>
            <KV k="Confirmed">{aed(o.payment.confirmed)}</KV>
          </dl>
        </section>
      </div>
      <section className="pd-sec">
        <h3>Items</h3>
        <ul className="pd-items">
          {o.items.map((i) => (
            <li key={i.sku} className="pd-item">
              <span className="pd-item__img" aria-hidden />
              <span className="pd-item__main">
                <b>{i.name}</b>
                <span>SKU: {i.sku}</span>
              </span>
              <span className="pd-item__side">
                <span>
                  {i.picked} / {i.ordered}
                </span>
                <b>{aed(i.price)}</b>
                <Badge tone="success">In Cart</Badge>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="pd-sec">
        <div className="pd-sec__row">
          <h3>Order Events Timeline</h3>
          <button type="button" className="pd-link" onClick={() => setAllEvents(!allEvents)}>
            {allEvents ? 'Show fewer events' : 'View all events →'}
          </button>
        </div>
        <h4 className="pd-day">{day(o.events[0].at)}</h4>
        <ol className="pd-events">
          {events.map((e, i) => {
            const gap = i ? (new Date(e.at).getTime() - new Date(events[i - 1].at).getTime()) / 1000 : 0;
            return (
              <li key={e.label}>
                <span className="pd-events__time">{eventClock(e.at)}</span>
                <span className="pd-events__label">{e.label}</span>
                {i > 0 && <span className="pd-events__gap">+{duration(gap)}</span>}
              </li>
            );
          })}
        </ol>
      </section>
    </Drawer>
  );
}

/** Drawer behind a stage pill: the open orders in that stage. */
export function StageDrawer({ stage, orders, onClose, onOpen }: { stage: StageKey; orders: StageOrder[]; onClose: () => void; onOpen: (id: string) => void }) {
  const list = orders.filter((o) => o.stage === stage);
  return (
    <Drawer title={`${LIVE_STAGE_LABEL[stage]} Orders`} onClose={onClose}>
      {list.length ? (
        <ul className="pd-stage-list">
          {list.map((o) => (
            <li key={o.orderId}>
              <button type="button" className="pd-stage-row" onClick={() => onOpen(o.orderId)}>
                <span className="pd-stage-row__top">
                  <b>#{o.orderId}</b>
                  <Badge tone={stageTone(o.stage)}>{LIVE_STAGE_LABEL[o.stage]}</Badge>
                  <span className="pd-spacer" />
                  <span className="pd-stage-row__time">{duration(o.seconds)}</span>
                </span>
                <span className="pd-stage-row__meta">
                  {[o.picker ?? 'Not assigned', o.rider && `Rider: ${o.rider}`, o.shelf && `Shelf ${o.shelf}`, o.bags ? `${o.bags} ${o.bags === 1 ? 'bag' : 'bags'}` : null].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pd-empty">No orders in this stage right now.</p>
      )}
    </Drawer>
  );
}
