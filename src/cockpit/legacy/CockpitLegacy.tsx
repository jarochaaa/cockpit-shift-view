import type { TFunction } from 'i18next';
import { useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import talabatLogo from '../../assets/legacy/talabat-logo.svg';
import topBell from '../../assets/legacy/top-bell.svg';
import topChevron from '../../assets/legacy/top-chevron.svg';
import topHelp from '../../assets/legacy/top-help.svg';
import topPin from '../../assets/legacy/top-pin.svg';
import topStaging from '../../assets/legacy/top-staging.svg';
import { formatPercent, formatSeconds } from '../../domain/format';
import { fetchCancellations, fetchFloor, fetchOrderHistory, fetchOrderIssues, fetchOrderTiming, fetchPickerTeam, fetchShiftMetrics, fetchStore, fetchWarehouses } from '../../domain/mockApi';
import { warehouseName } from '../../domain/mockData';
import type { FloorSnapshot } from '../../domain/types';
import { RTL_LOCALES } from '../../i18n';
import { RANGES, RANGE_HOURS } from '../../state';
import type { Action, Page, State } from '../../state';
import { BoxState } from '../BoxState';
import { deriveLive } from '../live';
import { HISTORY_STAGES, ISSUE_CAUSES, ISSUE_REASONS, ISSUE_SIGNALS, PAGE_SIZES, cancellationView, formatClock, formatMoney, historyView, issuesView, nowClock } from '../sections';
import { PickerTeamTable } from '../ShiftBoard';
import { TimingChart } from '../TimingChart';
import { useMock } from '../useMock';
import type { Loaded } from '../useMock';
import { Chip, Dropdown, EmptyBox, EmptyCenter, Field, LiveTag } from './controls';
import { DmartsLogo } from './DmartsLogo';
import { CapeIcon } from './icons';
import type { IconName } from './icons';
import './legacy.css';

type P = { s: State; dispatch: Dispatch<Action> };
const items = (t: TFunction, n: number) => t('sec.items', { count: n });

function TopBar() {
  const { t } = useTranslation();
  return (
    <header className="lg-top">
      <div className="lg-top__left">
        <img src={talabatLogo} alt="talabat" width={113} height={24} />
        <span className="lg-tag lg-tag--staging">
          <img src={topStaging} alt="" width={16} height={16} />
          {t('sec.top.staging')}
        </span>
      </div>
      <div className="lg-top__right">
        <span className="lg-top__item">
          {t('sec.top.product')}
          <img src={topChevron} alt="" width={24} height={24} />
        </span>
        <span className="lg-top__item">
          <img src={topPin} alt="" width={21} height={21} />
          {t('sec.top.country')}
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

const NAV: { page: Page; icon: IconName; key: string }[] = [
  { page: 'orders', icon: 'history', key: 'orderHistory' },
  { page: 'cancellations', icon: 'undo', key: 'cancellations' },
  { page: 'issues', icon: 'flag', key: 'issues' },
];

function Sidebar({ s, dispatch, collapsed, onCollapse }: P & { collapsed: boolean; onCollapse: () => void }) {
  const { t } = useTranslation();
  const go = (page: Page) => (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: 'page', page });
  };
  const link = (page: Page, icon: IconName, label: string) => (
    <a href="#" className={`lg-nav__link${s.page === page ? ' is-active' : ''}`} aria-current={s.page === page ? 'page' : undefined} onClick={go(page)} title={collapsed ? label : undefined}>
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
        <li>{link('overview', 'dashboard', t('sec.nav.overview'))}</li>
        <li className="lg-nav__section">
          {!collapsed && <span className="lg-nav__section-title">{t('sec.nav.orders')}</span>}
          <ol className="lg-nav__list">
            {NAV.map((n) => (
              <li key={n.page}>{link(n.page, n.icon, t(`sec.nav.${n.key}`))}</li>
            ))}
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

function Crumbs({ s, dispatch, store, page }: P & { store: string; page?: string }) {
  const { t } = useTranslation();
  const go = (p: Page) => (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: 'page', page: p });
  };
  void s;
  return (
    <nav className="lg-crumbs" aria-label={t('sec.crumb.label')}>
      <a href="#" onClick={go('warehouses')}>{t('sec.crumb.root')}</a>
      <span className="lg-crumbs__sep">/</span>
      {page ? (
        <>
          <a href="#" onClick={go('overview')}>{store}</a>
          <span className="lg-crumbs__sep">/</span>
          <b>{page}</b>
        </>
      ) : (
        <b>{store}</b>
      )}
    </nav>
  );
}

export function Warehouses({ s, dispatch }: P) {
  const { t } = useTranslation();
  const list = useMock(fetchWarehouses, s.scenario);
  const [q, setQ] = useState('');
  return (
    <div className="lg-page lg-page--wh">
      <div className="lg-wh__head">
        <h1 className="lg-h1">{t('sec.wh.title')}</h1>
        <label className="lg-search">
          <CapeIcon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('sec.wh.search')} aria-label={t('sec.wh.search')} />
        </label>
      </div>
      <BoxState state={list} lines={4}>
        {(rows) => {
          const shown = rows.filter((w) => w.name.toLowerCase().includes(q.trim().toLowerCase()));
          return shown.length ? (
            <div className="lg-wh__grid">
              {shown.map((w) => (
                <button key={w.id} type="button" className="lg-card lg-wh__card" onClick={() => dispatch({ type: 'page', page: 'overview', warehouseId: w.id })}>
                  <h2>{w.name}</h2>
                  <p>{t(`sec.wh.type.${w.type}`)}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyBox title={t('sec.wh.noResults')} />
          );
        }}
      </BoxState>
    </div>
  );
}

function Overview({ s, dispatch, floor, store }: P & { floor: Loaded<FloorSnapshot>; store: ReturnType<typeof useMock<import('../../domain/types').Store>> }) {
  const { t, i18n } = useTranslation();
  const live = deriveLive(store, floor);
  const metrics = useMock(fetchShiftMetrics, s.scenario);
  const timing = useMock(fetchOrderTiming, s.scenario);
  const team = useMock(fetchPickerTeam, s.scenario);
  const f = floor.status === 'ready' ? floor.data : null;
  const onShift = f?.pickers.filter((p) => p.status !== 'offline') ?? [];
  const attention = f?.orders.filter((o) => o.lateByMinutes != null || o.pfPending).sort((a, b) => (b.lateByMinutes ?? 0) - (a.lateByMinutes ?? 0)) ?? [];
  const pickerOrder = new Map(f?.orders.filter((o) => o.pickerId).map((o) => [o.pickerId!, o]));
  const stageVal = (n: number) => (live.ready ? n : '–');

  const stages: [string, number][] = [
    ['unassigned', live.stages.unassigned],
    ['picking', live.stages.picking],
    ['packing', live.stages.packing],
    ['readyForRider', live.stages.readyForRider],
  ];

  return (
    <>
      <div className="lg-live-row">
        <LiveTag on={live.live} text={live.failed ? t('sec.unavailable') : live.loading ? t('sec.loading') : live.closed ? t('sec.offline') : t('sec.live', { time: nowClock(i18n.language) })} />
        <div className="lg-stages">
          {stages.map(([k, n]) => (
            <span key={k} className={`lg-stage${live.ready && n > 0 ? ` lg-stage--${k}` : ''}`}>
              <b>{stageVal(n)}</b>
              <span>{t(`sec.stage.${k}`)}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="lg-now">
        <section className="lg-now__col">
          <div className="lg-now__head">
            <span>{t('sec.overview.needsAttention')}</span>
          </div>
          {live.failed ? (
            <div className="lg-error">{t('state.error')}</div>
          ) : !f ? (
            <div className="box-skeleton" />
          ) : live.closed ? (
            <EmptyCenter icon="checkCircle" text={t('sec.overview.closed')} tall />
          ) : attention.length ? (
            <ul className="lg-attn">
              {attention.map((o) => (
                <li key={o.orderId} className={`lg-attn__row${o.lateByMinutes != null ? ' lg-attn__row--late' : ''}`}>
                  <b>#{o.externalOrderId}</b>
                  <span className="lg-muted">{t('sec.overview.inStage', { stage: t(`sec.stage.${o.stage === 'unassigned' ? 'unassigned' : o.stage}`), items: items(t, o.items) })}</span>
                  <span className="lg-spacer" />
                  <span className="lg-muted">{live.pickerName(o.pickerId) ?? t('sec.overview.notAssigned')}</span>
                  {o.lateByMinutes != null ? <span className="lg-late">{t('sec.overview.late', { minutes: o.lateByMinutes })}</span> : <span className="lg-pf">{t('sec.overview.pf')}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyCenter icon="checkCircle" text={t('sec.overview.nothingNeeds')} tall />
          )}
        </section>
        <section className="lg-now__col lg-now__col--people">
          <div className="lg-now__head">
            <span>{t('sec.overview.people')}</span>
            <span>{t('sec.overview.working', { working: live.working.length, total: onShift.length })}</span>
          </div>
          {live.failed ? (
            <div className="lg-error">{t('state.error')}</div>
          ) : !f ? (
            <div className="box-skeleton" />
          ) : onShift.length ? (
            <ul className="lg-people">
              {onShift.map((p) => {
                const o = pickerOrder.get(p.pickerId);
                return (
                  <li key={p.pickerId}>
                    <span className="lg-avatar">{p.displayName.replace('Picker ', 'P')}</span>
                    <b>{p.displayName}</b>
                    <span className={`lg-pill lg-pill--${p.status}`}>{p.status === 'idle' ? t('sec.overview.idleFor', { minutes: p.minutesInStatus }) : t(`sec.overview.status.${p.status}`)}</span>
                    <span className="lg-spacer" />
                    {o && <span className="lg-muted">{t('sec.overview.holds', { order: o.externalOrderId, minutes: o.minutesInStage })}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyCenter icon="group" text={t('sec.overview.noPickers')} tall />
          )}
        </section>
      </div>

      <div className="lg-shift">
        <div className="lg-shift__head">
          <h2>
            <CapeIcon name="lineChart" />
            {t('sec.overview.shift')}
          </h2>
          <div className="lg-shift__actions">
            <button type="button" className="lg-btn lg-btn--ghost" onClick={() => dispatch({ type: 'page', page: 'orders' })}>
              {t('sec.overview.viewHistory')}
            </button>
            <Dropdown value={s.range} align="end" label={t('sec.range.label')} options={RANGES.map((r) => ({ value: r, label: t(`sec.range.${r}`) }))} onChange={(r) => dispatch({ type: 'range', range: r })} />
          </div>
        </div>
        <div className="lg-shift__grid">
          <div className="lg-card lg-stats">
            <BoxState state={metrics} lines={7}>
              {(m) => {
                const prep = m.avgAssignmentSeconds + m.avgPickingSeconds + m.avgPackingSeconds;
                const sec = (v: number) => (v === 0 ? '0s' : formatSeconds(v));
                return (
                  <>
                    <div className="lg-stats__row">
                      <span>{t('sec.overview.successful')}</span>
                      <b className="lg-stats__hero">{m.successfulOrders}</b>
                    </div>
                    <hr />
                    <div className="lg-stats__list">
                      <div className="lg-stats__row">
                        <span>{t('sec.overview.avgPrep')}</span>
                        <b>{sec(prep)}</b>
                      </div>
                      {(['assignment', 'picking', 'packing'] as const).map((k) => (
                        <div key={k} className="lg-stats__row lg-stats__row--sub">
                          <span>{t(`sec.overview.${k}`)}</span>
                          <span>{sec(k === 'assignment' ? m.avgAssignmentSeconds : k === 'picking' ? m.avgPickingSeconds : m.avgPackingSeconds)}</span>
                        </div>
                      ))}
                      <hr />
                      <div className="lg-stats__row">
                        <span>{t('sec.overview.avgDispatch')}</span>
                        <b>{m.successfulOrders ? '6.4m' : t('sec.overview.na')}</b>
                      </div>
                      <hr />
                      <div className="lg-stats__row">
                        <span>{t('sec.overview.pfr')}</span>
                        <b>{formatPercent(m.pfr)}</b>
                      </div>
                      <div className="lg-stats__row">
                        <span>{t('sec.overview.failRate')}</span>
                        <b>{formatPercent(m.issueRate)}</b>
                      </div>
                    </div>
                  </>
                );
              }}
            </BoxState>
          </div>
          <section className="lg-card lg-chart">
            <h3>{t('sec.overview.timePerOrder')}</h3>
            <BoxState state={timing} lines={6}>
              {(b) =>
                b.length ? (
                  <>
                    <ul className="legend">
                      <li><span className="legend__swatch legend__swatch--assign" />{t('sec.overview.assignment')}</li>
                      <li><span className="legend__swatch legend__swatch--pick" />{t('sec.overview.picking')}</li>
                      <li><span className="legend__swatch legend__swatch--pack" />{t('sec.overview.packing')}</li>
                    </ul>
                    <TimingChart buckets={b.slice(-RANGE_HOURS[s.range])} />
                  </>
                ) : (
                  <EmptyCenter icon="lineChart" text={t('sec.overview.noHistory')} tall />
                )
              }
            </BoxState>
          </section>
        </div>
        <section className="lg-card lg-team">
          <h2 className="lg-h2">{t('sec.overview.pickerTeam')}</h2>
          <BoxState state={team} lines={6}>
            {(rows) => (rows.length ? <PickerTeamTable rows={rows} sort={s.sort} onSort={(k) => dispatch({ type: 'sort', key: k })} floor={floor} /> : <EmptyCenter icon="group" text={t('sec.overview.noPickerData')} />)}
          </BoxState>
        </section>
      </div>
    </>
  );
}

export function Orders({ s, dispatch }: P) {
  const { t, i18n } = useTranslation();
  const data = useMock(fetchOrderHistory, s.scenario);
  const f = s.history;
  const [draft, setDraft] = useState({ orderId: f.orderId, customer: f.customer });
  const h = (patch: Partial<typeof f>) => dispatch({ type: 'history', patch });
  return (
    <div className="lg-page">
      <div className="lg-title-row">
        <h1 className="lg-h1">{t('sec.history.title')}</h1>
        <LiveTag on={false} text={t('sec.live', { time: nowClock(i18n.language) })} />
      </div>
      <div className="lg-filters">
        <Field label={t('sec.history.stage')}>
          <Dropdown value={f.stage} label={t('sec.history.stage')} options={HISTORY_STAGES.map((v) => ({ value: v, label: t(`sec.history.stages.${v}`) }))} onChange={(v) => h({ stage: v })} />
        </Field>
        <Field label={t('sec.history.fulfillment')}>
          <Dropdown value={f.fulfillment} label={t('sec.history.fulfillment')} options={(['all', 'full', 'partial'] as const).map((v) => ({ value: v, label: t(`sec.history.fulfill.${v}`) }))} onChange={(v) => h({ fulfillment: v })} />
        </Field>
        <Field label={t('sec.history.startDate')} wide>
          <span className="lg-input lg-input--date">
            <input type="date" aria-label={t('sec.history.startDate')} />
            <CapeIcon name="date" />
          </span>
        </Field>
        <Field label={t('sec.history.endDate')} wide>
          <span className="lg-input lg-input--date">
            <input type="date" aria-label={t('sec.history.endDate')} />
            <CapeIcon name="date" />
          </span>
        </Field>
        <Field label={t('sec.history.orderId')}>
          <input className="lg-input" value={draft.orderId} onChange={(e) => setDraft({ ...draft, orderId: e.target.value })} />
        </Field>
        <Field label={t('sec.history.customer')}>
          <input className="lg-input" value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} />
        </Field>
        <button type="button" className="lg-btn lg-btn--ghost lg-btn--32" onClick={() => h(draft)}>
          {t('sec.history.apply')}
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
                      {(['order', 'short', 'stage', 'pickup', 'received', 'customer', 'picker', 'amount', 'cancelledAt'] as const).map((c) => (
                        <th key={c}>{t(`sec.history.col.${c}`)}</th>
                      ))}
                      <th>
                        <span className="visually-hidden">{t('sec.history.col.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.rows.length ? (
                      v.rows.map((r) => (
                        <tr key={r.orderId}>
                          <td><b>#{r.orderId}</b></td>
                          <td>{r.shortCode}</td>
                          <td><span className={`lg-badge lg-badge--${r.stage}`}>{t(`sec.history.stages.${r.stage}`)}</span></td>
                          <td className={r.timeToPickupMinutes != null && r.timeToPickupMinutes < 0 ? 'lg-late' : ''}>
                            {r.timeToPickupMinutes == null ? '—' : r.timeToPickupMinutes < 0 ? t('sec.history.pickupLate', { minutes: -r.timeToPickupMinutes }) : t('sec.history.pickupIn', { minutes: r.timeToPickupMinutes })}
                          </td>
                          <td>{formatClock(r.receivedAt, i18n.language)}</td>
                          <td>{r.customer}</td>
                          <td>{r.picker ?? '—'}</td>
                          <td>{formatMoney(r.amount, i18n.language)}</td>
                          <td>{r.cancelledAt ? formatClock(r.cancelledAt, i18n.language) : '—'}</td>
                          <td>
                            <button type="button" className="lg-icon-btn" aria-label={t('sec.history.more', { order: r.orderId })}>
                              ⋯
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="lg-table__empty">{t('sec.history.noOrders')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="lg-pager">
                <p>{v.total ? t('sec.history.showing', { from: v.first, to: v.first + v.rows.length - 1, total: v.total }) : t('sec.history.noResults')}</p>
                <div className="lg-pager__right">
                  <Dropdown value={f.pageSize} active align="end" label={t('sec.history.rowsPerPage')} options={PAGE_SIZES.map((n) => ({ value: n, label: String(n) }))} onChange={(n) => h({ pageSize: n })} />
                  <button type="button" className="lg-icon-btn" disabled={v.page <= 1} aria-label={t('sec.history.prev')} onClick={() => dispatch({ type: 'history', patch: { page: v.page - 1 } })}>
                    <CapeIcon name="chevronLeft" className="lg-rtl-flip" />
                  </button>
                  <span className="lg-pager__page">{v.page}</span>
                  <button type="button" className="lg-icon-btn" disabled={v.page >= v.pages} aria-label={t('sec.history.next')} onClick={() => dispatch({ type: 'history', patch: { page: v.page + 1 } })}>
                    <CapeIcon name="chevronRight" className="lg-rtl-flip" />
                  </button>
                </div>
              </div>
            </>
          );
        }}
      </BoxState>
    </div>
  );
}

export function Cancellations({ s, dispatch }: P) {
  const { t, i18n } = useTranslation();
  const data = useMock(fetchCancellations, s.scenario);
  const [returned, setReturned] = useState<string[]>([]);
  return (
    <div className="lg-page">
      <h1 className="lg-h1">{t('sec.cancel.title')}</h1>
      <BoxState state={data} lines={5}>
        {(raw) => {
          const rows = raw.map((r) => (returned.includes(r.orderId) ? { ...r, status: 'settled' as const } : r));
          const v = cancellationView(rows, s.cancelTab);
          return (
            <>
              <div className="lg-chips">
                {(['pending_return', 'settled', 'all'] as const).map((k) => (
                  <Chip key={k} selected={s.cancelTab === k} onClick={() => dispatch({ type: 'cancelTab', tab: k })}>
                    {t(`sec.cancel.${k}`, { count: v.counts[k] })}
                  </Chip>
                ))}
              </div>
              {v.rows.length ? (
                <div className="lg-table">
                  <table>
                    <thead>
                      <tr>
                        {(['order', 'cancelledAt', 'reason', 'items', 'picker', 'status'] as const).map((c) => (
                          <th key={c}>{t(`sec.cancel.col.${c}`)}</th>
                        ))}
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {v.rows.map((r) => (
                        <tr key={r.orderId}>
                          <td><b>#{r.orderId}</b> <span className="lg-muted">{r.shortCode}</span></td>
                          <td>{formatClock(r.cancelledAt, i18n.language)}</td>
                          <td>{r.reason}</td>
                          <td>{items(t, r.items)}</td>
                          <td>{r.picker ?? '—'}</td>
                          <td><span className={`lg-badge lg-badge--${r.status === 'settled' ? 'successful' : 'awaiting_approval'}`}>{r.status === 'settled' ? t('sec.cancel.settledTag') : t('sec.cancel.pendingTag')}</span></td>
                          <td>
                            {r.status === 'pending_return' && (
                              <button type="button" className="lg-btn lg-btn--outline lg-btn--32" onClick={() => setReturned([...returned, r.orderId])}>
                                {t('sec.cancel.returnStock')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyBox
                  title={s.cancelTab === 'pending_return' ? t('sec.cancel.emptyTitle') : s.cancelTab === 'settled' ? t('sec.cancel.emptySettled') : t('sec.cancel.emptyAll')}
                  body={s.cancelTab === 'pending_return' ? t('sec.cancel.emptyBody') : undefined}
                />
              )}
            </>
          );
        }}
      </BoxState>
    </div>
  );
}

export function Issues({ s, dispatch }: P) {
  const { t, i18n } = useTranslation();
  const data = useMock(fetchOrderIssues, s.scenario);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const f = s.issues;
  const [draft, setDraft] = useState({ signal: f.signal, reason: f.reason, cause: f.cause, picker: f.picker });
  const set = (patch: Partial<typeof f>) => dispatch({ type: 'issues', patch });
  return (
    <div className="lg-page">
      <div className="lg-title-row lg-title-row--baseline">
        <h1 className="lg-h1">{t('sec.issues.title')}</h1>
        <span className="lg-small">{t('sec.issues.updated', { minutes: 0 })}</span>
      </div>
      <BoxState state={data} lines={6}>
        {(raw) => {
          const v = issuesView(
            raw.map((i) => (reviewed.includes(i.id) ? { ...i, reviewed: true } : i)),
            f,
          );
          const k = v.kpis;
          const renderRow = (i: (typeof v.rows)[number]) => (
            <li key={i.id} className="lg-issue">
              <div className="lg-issue__main">
                <b>#{i.orderId}</b>
                <span className="lg-muted">{i.shortCode} · {formatClock(i.at, i18n.language)}</span>
              </div>
              <span className={`lg-badge lg-badge--sig-${i.signal}`}>{t(`sec.issues.signal.${i.signal}`)}</span>
              <span>{t(`sec.issues.reason.${i.reason}`)}</span>
              <span className="lg-muted">{i.item}</span>
              <span className="lg-muted">{t(`sec.issues.cause.${i.cause}`)}</span>
              <span className="lg-spacer" />
              <span>{i.amount != null ? formatMoney(i.amount, i18n.language) : '—'}</span>
              {i.reviewed ? (
                <span className="lg-badge lg-badge--successful">{t('sec.issues.reviewedTag')}</span>
              ) : (
                <button type="button" className="lg-btn lg-btn--ghost lg-btn--32" onClick={() => setReviewed([...reviewed, i.id])}>
                  {t('sec.issues.markReviewed')}
                </button>
              )}
            </li>
          );
          return (
            <>
              <div className="lg-kpis">
                <Kpi label={t('sec.issues.kpiOrders')} value={k.orders} />
                <Kpi label={t('sec.issues.kpiMoney')} value={k.money != null ? formatMoney(k.money, i18n.language) : '—'} />
                <Kpi label={t('sec.issues.kpiInStore')} value={k.inStore} extra={t('sec.issues.ofTotal', { total: k.orders })} />
                <Kpi label={t('sec.issues.kpiTop')} value={k.top ? k.top[0] : '—'} small extra={k.top ? t('sec.issues.topCount', { count: k.top[1] }) : undefined} />
              </div>
              <div className="lg-issue-bar">
                <div className="lg-pills">
                  {(['new', 'reviewed', 'all'] as const).map((tab) => (
                    <button key={tab} type="button" className={`lg-seg${f.tab === tab ? ' lg-seg--on' : ''}`} aria-pressed={f.tab === tab} onClick={() => set({ tab })}>
                      {t(`sec.issues.tab.${tab}`)} <span>{v.counts[tab]}</span>
                    </button>
                  ))}
                </div>
                <div className="lg-group">
                  <span className="lg-small">{t('sec.issues.groupBy')}</span>
                  <div className="lg-toggle">
                    {(['order', 'picker'] as const).map((g) => (
                      <button key={g} type="button" className={f.groupBy === g ? 'is-on' : ''} aria-pressed={f.groupBy === g} onClick={() => set({ groupBy: g })}>
                        {t(`sec.issues.${g}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg-filters lg-filters--inline">
                <Dropdown value={f.range} active label={t('sec.range.label')} options={[{ value: 'today' as const, label: t('sec.issues.rangeToday') }, { value: '7d' as const, label: t('sec.issues.range7d') }]} onChange={(r) => set({ range: r })} />
                <Dropdown value={draft.signal} label={t('sec.issues.signal.all')} options={ISSUE_SIGNALS.map((x) => ({ value: x, label: t(`sec.issues.signal.${x}`) }))} onChange={(x) => setDraft({ ...draft, signal: x })} />
                <Dropdown value={draft.reason} label={t('sec.issues.reason.all')} options={ISSUE_REASONS.map((x) => ({ value: x, label: t(`sec.issues.reason.${x}`) }))} onChange={(x) => setDraft({ ...draft, reason: x })} />
                <Dropdown value={draft.cause} label={t('sec.issues.cause.all')} options={ISSUE_CAUSES.map((x) => ({ value: x, label: t(`sec.issues.cause.${x}`) }))} onChange={(x) => setDraft({ ...draft, cause: x })} />
                <Dropdown value={draft.picker} label={t('sec.issues.allPickers')} options={[{ value: 'all', label: t('sec.issues.allPickers') }, ...v.pickers.map((p) => ({ value: p, label: p }))]} onChange={(x) => setDraft({ ...draft, picker: x })} />
                <button type="button" className="lg-btn lg-btn--apply" disabled={JSON.stringify(draft) === JSON.stringify({ signal: f.signal, reason: f.reason, cause: f.cause, picker: f.picker })} onClick={() => set(draft)}>
                  {t('sec.issues.apply')}
                </button>
              </div>
              {v.rows.length === 0 ? (
                <EmptyBox
                  title={v.counts.all === 0 ? (f.range === 'today' ? t('sec.issues.emptyToday') : t('sec.issues.emptyWeek')) : t('sec.issues.emptyFiltered')}
                  body={v.counts.all === 0 && f.range === 'today' ? t('sec.issues.yesterday', { count: v.yesterday }) : undefined}
                />
              ) : f.groupBy === 'picker' ? (
                v.groups.map((g) => (
                  <section key={g.key} className="lg-card lg-issue-group">
                    <h3>
                      {g.key === '—' ? t('sec.issues.noPicker') : g.key} <span className="lg-muted">{t('sec.issues.issueCount', { count: g.rows.length })}</span>
                    </h3>
                    <ul className="lg-issues">{g.rows.map(renderRow)}</ul>
                  </section>
                ))
              ) : (
                <ul className="lg-card lg-issues">{v.rows.map(renderRow)}</ul>
              )}
            </>
          );
        }}
      </BoxState>
    </div>
  );
}

function Kpi({ label, value, extra, small }: { label: string; value: ReactNode; extra?: string; small?: boolean }) {
  return (
    <div className="lg-kpi">
      <span className="lg-small">{label}</span>
      <span className="lg-kpi__value">
        <b className={small ? 'lg-kpi__small' : ''}>{value}</b>
        {extra && <span className="lg-small">{extra}</span>}
      </span>
    </div>
  );
}

/** Legacy Version: the Store Management Cockpit as it ships in staging (talabat theme, Ops Portal shell). */
export function CockpitLegacy({ s, dispatch }: P) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const store = useMock(fetchStore, s.scenario);
  const floor = useMock(fetchFloor, s.scenario);
  const name = warehouseName(s.warehouseId);
  const pageTitle: Partial<Record<Page, string>> = { orders: t('sec.nav.orderHistory'), cancellations: t('sec.nav.cancellations'), issues: t('sec.nav.issues') };

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
              <div className="lg-crumb-row">
                <Crumbs s={s} dispatch={dispatch} store={name} page={pageTitle[s.page]} />
              </div>
              {s.page === 'overview' && <Overview s={s} dispatch={dispatch} floor={floor} store={store} />}
              {s.page === 'orders' && <Orders key={s.warehouseId} s={s} dispatch={dispatch} />}
              {s.page === 'cancellations' && <Cancellations s={s} dispatch={dispatch} />}
              {s.page === 'issues' && <Issues s={s} dispatch={dispatch} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
