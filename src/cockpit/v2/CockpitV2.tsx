import type { Dispatch, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import portalLogo from '../../assets/v2/portal.svg';
import helpCircle from '../../assets/v2/help-circle.svg';
import listCart from '../../assets/v2/list-cart.svg';
import listChevron from '../../assets/v2/list-chevron.svg';
import listPerson from '../../assets/v2/list-person.svg';
import navCalendar from '../../assets/v2/nav-calendar.svg';
import navCart from '../../assets/v2/nav-cart.svg';
import navDashboard from '../../assets/v2/nav-dashboard.svg';
import navHistory from '../../assets/v2/nav-history.svg';
import navStores from '../../assets/v2/nav-stores.svg';
import notifications from '../../assets/v2/notifications.svg';
import sectionChevron from '../../assets/v2/section-chevron.svg';
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

function MoreLink() {
  const { t } = useTranslation();
  return (
    <Button variant="tertiary" status="inverse" size="xsmall" className="v2-more" endIcon={<Icon src={sectionChevron} className="v2-flip" />}>
      {t('v2.more')}
    </Button>
  );
}

type Tone = 'warning' | 'danger' | 'success' | undefined;
function Stat({ value, unit, label, tone }: { value: ReactNode; unit?: string; label: string; tone?: Tone }) {
  return (
    <div className="v2-stat">
      <span className={`v2-stat__value${tone ? ` v2-stat__value--${tone}` : ''}`}>
        {value}
        {unit && <span className="v2-stat__unit">{unit}</span>}
      </span>
      <span className="v2-stat__label">{label}</span>
    </div>
  );
}

/** "1.9m" → value + unit, styled like the Figma tiles (24px number, 20px unit). */
function split(v: string) {
  const m = v.match(/^([\d.,]+)\s*(.*)$/);
  return m ? { value: m[1], unit: m[2] || undefined } : { value: v };
}

function Chevron() {
  return <Icon src={listChevron} className="v2-flip" />;
}

/** DMarts Portal layout (Cape default theme), same content as Version 1. */
export function CockpitV2({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const { t } = useTranslation();
  const store = useMock(fetchStore, s.scenario);
  const floor = useMock(fetchFloor, s.scenario);
  const metrics = useMock(fetchShiftMetrics, s.scenario);
  const timing = useMock(fetchOrderTiming, s.scenario);
  const team = useMock(fetchPickerTeam, s.scenario);
  const live = deriveLive(store, floor);
  const name = warehouseName(s.warehouseId);
  const open = store.status === 'ready' && store.data.status === 'open';
  const dash = (n: number) => (live.ready ? n : '–');
  const items = (n: number) => t('now.items', { count: n });

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

        <section className="v2-section">
          <SectionHeader
            title={t('v2.liveOrders')}
            action={
              live.failed ? (
                <span className="v2-section-header__note v2-text--danger">{t('now.dataUnavailable')}</span>
              ) : (
                <span className={`v2-live${live.live ? ' v2-live--on' : ''}`}>
                  <Indicator status={live.live ? 'error' : 'neutral'} size="small" />
                  {live.loading ? t('now.loading') : live.closed ? t('now.offline') : t('now.live')}
                </span>
              )
            }
          />
          <div className="v2-stats v2-stats--six">
            <Stat value={dash(live.stages.unassigned)} label={t('now.stage.unassigned')} />
            <Stat value={dash(live.stages.picking)} label={t('now.stage.picking')} />
            <Stat value={dash(live.stages.packing)} label={t('now.stage.packing')} />
            <Stat value={dash(live.stages.readyForRider)} label={t('now.stage.readyForRider')} />
            <Stat value={dash(live.late.length)} label={t('v2.lateOrders')} tone={live.ready && live.late.length > 0 ? 'warning' : undefined} />
            <Stat value={dash(live.working.length)} label={t('v2.pickersWorking', { idle: live.idle })} />
          </div>
        </section>

        <div className="v2-columns">
          <div className="v2-column">
            <section className="v2-section">
              <SectionHeader title={t('v2.lateOrders')} action={<MoreLink />} />
              <List className="v2-list">
                {live.ready && !live.closed && live.late.length > 0 ? (
                  live.late.map((o) => (
                    <ListItem
                      key={o.orderId}
                      secondaryAction={
                        <>
                          <span className="v2-list__value v2-text--danger">{t('now.late', { minutes: o.lateByMinutes })}</span>
                          <Chevron />
                        </>
                      }
                    >
                      <Icon src={listCart} />
                      <ListItemText
                        primaryText={`#${o.externalOrderId}`}
                        secondaryText={t('v2.lateMeta', { stage: t(`now.stage.${o.stage}`), items: items(o.items), picker: live.pickerName(o.pickerId) ?? t('now.notAssigned') })}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primaryText={live.failed ? t('state.error') : live.loading ? t('state.loading') : live.closed ? t('now.storeClosed') : t('now.nothingLate')} />
                  </ListItem>
                )}
              </List>
            </section>

            <section className="v2-section">
              <SectionHeader title={t('v2.workingNow', { count: live.working.length })} action={<MoreLink />} />
              <List className="v2-list">
                {live.ready && live.working.length > 0 ? (
                  live.working.map((o) => (
                    <ListItem
                      key={o.orderId}
                      secondaryAction={
                        <>
                          <span className="v2-list__time">{t('now.minutes', { minutes: o.minutesInStage })}</span>
                          <Chevron />
                        </>
                      }
                    >
                      <Icon src={listPerson} />
                      <ListItemText primaryText={live.pickerName(o.pickerId)} secondaryText={t('v2.workingMeta', { order: o.externalOrderId, stage: t(`now.stage.${o.stage}`) })} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primaryText={live.failed ? t('state.error') : live.loading ? t('state.loading') : t('now.noWorking')} />
                  </ListItem>
                )}
              </List>
            </section>
          </div>

          <div className="v2-column">
            <section className="v2-section">
              <SectionHeader
                title={t('shift.title')}
                action={
                  <Select
                    className="v2-range"
                    aria-label={t('shift.timeWindow')}
                    value={s.range}
                    onChange={(v) => dispatch({ type: 'range', range: v as TimingRange })}
                    options={RANGES.map((r) => ({ value: r, label: t(`shift.range.${r}`) }))}
                  />
                }
              />
              <BoxState state={metrics} lines={2}>
                {(m) => (
                  <div className="v2-stats">
                    <Stat value={m.successfulOrders} label={t('shift.successfulOrders')} />
                    <Stat {...split(formatPercent(m.issueRate))} label={t('team.columns.failRate')} tone={m.issueRate > 0.01 ? 'danger' : undefined} />
                    <Stat {...split(formatPercent(m.pfr))} label={t('shift.pfr')} />
                  </div>
                )}
              </BoxState>
            </section>

            <section className="v2-section">
              <BoxState state={metrics} lines={2}>
                {(m) => (
                  <>
                    <SectionHeader
                      title={t('v2.prepByStage')}
                      action={<span className="v2-section-header__note">{t('v2.avgPrep', { value: formatSeconds(m.avgAssignmentSeconds + m.avgPickingSeconds + m.avgPackingSeconds) })}</span>}
                    />
                    <div className="v2-stats">
                      <Stat {...split(formatSeconds(m.avgAssignmentSeconds))} label={t('shift.assignment')} />
                      <Stat {...split(formatSeconds(m.avgPickingSeconds))} label={t('shift.picking')} />
                      <Stat {...split(formatSeconds(m.avgPackingSeconds))} label={t('shift.packing')} />
                    </div>
                  </>
                )}
              </BoxState>
            </section>

            <section className="v2-section">
              <SectionHeader title={t('shift.chartTitle')} />
              <div className="v2-card">
                <ul className="legend v2-legend">
                  <li><span className="legend__swatch legend__swatch--assign" />{t('shift.assignment')}</li>
                  <li><span className="legend__swatch legend__swatch--pick" />{t('shift.picking')}</li>
                  <li><span className="legend__swatch legend__swatch--pack" />{t('shift.packing')}</li>
                  <li><span className="legend__swatch legend__swatch--line" />{t('shift.completed')}</li>
                </ul>
                <BoxState state={timing} lines={5}>
                  {(buckets) => <TimingChart buckets={buckets.slice(-RANGE_HOURS[s.range])} />}
                </BoxState>
              </div>
            </section>
          </div>
        </div>

        <section className="v2-section">
          <BoxState state={team} lines={6}>
            {(rows) => (
              <>
                <SectionHeader title={t('v2.pickerTeam', { count: rows.length })} action={<span className="v2-section-header__note">{t('team.nonZero', { count: rows.filter((r) => r.failRate > 0).length })}</span>} />
                <div className="v2-card v2-card--table">
                  <PickerTeamTable rows={rows} sort={s.sort} onSort={(k) => dispatch({ type: 'sort', key: k })} floor={floor} />
                </div>
              </>
            )}
          </BoxState>
        </section>
        </>
        )}
      </main>
    </div>
  );
}
