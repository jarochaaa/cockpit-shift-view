import type { Dispatch, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import portalLogo from '../../assets/v2/portal.svg';
import helpCircle from '../../assets/v2/help-circle.svg';
import navCalendar from '../../assets/v2/nav-calendar.svg';
import navCart from '../../assets/v2/nav-cart.svg';
import navDashboard from '../../assets/v2/nav-dashboard.svg';
import navHistory from '../../assets/v2/nav-history.svg';
import navStores from '../../assets/v2/nav-stores.svg';
import notifications from '../../assets/v2/notifications.svg';
import statusDot from '../../assets/v2/status-dot.svg';
import { Avatar } from '../../cape/Avatar';
import { Button } from '../../cape/Button';
import { Indicator } from '../../cape/Indicator';
import { List, ListItem, ListItemText } from '../../cape/List';
import { Select } from '../../cape/Select';
import { formatPercent, formatSeconds } from '../../domain/format';
import { fetchFloor, fetchOrderTiming, fetchPickerTeam, fetchShiftMetrics, fetchStore } from '../../domain/mockApi';
import { warehouseName } from '../../domain/mockData';
import { RTL_LOCALES } from '../../i18n';
import { RANGES, RANGE_HOURS } from '../../state';
import type { Action, Page, State, TimingRange } from '../../state';
import { CapeIcon } from '../legacy/icons';
import type { IconName } from '../legacy/icons';
import { nowClock } from '../sections';
import { Card } from '../../cape/Card';
import { Divider } from '../../cape/Divider';
import { Tag } from '../../cape/Tag';
import { Cancellations, Issues, Orders, Warehouses } from '../legacy/CockpitLegacy';
import { BoxState } from '../BoxState';
import { deriveLive } from '../live';
import { PickerTeamTable } from '../ShiftBoard';
import { TimingChart } from '../TimingChart';
import { useMock } from '../useMock';
import './v2.css';

/** Icons keep their own width/height; the 24px slot only centers them, as in the Figma placeholder. */
function Icon({ src, className }: { src: string; className?: string }) {
  return (
    <span className={`v2-icon${className ? ` ${className}` : ''}`} aria-hidden>
      <img src={src} alt="" />
    </span>
  );
}

type NavItem = { key: string; icon: string; page: Page };
// Same sections as the Store Management Cockpit, in the DMarts Portal sidenav.
const NAV: { section?: string; items: NavItem[] }[] = [
  {
    items: [
      { key: 'overview', icon: navDashboard, page: 'overview' },
      { key: 'stores', icon: navStores, page: 'warehouses' },
    ],
  },
  {
    section: 'orders',
    items: [
      { key: 'orderHistory', icon: navHistory, page: 'orders' },
      { key: 'cancellations', icon: navCart, page: 'cancellations' },
      { key: 'issues', icon: navCalendar, page: 'issues' },
    ],
  },
];

function Sidenav({ page, onGo }: { page: Page; onGo: (p: Page) => void }) {
  const { t } = useTranslation();
  const label = (key: string) => (key === 'stores' || key === 'settings' ? t(`v2.nav.${key}`) : t(`sec.nav.${key}`));
  return (
    <nav className="v2-sidenav" aria-label={t('v2.nav.main')}>
      <div className="v2-sidenav__brand" dir="ltr">
        <span className="v2-sidenav__dmarts">DMarts</span>
        <img src={portalLogo} alt="Portal" width={65.8958} height={24} />
      </div>
      <div className="v2-sidenav__sections">
        {NAV.map((group, i) => (
          <div key={group.section ?? i} className="v2-sidenav__section">
            {group.section && <div className="v2-sidenav__header">{label(group.section)}</div>}
            {group.items.map((item) => {
              const active = item.page === page;
              return (
                <a
                  key={item.key}
                  href="#"
                  className={`v2-sidenav__item${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onGo(item.page);
                  }}
                >
                  <Icon src={item.icon} />
                  <span className="v2-sidenav__label">{label(item.key)}</span>
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="v2-section-header">
      <h2 className="v2-section-header__title">{title}</h2>
      {action}
    </div>
  );
}

type StageKey = 'unassigned' | 'picking' | 'packing' | 'readyForRider';
const STAGE_TONE: Record<StageKey, 'warning' | 'info' | 'success'> = { unassigned: 'warning', picking: 'warning', packing: 'info', readyForRider: 'success' };

/** Empty or closed state, the same message the Legacy Version shows, in a Cape card. */
function Empty({ icon, text, bare }: { icon?: IconName; text: string; bare?: boolean }) {
  const body = (
    <div className="v2-empty">
      {icon && <CapeIcon name={icon} size={32} />}
      <p>{text}</p>
    </div>
  );
  return bare ? body : <Card className="v2-card">{body}</Card>;
}


/** DMarts Portal layout (Cape default theme), same content as Version 1. */
export function CockpitV2({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const { t, i18n } = useTranslation();
  const store = useMock(fetchStore, s.scenario);
  const floor = useMock(fetchFloor, s.scenario);
  const metrics = useMock(fetchShiftMetrics, s.scenario);
  const timing = useMock(fetchOrderTiming, s.scenario);
  const team = useMock(fetchPickerTeam, s.scenario);
  const live = deriveLive(store, floor);
  const name = warehouseName(s.warehouseId);
  const open = store.status === 'ready' && store.data.status === 'open';
  const dash = (n: number) => (live.ready ? n : '–');
  const f = floor.status === 'ready' ? floor.data : null;
  const onShift = f?.pickers.filter((p) => p.status !== 'offline') ?? [];
  const attention = f?.orders.filter((o) => o.lateByMinutes != null || o.pfPending).sort((a, b) => (b.lateByMinutes ?? 0) - (a.lateByMinutes ?? 0)) ?? [];
  const pickerOrder = new Map(f?.orders.filter((o) => o.pickerId).map((o) => [o.pickerId!, o]));
  const stages: [StageKey, number][] = [
    ['unassigned', live.stages.unassigned],
    ['picking', live.stages.picking],
    ['packing', live.stages.packing],
    ['readyForRider', live.stages.readyForRider],
  ];

  return (
    <div className="cockpit cockpit--v2" data-theme="cape-light-b2b" dir={RTL_LOCALES.has(s.lang) ? 'rtl' : 'ltr'} lang={s.lang}>
      <Sidenav page={s.page} onGo={(page) => dispatch({ type: 'page', page })} />
      <main className="v2-main">
        {s.page !== 'overview' ? (
          <div className="v2-subpage">
            {s.page === 'warehouses' && <Warehouses s={s} dispatch={dispatch} />}
            {s.page === 'orders' && <Orders s={s} dispatch={dispatch} />}
            {s.page === 'cancellations' && <Cancellations s={s} dispatch={dispatch} />}
            {s.page === 'issues' && <Issues s={s} dispatch={dispatch} />}
          </div>
        ) : (
        <>
        <header className="v2-page-header">
          <Button
            variant="secondary"
            status="inverse"
            size="medium"
            className="v2-pill v2-pill--icon v2-back v2-flip"
            aria-label={t('header.backToStores')}
            title={t('header.backToStores')}
            startIcon={<CapeIcon name="chevronLeft" />}
            onClick={() => dispatch({ type: 'page', page: 'warehouses' })}
          />
          <h1 className="v2-page-header__title">{name}</h1>
          <div className="v2-page-header__actions">
            <Button variant="secondary" status="inverse" size="medium" className="v2-pill" startIcon={open ? <Icon src={statusDot} /> : <Indicator status="subtle" size="large" />}>
              {open ? t('v2.open') : t('v2.closed')}
            </Button>
            <Button variant="secondary" status="inverse" size="medium" className="v2-pill" startIcon={<Icon src={helpCircle} />}>
              {t('v2.help')}
            </Button>
            <Button variant="secondary" status="inverse" size="medium" className="v2-pill v2-pill--icon" aria-label={t('v2.notifications')} startIcon={<Icon src={notifications} />} />
            <Avatar size="large" initials="A" title={t('header.account')} className="v2-avatar" />
          </div>
        </header>

        <div className="v2-live-row">
          <span className={`v2-live${live.live ? ' v2-live--on' : ''}`}>
            <Indicator status={live.live ? 'error' : 'neutral'} size="small" />
            {live.failed ? t('sec.unavailable') : live.loading ? t('sec.loading') : live.closed ? t('sec.offline') : t('sec.live', { time: nowClock(i18n.language) })}
          </span>
          <div className="v2-stages">
            {stages.map(([k, n]) => (
              <Tag key={k} status={live.ready && n > 0 ? STAGE_TONE[k] : 'neutral'} className="v2-stage">
                <b>{dash(n)}</b>
                {t(`sec.stage.${k}`)}
              </Tag>
            ))}
          </div>
        </div>

        <div className="v2-columns">
          <section className="v2-section">
            <SectionHeader title={t('sec.overview.needsAttention')} />
            {live.failed ? (
              <Empty text={t('state.error')} />
            ) : !f ? (
              <div className="box-skeleton" />
            ) : live.closed ? (
              <Empty icon="checkCircle" text={t('sec.overview.closed')} />
            ) : attention.length ? (
              <List className="v2-list">
                {attention.map((o) => (
                  <ListItem
                    key={o.orderId}
                    secondaryAction={
                      <>
                        <span className="v2-list__time">{live.pickerName(o.pickerId) ?? t('sec.overview.notAssigned')}</span>
                        {o.lateByMinutes != null ? (
                          <Tag size="small" status="error">{t('sec.overview.late', { minutes: o.lateByMinutes })}</Tag>
                        ) : (
                          <Tag size="small" status="warning">{t('sec.overview.pf')}</Tag>
                        )}
                      </>
                    }
                  >
                    <ListItemText primaryText={`#${o.externalOrderId}`} secondaryText={t('sec.overview.inStage', { stage: t(`sec.stage.${o.stage}`), items: t('sec.items', { count: o.items }) })} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Empty icon="checkCircle" text={t('sec.overview.nothingNeeds')} />
            )}
          </section>

          <section className="v2-section">
            <SectionHeader title={t('sec.overview.people')} action={<span className="v2-section-header__note">{t('sec.overview.working', { working: live.working.length, total: onShift.length })}</span>} />
            {live.failed ? (
              <Empty text={t('state.error')} />
            ) : !f ? (
              <div className="box-skeleton" />
            ) : onShift.length ? (
              <List className="v2-list">
                {onShift.map((p) => {
                  const o = pickerOrder.get(p.pickerId);
                  return (
                    <ListItem key={p.pickerId} secondaryAction={o && <span className="v2-list__time">{t('sec.overview.holds', { order: o.externalOrderId, minutes: o.minutesInStage })}</span>}>
                      <Avatar size="small" initials={p.displayName.replace('Picker ', 'P')} />
                      <ListItemText primaryText={p.displayName} />
                      <Tag size="small" status={p.status === 'idle' ? 'warning' : p.status === 'offline' ? 'neutral' : 'success'}>
                        {p.status === 'idle' ? t('sec.overview.idleFor', { minutes: p.minutesInStatus }) : t(`sec.overview.status.${p.status}`)}
                      </Tag>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Empty icon="group" text={t('sec.overview.noPickers')} />
            )}
          </section>
        </div>

        <section className="v2-section">
          <SectionHeader
            title={t('sec.overview.shift')}
            action={
              <div className="v2-shift-actions">
                <Button variant="tertiary" status="inverse" size="small" onClick={() => dispatch({ type: 'page', page: 'orders' })}>
                  {t('sec.overview.viewHistory')}
                </Button>
                <Select
                  className="v2-range"
                  aria-label={t('sec.range.label')}
                  value={s.range}
                  onChange={(v) => dispatch({ type: 'range', range: v as TimingRange })}
                  options={RANGES.map((r) => ({ value: r, label: t(`sec.range.${r}`) }))}
                />
              </div>
            }
          />
          <div className="v2-shift-grid">
            <Card className="v2-card v2-kv">
              <BoxState state={metrics} lines={7}>
                {(m) => {
                  const sec = (v: number) => (v === 0 ? '0s' : formatSeconds(v));
                  return (
                    <>
                      <div className="v2-kv__row">
                        <span>{t('sec.overview.successful')}</span>
                        <b className="v2-kv__hero">{m.successfulOrders}</b>
                      </div>
                      <Divider />
                      <div className="v2-kv__row">
                        <span>{t('sec.overview.avgPrep')}</span>
                        <b>{sec(m.avgAssignmentSeconds + m.avgPickingSeconds + m.avgPackingSeconds)}</b>
                      </div>
                      {(['assignment', 'picking', 'packing'] as const).map((k) => (
                        <div key={k} className="v2-kv__row v2-kv__row--sub">
                          <span>{t(`sec.overview.${k}`)}</span>
                          <span>{sec(k === 'assignment' ? m.avgAssignmentSeconds : k === 'picking' ? m.avgPickingSeconds : m.avgPackingSeconds)}</span>
                        </div>
                      ))}
                      <Divider />
                      <div className="v2-kv__row">
                        <span>{t('sec.overview.avgDispatch')}</span>
                        <b>{m.successfulOrders ? '6.4m' : t('sec.overview.na')}</b>
                      </div>
                      <Divider />
                      <div className="v2-kv__row">
                        <span>{t('sec.overview.pfr')}</span>
                        <b>{formatPercent(m.pfr)}</b>
                      </div>
                      <div className="v2-kv__row">
                        <span>{t('sec.overview.failRate')}</span>
                        <b>{formatPercent(m.issueRate)}</b>
                      </div>
                    </>
                  );
                }}
              </BoxState>
            </Card>
            <Card className="v2-card">
              <h3 className="v2-card__title">{t('sec.overview.timePerOrder')}</h3>
              <BoxState state={timing} lines={6}>
                {(b) =>
                  b.length ? (
                    <>
                      <ul className="legend v2-legend">
                        <li><span className="legend__swatch legend__swatch--assign" />{t('sec.overview.assignment')}</li>
                        <li><span className="legend__swatch legend__swatch--pick" />{t('sec.overview.picking')}</li>
                        <li><span className="legend__swatch legend__swatch--pack" />{t('sec.overview.packing')}</li>
                      </ul>
                      <TimingChart buckets={b.slice(-RANGE_HOURS[s.range])} />
                    </>
                  ) : (
                    <Empty icon="lineChart" text={t('sec.overview.noHistory')} bare />
                  )
                }
              </BoxState>
            </Card>
          </div>
        </section>

        <section className="v2-section">
          <SectionHeader title={t('sec.overview.pickerTeam')} />
          <BoxState state={team} lines={6}>
            {(rows) =>
              rows.length ? (
                <Card className="v2-card v2-card--table">
                  <PickerTeamTable rows={rows} sort={s.sort} onSort={(k) => dispatch({ type: 'sort', key: k })} floor={floor} />
                </Card>
              ) : (
                <Empty icon="group" text={t('sec.overview.noPickerData')} />
              )
            }
          </BoxState>
        </section>
        </>
        )}
      </main>
    </div>
  );
}
