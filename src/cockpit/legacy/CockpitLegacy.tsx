import { useEffect, useRef, useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import talabatLogo from '../../assets/legacy/talabat-logo.svg';
import topBell from '../../assets/legacy/top-bell.svg';
import topChevron from '../../assets/legacy/top-chevron.svg';
import topHelp from '../../assets/legacy/top-help.svg';
import topPin from '../../assets/legacy/top-pin.svg';
import { fetchStore, fetchWarehouses } from '../../domain/mockApi';
import { warehouseName } from '../../domain/mockData';
import { FAIL_ALERT, aed, duration, initials, waiting } from '../../domain/prod';
import type { Activity, AttentionRow, CancelRow, CancelStatus, HistoryRow, HistoryStage, Person, StageKey, Vendor } from '../../domain/prod';
import { RTL_LOCALES } from '../../i18n';
import { RANGES, RANGE_HOURS } from '../../state';
import type { Action, HistoryDate, Page, State } from '../../state';
import { BoxState } from '../BoxState';
import { useMock } from '../useMock';
import type { Loaded } from '../useMock';
import { TimingChart, TimingLegend } from '../TimingChart';
import { fetchAttention, fetchCancellations, fetchHistory, fetchPeople, fetchShift, fetchStageOrders, fetchTeam, fetchTiming, fetchVendors } from '../prod/api';
import { Badge, LIVE_STAGE_LABEL, OrderDrawer, STAGE_LABEL, StageDrawer, stageTone } from '../prod/Drawers';
import { TeamTable } from '../prod/TeamTable';
import { nowClock } from '../sections';
import { Dropdown, EmptyBox, EmptyCenter, Field, LiveTag } from './controls';
import { DmartsLogo } from './DmartsLogo';
import { CapeIcon } from './icons';
import type { IconName } from './icons';
import './legacy.css';
import './prod.css';

type P = { s: State; dispatch: Dispatch<Action> };

// ---------------------------------------------------------------- shell

function TopBar() {
  const { t } = useTranslation();
  return (
    <header className="lg-top">
      <div className="lg-top__left">
        <img src={talabatLogo} alt="talabat" width={113} height={24} />
      </div>
      <div className="lg-top__right">
        <span className="lg-top__item">
          {t('sec.top.product')}
          <img src={topChevron} alt="" width={24} height={24} />
        </span>
        <span className="lg-top__item">
          <img src={topPin} alt="" width={21} height={21} />
          United Arab Emirates
        </span>
        <button type="button" className="lg-top__item lg-top__btn">
          <img src={topHelp} alt="" width={21} height={21} />
          {t('sec.top.help')}
        </button>
        <button type="button" className="lg-top__item lg-top__btn" aria-label={t('sec.top.notifications')}>
          <img src={topBell} alt="" width={22} height={22} />
        </button>
        <span className="lg-top__avatar" aria-label={t('sec.top.account')}>
          A
        </span>
      </div>
    </header>
  );
}

/** Production sidenav: Overview, then the Orders group. Order pages stay disabled until a warehouse is picked. */
function Sidebar({ s, dispatch, collapsed, onCollapse }: P & { collapsed: boolean; onCollapse: () => void }) {
  const { t } = useTranslation();
  const inStore = s.page !== 'warehouses';
  const link = (page: Page, icon: IconName, label: string, active: boolean, disabled = false) => (
    <a
      href="#"
      className={`lg-nav__link${active ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) dispatch({ type: 'page', page });
      }}
      data-tip={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      <CapeIcon name={icon} />
      {!collapsed && <span>{label}</span>}
    </a>
  );
  return (
    <nav className={`lg-nav${collapsed ? ' lg-nav--collapsed' : ''}`} aria-label={t('sec.nav.main')}>
      <div className="lg-nav__header" dir="ltr">
        {!collapsed && <DmartsLogo />}
        <span className="lg-tag lg-tag--beta">{t('sec.nav.beta')}</span>
      </div>
      <ol className="lg-nav__list">
        <li>{link(inStore ? 'overview' : 'warehouses', 'dashboard', t('sec.nav.overview'), s.page === 'overview' || s.page === 'warehouses')}</li>
        <li className="lg-nav__section">
          {!collapsed && <span className="lg-nav__section-title">{t('sec.nav.orders')}</span>}
          <ol className="lg-nav__list">
            <li>{link('orders', 'history', t('sec.nav.orderHistory'), s.page === 'orders', !inStore)}</li>
            <li>{link('cancellations', 'undo', t('sec.nav.cancellations'), s.page === 'cancellations', !inStore)}</li>
          </ol>
        </li>
      </ol>
      <div className="lg-nav__footer">
        {!collapsed && (
          <button type="button" className="lg-btn lg-btn--outline">
            <CapeIcon name="rateReview" size={16} />
            {t('sec.nav.feedback')}
          </button>
        )}
        <button type="button" className="lg-nav__collapse" aria-label={t('sec.nav.collapse')} onClick={onCollapse}>
          <CapeIcon name="doubleChevronLeft" size={16} className={collapsed ? 'lg-flip' : 'lg-rtl-flip'} />
        </button>
      </div>
    </nav>
  );
}

/** "3 / 4 open": the vendors of this warehouse, open or closed. */
export function VendorSwitcher({ vendors }: { vendors: Loaded<Vendor[]> }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  if (vendors.status !== 'ready') return null;
  const open = vendors.data.filter((v) => v.open).length;
  return (
    <details ref={ref} className="pd-vendors">
      <summary className={`pd-vendors__btn${open === 0 ? ' pd-vendors__btn--closed' : ''}`}>
        {open} / {vendors.data.length} open
        <CapeIcon name="chevronDown" size={16} />
      </summary>
      <ul className="pd-vendors__list">
        {vendors.data.map((v) => (
          <li key={v.name}>
            <span>{v.name}</span>
            <span className={`pd-badge pd-badge--${v.open ? 'success' : 'danger'}`}>{v.open ? 'Open' : 'Closed'}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Crumbs({ dispatch, store, page, vendors }: { dispatch: Dispatch<Action>; store: string; page?: string; vendors?: Loaded<Vendor[]> }) {
  const go = (p: Page) => (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: 'page', page: p });
  };
  return (
    <div className="lg-crumb-row">
      <nav className="lg-crumbs" aria-label="Breadcrumb">
        <a href="#" onClick={go('warehouses')}>
          Store Management Cockpit
        </a>
        <span className="lg-crumbs__sep">/</span>
        {page ? (
          <>
            <a href="#" onClick={go('overview')}>
              {store}
            </a>
            <span className="lg-crumbs__sep">/</span>
            <b>{page}</b>
          </>
        ) : (
          <b>{store}</b>
        )}
      </nav>
      {vendors && <VendorSwitcher vendors={vendors} />}
    </div>
  );
}

// ---------------------------------------------------------------- overview

const STAGES: StageKey[] = ['unassigned', 'picking', 'packing', 'ready_for_rider'];
export const ACTIVITY_LABEL: Record<Activity, string> = { picking: 'Picking', packing: 'Packing', putaway: 'Putaway', receiving: 'Receiving', idle: 'Idle / Untracked' };
const WORKING: Activity[] = ['picking', 'packing', 'putaway', 'receiving'];

/** Everything the overview needs, loaded once and shared by both Cockpit versions. */
export function useOverview(s: State) {
  const store = useMock(fetchStore, s.scenario);
  const vendors = useMock(fetchVendors, s.scenario);
  const attention = useMock(fetchAttention, s.scenario);
  const people = useMock(fetchPeople, s.scenario);
  const stageOrders = useMock(fetchStageOrders, s.scenario);
  const shift = useMock(fetchShift, s.scenario);
  const timing = useMock(fetchTiming, s.scenario);
  const team = useMock(fetchTeam, s.scenario);
  const [returned, setReturned] = useState<string[]>([]);
  const [stageOpen, setStageOpen] = useState<StageKey | null>(null);
  const [orderOpen, setOrderOpen] = useState<string | null>(null);

  const closed = store.status === 'ready' && store.data.status === 'closed';
  const failed = [store, attention, people, stageOrders].some((x) => x.status === 'error');
  const loading = !failed && [store, stageOrders].some((x) => x.status === 'loading');
  const orders = stageOrders.status === 'ready' ? stageOrders.data : [];
  const count = (k: StageKey) => orders.filter((o) => o.stage === k).length;
  const ppl = people.status === 'ready' ? people.data : [];
  const idle = ppl.filter((p) => p.activity === 'idle').length;
  const working = ppl.filter((p) => WORKING.includes(p.activity)).length;
  const attn = attention.status === 'ready' ? attention.data.filter((a) => !returned.includes(a.orderId)) : [];
  return {
    store,
    vendors,
    attention,
    attn,
    people,
    ppl,
    stageOrders,
    orders,
    shift,
    timing,
    team,
    closed,
    failed,
    loading,
    count,
    idle,
    working,
    live: !closed && !failed && !loading,
    liveText: failed ? 'Live data unavailable' : loading ? 'Loading…' : closed ? 'Offline' : `Live · updated ${nowClock('en')}`,
    stageOpen,
    setStageOpen,
    orderOpen,
    setOrderOpen,
    returnOrder: (id: string) => setReturned((r) => [...r, id]),
  };
}
export type Overview = ReturnType<typeof useOverview>;

/** The two drawers the overview opens (stage list → order detail). */
export function OverviewDrawers({ o, s }: { o: Overview; s: State }) {
  return (
    <>
      {o.stageOpen && !o.orderOpen && <StageDrawer stage={o.stageOpen} orders={o.orders} onClose={() => o.setStageOpen(null)} onOpen={o.setOrderOpen} />}
      {o.orderOpen && <OrderDrawer orderId={o.orderOpen} scenario={s.scenario} onClose={() => o.setOrderOpen(null)} onReturn={o.returnOrder} />}
    </>
  );
}

export const attentionMeta = (a: AttentionRow) =>
  a.kind === 'return' ? `${a.units} ${a.units === 1 ? 'unit' : 'units'} to return · ${a.lines} ${a.lines === 1 ? 'line' : 'lines'}` : `${a.units} ${a.units === 1 ? 'item' : 'items'} · past promise time`;
export const attentionTime = (a: AttentionRow) => (a.kind === 'return' ? `${waiting(a.minutes)} waiting` : `${a.minutes}m late`);
export const personInitials = (name: string) => name.match(/^Picker (\d+)$/) ? `P${Number(name.slice(7))}` : initials(name);

function OverviewPage({ s, dispatch, o }: P & { o: Overview }) {
  const working = o.working;
  const legend = WORKING.map((a) => [a, o.ppl.filter((p) => p.activity === a).length] as const).filter(([, n]) => n > 0);
  const idleN = o.ppl.length - working;
  return (
    <>
      <div className="lg-live-row">
        <LiveTag on={o.live} text={o.liveText} />
        <div className="lg-stages">
          {STAGES.map((k) => {
            const n = o.count(k);
            const ready = o.stageOrders.status === 'ready';
            return (
              <button key={k} type="button" className={`lg-stage pd-stage${ready && n > 0 ? ` lg-stage--${k === 'ready_for_rider' ? 'readyForRider' : k}` : ''}`} onClick={() => o.setStageOpen(k)} disabled={!ready}>
                <b>{ready ? n : '–'}</b>
                <span>{LIVE_STAGE_LABEL[k]}</span>
              </button>
            );
          })}
        </div>
        <span className="lg-spacer" />
        {o.idle > 0 && (
          <span className="pd-idle-pill">
            <b>{o.idle}</b> idle / untracked pickers
          </span>
        )}
      </div>

      <div className="lg-now">
        <section className="lg-now__col" aria-label="Needs attention">
          <div className="lg-now__head">
            <span>Needs attention</span>
            {o.attention.status === 'ready' && o.attn.length > 0 && <span>{o.attn.length} open</span>}
          </div>
          {o.attention.status === 'error' ? (
            <div className="lg-error">Couldn't load this data. It shows up again as soon as the connection is back.</div>
          ) : o.attention.status === 'loading' ? (
            <div className="box-skeleton" />
          ) : o.closed && o.attn.length === 0 ? (
            <EmptyCenter icon="checkCircle" text="The store is closed. Orders and pickers show up here when it opens." tall />
          ) : o.attn.length ? (
            <ul className="pd-attn">
              {o.attn.map((a) => (
                <li key={a.orderId}>
                  <button type="button" className="pd-attn__row" onClick={() => o.setOrderOpen(a.orderId)}>
                    <b>#{a.orderId}</b>
                    <span className={`pd-tag pd-tag--${a.kind}`}>{a.kind === 'return' ? 'Return' : 'Late'}</span>
                    <span className="pd-attn__meta">{attentionMeta(a)}</span>
                    <span className="lg-spacer" />
                    <span className="pd-attn__time">{attentionTime(a)}</span>
                    <CapeIcon name="chevronRight" size={16} className="lg-rtl-flip" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCenter icon="checkCircle" text="Nothing needs attention right now." tall />
          )}
        </section>
        <section className="lg-now__col lg-now__col--people" aria-label="People right now">
          <div className="lg-now__head">
            <span>People right now</span>
            {o.people.status === 'ready' && (
              <span>
                {working} of {o.ppl.length} working
              </span>
            )}
          </div>
          {o.people.status === 'error' ? (
            <div className="lg-error">Couldn't load this data. It shows up again as soon as the connection is back.</div>
          ) : o.people.status === 'loading' ? (
            <div className="box-skeleton" />
          ) : o.ppl.length ? (
            <>
              <div className="pd-progress" role="img" aria-label={`${working} of ${o.ppl.length} working`}>
                <span style={{ width: `${(working / o.ppl.length) * 100}%` }} />
              </div>
              <ul className="pd-legend">
                {legend.map(([a, n]) => (
                  <li key={a}>
                    <span className={`pd-dot pd-dot--${a}`} />
                    {n} {ACTIVITY_LABEL[a]}
                  </li>
                ))}
                {idleN > 0 && legend.length === 0 && (
                  <li>
                    <span className="pd-dot pd-dot--idle" />
                    {idleN} {ACTIVITY_LABEL.idle}
                  </li>
                )}
              </ul>
              <ul className="pd-people">
                {o.ppl.map((p: Person) => (
                  <li key={p.id}>
                    <span className={`pd-dot pd-dot--${p.activity}`} />
                    <span className="lg-avatar">{personInitials(p.name)}</span>
                    <b className="pd-people__name">{p.name}</b>
                    <span className={`pd-people__status pd-people__status--${p.activity}`}>{ACTIVITY_LABEL[p.activity]}</span>
                    <span className="lg-spacer" />
                    <span className="pd-people__time">{duration(p.seconds)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyCenter icon="group" text="No picker activity available right now." tall />
          )}
        </section>
      </div>

      <div className="lg-shift">
        <div className="lg-shift__head">
          <h2>
            <CapeIcon name="trending" />
            Shift performance
          </h2>
          <div className="lg-shift__actions">
            <button type="button" className="lg-btn lg-btn--ghost" onClick={() => dispatch({ type: 'page', page: 'orders' })}>
              View order history →
            </button>
            <Dropdown value={s.range} align="end" label="Time window" options={RANGES.map((r) => ({ value: r, label: r === 'today' ? 'Today' : `Last ${r}` }))} onChange={(r) => dispatch({ type: 'range', range: r })} />
          </div>
        </div>
        <div className="lg-shift__grid">
          <div className="lg-card lg-stats">
            <BoxState state={o.shift} lines={7}>
              {(m) => (
                <>
                  <div className="lg-stats__row">
                    <span>Successful orders</span>
                    <b className="lg-stats__hero">{m.successful}</b>
                  </div>
                  <hr />
                  <div className="lg-stats__list">
                    <div className="lg-stats__row">
                      <span>Avg prep time</span>
                      <b>{duration(m.assignment + m.picking + m.packing)}</b>
                    </div>
                    {(
                      [
                        ['Assignment', m.assignment],
                        ['Picking', m.picking],
                        ['Packing', m.packing],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="lg-stats__row lg-stats__row--sub">
                        <span>{k}</span>
                        <span>{duration(v)}</span>
                      </div>
                    ))}
                    <hr />
                    <div className="lg-stats__row">
                      <span>Avg dispatch time</span>
                      <b>{m.dispatch == null ? 'N/A' : duration(m.dispatch)}</b>
                    </div>
                    <hr />
                    <div className="lg-stats__row">
                      <span>Partial fulfillment rate</span>
                      <b>{(m.pfr * 100).toFixed(2)}%</b>
                    </div>
                    <div className="lg-stats__row">
                      <span>Fail rate</span>
                      <b className={m.failRate > FAIL_ALERT ? 'pd-bad' : undefined}>{(m.failRate * 100).toFixed(2)}%</b>
                    </div>
                  </div>
                </>
              )}
            </BoxState>
          </div>
          <section className="lg-card lg-chart">
            <h3>Time per order, by hour</h3>
            <BoxState state={o.timing} lines={6}>
              {(b) =>
                b.length ? (
                  <>
                    <TimingChart buckets={b.slice(-RANGE_HOURS[s.range])} />
                    <TimingLegend />
                  </>
                ) : (
                  <EmptyCenter icon="lineChart" text="No historical data available for this time range." tall />
                )
              }
            </BoxState>
          </section>
        </div>
        <section className="lg-card lg-team">
          <h2 className="lg-h2">Picker team</h2>
          <BoxState state={o.team} lines={6}>
            {(rows) => (rows.length ? <TeamTable rows={rows} sort={s.sort} onSort={(k) => dispatch({ type: 'sort', key: k })} /> : <EmptyCenter icon="group" text="No picker data available for this time range." />)}
          </BoxState>
        </section>
      </div>
      <OverviewDrawers o={o} s={s} />
    </>
  );
}

// ---------------------------------------------------------------- warehouses

export function Warehouses({ s, dispatch }: P) {
  const list = useMock(fetchWarehouses, s.scenario);
  const [q, setQ] = useState('');
  return (
    <div className="lg-page lg-page--wh">
      <div className="lg-wh__head">
        <h1 className="lg-h1">Warehouses</h1>
        <label className="lg-search">
          <CapeIcon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID" aria-label="Search by name or ID" />
        </label>
      </div>
      <BoxState state={list} lines={4}>
        {(rows) => {
          const term = q.trim().toLowerCase();
          const shown = rows.filter((w) => w.name.toLowerCase().includes(term) || w.id.toLowerCase().includes(term));
          return shown.length ? (
            <div className="lg-wh__grid">
              {shown.map((w) => (
                <button key={w.id} type="button" className="lg-card lg-wh__card" onClick={() => dispatch({ type: 'page', page: 'overview', warehouseId: w.id })}>
                  <h2>{w.name}</h2>
                  <p>{w.type}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBox title="No warehouses match your search" />
          );
        }}
      </BoxState>
    </div>
  );
}

// ---------------------------------------------------------------- order history

export const HISTORY_STAGES: (HistoryStage | 'all')[] = ['all', 'pending_assignment', 'on_hold', 'picking', 'packaging', 'ready_for_pickup', 'awaiting_approval', 'successful', 'cancelled'];
export const HISTORY_DATES: { value: HistoryDate; label: string; minutes: number | null }[] = [
  { value: 'any', label: 'Any time', minutes: null },
  { value: '1h', label: 'Last hour', minutes: 60 },
  { value: '4h', label: 'Last 4 hours', minutes: 240 },
  { value: 'today', label: 'Today', minutes: 24 * 60 },
  { value: 'yesterday', label: 'Yesterday', minutes: 48 * 60 },
  { value: '7d', label: 'Last 7 days', minutes: 7 * 24 * 60 },
];
const PAGE_SIZES = [10, 20, 50, 100] as const;
export const dayTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};
export const pickupText = (r: HistoryRow) => (r.timeToPickup === 'finished' ? 'Finished' : r.timeToPickup === 'cancelled' ? 'Cancelled' : r.timeToPickup < 0 ? `${-r.timeToPickup}m late` : `in ${r.timeToPickup}m`);

/** Filters (exact-match text fields, as production), then the current page. */
export function historyView(rows: HistoryRow[], f: State['history']) {
  const exact = (v: string) => v.trim().toLowerCase();
  const since = HISTORY_DATES.find((d) => d.value === f.date)?.minutes ?? null;
  const filtered = rows.filter((r) => {
    const age = (Date.now() - new Date(r.receivedAt).getTime()) / 60000;
    const words = r.customer.toLowerCase().split(' ');
    return (
      (f.stage === 'all' || r.stage === f.stage) &&
      (f.fulfillment === 'all' || r.fulfillment === f.fulfillment) &&
      (since == null || (f.date === 'yesterday' ? age >= 24 * 60 && age < since : age < since)) &&
      (!exact(f.orderId) || r.orderId === exact(f.orderId).replace(/^#/, '')) &&
      (!exact(f.customer) || r.customer.toLowerCase() === exact(f.customer) || words.includes(exact(f.customer))) &&
      (!exact(f.picker) || (r.picker ?? '').toLowerCase() === exact(f.picker))
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / f.pageSize));
  const page = Math.min(f.page, pages);
  return { total: filtered.length, pages, page, rows: filtered.slice((page - 1) * f.pageSize, page * f.pageSize), first: (page - 1) * f.pageSize + 1 };
}

function RowMenu({ row, onView }: { row: HistoryRow; onView: () => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const why = row.stage === 'cancelled' ? 'Already cancelled' : row.timeToPickup === 'finished' || row.stage === 'ready_for_pickup' ? 'Past the cancellation point' : null;
  return (
    <details ref={ref} className="pd-menu">
      <summary className="lg-icon-btn" aria-label={`Order actions for #${row.orderId}`}>
        <CapeIcon name="moreVert" size={18} />
      </summary>
      <ul className="pd-menu__list" role="menu">
        <li role="menuitem">
          <button
            type="button"
            onClick={() => {
              if (ref.current) ref.current.open = false;
              onView();
            }}
          >
            View order details
          </button>
        </li>
        <li role="menuitem" aria-disabled={why ? true : undefined}>
          <button type="button" disabled={!!why} className="pd-menu__danger">
            Cancel order
            {why && <small>{why}</small>}
          </button>
        </li>
      </ul>
    </details>
  );
}

export function Pager({ v, f, dispatch }: { v: ReturnType<typeof historyView>; f: State['history']; dispatch: Dispatch<Action> }) {
  const go = (page: number) => dispatch({ type: 'history', patch: { page } });
  const nums = v.pages <= 4 ? Array.from({ length: v.pages }, (_, i) => i + 1) : [1, 2, -1, v.pages];
  return (
    <div className="lg-pager">
      <p>{v.total ? `${v.first}–${v.first + v.rows.length - 1} of ${v.total}` : 'No results'}</p>
      <div className="lg-pager__right">
        <Dropdown value={f.pageSize} active align="end" label="Rows per page" options={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))} onChange={(n) => dispatch({ type: 'history', patch: { pageSize: n } })} />
        <button type="button" className="lg-icon-btn" disabled={v.page <= 1} aria-label="Previous page" onClick={() => go(v.page - 1)}>
          <CapeIcon name="chevronLeft" className="lg-rtl-flip" />
        </button>
        {nums.map((n, i) =>
          n < 0 ? (
            <span key={`gap${i}`} className="pd-pager__gap">
              ...
            </span>
          ) : (
            <button key={n} type="button" className={n === v.page ? 'lg-pager__page' : 'pd-pager__num'} aria-current={n === v.page ? 'page' : undefined} onClick={() => go(n)}>
              {n}
            </button>
          ),
        )}
        <button type="button" className="lg-icon-btn" disabled={v.page >= v.pages} aria-label="Next page" onClick={() => go(v.page + 1)}>
          <CapeIcon name="chevronRight" className="lg-rtl-flip" />
        </button>
      </div>
    </div>
  );
}

export function Orders({ s, dispatch }: P) {
  const data = useMock(fetchHistory, s.scenario);
  const f = s.history;
  const [draft, setDraft] = useState({ orderId: f.orderId, customer: f.customer, picker: f.picker });
  const [open, setOpen] = useState<string | null>(null);
  const h = (patch: Partial<typeof f>) => dispatch({ type: 'history', patch });
  return (
    <div className="lg-page">
      <div className="lg-title-row">
        <h1 className="lg-h1">Order history</h1>
        <LiveTag on={false} text={`Live · updated ${nowClock('en')}`} />
      </div>
      <div className="lg-filters">
        <Field label="Stage">
          <Dropdown value={f.stage} label="Stage" options={HISTORY_STAGES.map((v) => ({ value: v, label: v === 'all' ? 'All stages' : STAGE_LABEL[v] }))} onChange={(v) => h({ stage: v })} />
        </Field>
        <Field label="Fulfillment">
          <Dropdown value={f.fulfillment} label="Fulfillment" options={(['all', 'full', 'partial'] as const).map((v) => ({ value: v, label: v === 'all' ? 'All' : v === 'full' ? 'Full' : 'Partial' }))} onChange={(v) => h({ fulfillment: v })} />
        </Field>
        <Field label="Date">
          <span className="pd-date">
            <CapeIcon name="date" size={16} />
            <Dropdown value={f.date} label="Date" options={HISTORY_DATES.map((d) => ({ value: d.value, label: d.label }))} onChange={(v) => h({ date: v })} />
          </span>
        </Field>
        <Field label="Order ID">
          <input className="lg-input" value={draft.orderId} placeholder="Order ID as shown in the table" onChange={(e) => setDraft({ ...draft, orderId: e.target.value })} />
        </Field>
        <Field label="Customer">
          <input className="lg-input" value={draft.customer} placeholder="Exact first, last or full name" onChange={(e) => setDraft({ ...draft, customer: e.target.value })} />
        </Field>
        <Field label="Picker">
          <input className="lg-input" value={draft.picker} placeholder="Exact picker name" onChange={(e) => setDraft({ ...draft, picker: e.target.value })} />
        </Field>
        <button type="button" className="lg-btn lg-btn--ghost lg-btn--32" onClick={() => h(draft)}>
          Apply
        </button>
      </div>
      <BoxState state={data} lines={8}>
        {(rows) => {
          const v = historyView(rows, f);
          return (
            <>
              <div className="lg-table">
                <table>
                  <thead>
                    <tr>
                      {['Order #', 'Short code', 'Stage', 'Time to pickup', 'Received', 'Customer', 'Picker', 'Amount', 'Cancelled at'].map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                      <th>
                        <span className="visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.rows.length ? (
                      v.rows.map((r) => (
                        <tr key={r.orderId}>
                          <td>
                            <button type="button" className="pd-order-link" onClick={() => setOpen(r.orderId)}>
                              #{r.orderId}
                            </button>
                          </td>
                          <td>{r.shortCode}</td>
                          <td>
                            <Badge tone={stageTone(r.stage)}>{STAGE_LABEL[r.stage]}</Badge>
                          </td>
                          <td className={typeof r.timeToPickup === 'number' && r.timeToPickup < 0 ? 'lg-late' : ''}>{pickupText(r)}</td>
                          <td>{dayTime(r.receivedAt)}</td>
                          <td>{r.customer}</td>
                          <td>{r.picker ?? '—'}</td>
                          <td>{aed(r.amount)}</td>
                          <td>{r.cancelledAt ? dayTime(r.cancelledAt) : '—'}</td>
                          <td>
                            <RowMenu row={r} onView={() => setOpen(r.orderId)} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="lg-table__empty">
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pager v={v} f={f} dispatch={dispatch} />
            </>
          );
        }}
      </BoxState>
      {open && <OrderDrawer orderId={open} scenario={s.scenario} onClose={() => setOpen(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------- cancellations

export const CANCEL_STATUS: Record<CancelStatus, { label: string; tone: string }> = {
  pending_return: { label: 'Pending return', tone: 'warning' },
  returned: { label: 'Returned', tone: 'success' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};
/** Pending return = stock still out; Settled = returned or dismissed; All cancelled adds the orders with nothing to return. */
export function cancellationView(rows: CancelRow[], tab: State['cancelTab']) {
  const settled = (r: CancelRow) => r.status === 'returned' || r.status === 'dismissed';
  const counts = { pending_return: rows.filter((r) => r.status === 'pending_return').length, settled: rows.filter(settled).length, all: rows.length };
  return { counts, rows: tab === 'all' ? rows : tab === 'settled' ? rows.filter(settled) : rows.filter((r) => r.status === 'pending_return') };
}

export function useCancellations(s: State) {
  const data = useMock(fetchCancellations, s.scenario);
  const [changed, setChanged] = useState<Record<string, CancelStatus>>({});
  const rows = data.status === 'ready' ? data.data.map((r) => (changed[r.orderId] ? { ...r, status: changed[r.orderId] } : r)) : [];
  return { data, rows, set: (id: string, status: CancelStatus) => setChanged((c) => ({ ...c, [id]: status })) };
}

export function Cancellations({ s, dispatch }: P) {
  const c = useCancellations(s);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="lg-page">
      <h1 className="lg-h1">Cancellations</h1>
      <BoxState state={c.data} lines={5}>
        {() => {
          const v = cancellationView(c.rows, s.cancelTab);
          return (
            <>
              <div className="lg-chips">
                {(
                  [
                    ['pending_return', 'Pending return'],
                    ['settled', 'Settled'],
                    ['all', 'All cancelled'],
                  ] as const
                ).map(([k, label]) => (
                  <button key={k} type="button" className={`lg-chip${s.cancelTab === k ? ' lg-chip--on' : ''}`} aria-pressed={s.cancelTab === k} onClick={() => dispatch({ type: 'cancelTab', tab: k })}>
                    {label} · {v.counts[k]}
                  </button>
                ))}
              </div>
              {v.rows.length ? (
                <div className="lg-table">
                  <table>
                    <thead>
                      <tr>
                        {['Order #', 'Short code', 'Status', 'Received', 'Customer', 'Picker', 'Amount', 'Cancelled at', 'Reason'].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                        <th>
                          <span className="visually-hidden">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.rows.map((r) => (
                        <tr key={r.orderId}>
                          <td>
                            <button type="button" className="pd-order-link" onClick={() => setOpen(r.orderId)}>
                              #{r.orderId}
                            </button>
                          </td>
                          <td>{r.shortCode}</td>
                          <td>
                            <Badge tone={CANCEL_STATUS[r.status].tone}>{CANCEL_STATUS[r.status].label}</Badge>
                          </td>
                          <td>{dayTime(r.receivedAt)}</td>
                          <td>{r.customer}</td>
                          <td>{r.picker ?? '—'}</td>
                          <td>{aed(r.amount)}</td>
                          <td>{dayTime(r.cancelledAt)}</td>
                          <td>
                            <span className="pd-reason">
                              {r.reason ?? '—'}
                              <small>Cancelled by {r.cancelledBy}</small>
                            </span>
                          </td>
                          <td>
                            {r.status === 'pending_return' && (
                              <span className="pd-actions">
                                <button type="button" className="pd-btn pd-btn--text" onClick={() => c.set(r.orderId, 'dismissed')}>
                                  Dismiss
                                </button>
                                <button type="button" className="pd-btn pd-btn--primary pd-btn--sm" onClick={() => c.set(r.orderId, 'returned')}>
                                  Return
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyBox
                  title={s.cancelTab === 'pending_return' ? 'Nothing waiting to be returned' : s.cancelTab === 'settled' ? 'No settled cancellations yet' : 'No cancelled orders today'}
                  body={s.cancelTab === 'pending_return' ? 'Cancelled orders show up here the moment their stock needs putting back. Nothing to do right now.' : undefined}
                />
              )}
            </>
          );
        }}
      </BoxState>
      {open && <OrderDrawer orderId={open} scenario={s.scenario} onClose={() => setOpen(null)} onReturn={(id) => c.set(id, 'returned')} />}
    </div>
  );
}

// ---------------------------------------------------------------- shell

/** Legacy Version: the Store Management Cockpit as it ships in production (talabat theme, Ops Portal shell). */
export function CockpitLegacy({ s, dispatch }: P) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const o = useOverview(s);
  const name = warehouseName(s.warehouseId);
  const pageTitle: Partial<Record<Page, string>> = { orders: 'Order history', cancellations: 'Cancellations' };
  void t;
  return (
    <div className="cockpit cockpit--legacy" data-theme="talabat-light-b2b" dir={RTL_LOCALES.has(s.lang) ? 'rtl' : 'ltr'} lang={s.lang}>
      <TopBar />
      <div className="lg-body">
        <Sidebar s={s} dispatch={dispatch} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
        <main className={`lg-main${s.page === 'warehouses' ? ' lg-main--wh' : ''}`}>
          {s.page === 'warehouses' ? (
            <Warehouses s={s} dispatch={dispatch} />
          ) : (
            <>
              <Crumbs dispatch={dispatch} store={name} page={pageTitle[s.page]} vendors={s.page === 'overview' ? o.vendors : undefined} />
              {s.page === 'overview' && <OverviewPage s={s} dispatch={dispatch} o={o} />}
              {s.page === 'orders' && <Orders key={s.warehouseId} s={s} dispatch={dispatch} />}
              {s.page === 'cancellations' && <Cancellations s={s} dispatch={dispatch} />}
              {s.page === 'issues' && <Orders s={s} dispatch={dispatch} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export type { ReactNode };
