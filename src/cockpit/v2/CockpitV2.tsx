import { useEffect, useRef, useState } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import portalLogo from '../../assets/v2/portal.svg';
import helpCircle from '../../assets/v2/help-circle.svg';
import navCart from '../../assets/v2/nav-cart.svg';
import navDashboard from '../../assets/v2/nav-dashboard.svg';
import navStores from '../../assets/v2/nav-stores.svg';
import navHistory from '../../assets/v2/nav-history.svg';
import notifications from '../../assets/v2/notifications.svg';
import { Avatar } from '../../cape/Avatar';
import { Button } from '../../cape/Button';
import { Indicator } from '../../cape/Indicator';
import { List, ListItem, ListItemText } from '../../cape/List';
import { Select } from '../../cape/Select';
import { FAIL_ALERT, duration } from '../../domain/prod';
import type { Activity } from '../../domain/prod';
import { warehouseName } from '../../domain/mockData';
import { RTL_LOCALES } from '../../i18n';
import { RANGES, RANGE_HOURS } from '../../state';
import type { Action, Page, State, TimingRange } from '../../state';
import { CapeIcon } from '../legacy/icons';
import { ACTIVITY_LABEL, Cancellations, Orders, OverviewDrawers, VendorSwitcher, Warehouses, attentionMeta, attentionTime, personInitials, useOverview } from '../legacy/CockpitLegacy';
import { LIVE_STAGE_LABEL } from '../prod/Drawers';
import { TeamTable } from '../prod/TeamTable';
import { BoxState } from '../BoxState';
import { TimingChart, TimingLegend } from '../TimingChart';
import { Monitoring } from '../monitoring/Monitoring';
import { AttentionPanel } from '../monitoring/AttentionPanel';
import { useMobile } from './useMobile';
import './v2.css';
import './mobile.css';

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
      // One Overview: it starts at Multi-Store Monitoring and drills into a store's view.
      { key: 'overview', icon: navDashboard, page: 'monitoring' },
      { key: 'stores', icon: navStores, page: 'warehouses' },
    ],
  },
  {
    section: 'orders',
    items: [
      { key: 'orderHistory', icon: navHistory, page: 'orders' },
      { key: 'cancellations', icon: navCart, page: 'cancellations' },
    ],
  },
];

function Sidenav({ page, onGo }: { page: Page; onGo: (p: Page) => void }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const label = (key: string) => (key === 'stores' || key === 'settings' ? t(`v2.nav.${key}`) : t(`sec.nav.${key}`));
  return (
    <nav className={`v2-sidenav${collapsed ? ' v2-sidenav--collapsed' : ''}`} aria-label={t('v2.nav.main')}>
      <div className="v2-sidenav__brand" dir="ltr">
        <span className="v2-sidenav__dmarts">{collapsed ? 'D' : 'DMarts'}</span>
        {!collapsed && <img src={portalLogo} alt="Portal" width={65.8958} height={24} />}
      </div>
      <div className="v2-sidenav__sections">
        {NAV.map((group, i) => (
          <div key={group.section ?? i} className="v2-sidenav__section">
            {group.section && (collapsed ? <hr className="v2-sidenav__rule" /> : <div className="v2-sidenav__header">{label(group.section)}</div>)}
            {group.items.map((item) => {
              const active = item.page === page || (item.page === 'monitoring' && page === 'overview');
              return (
                <a
                  key={item.key}
                  href="#"
                  className={`v2-sidenav__item${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  data-tip={collapsed ? label(item.key) : undefined}
                  aria-label={collapsed ? label(item.key) : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onGo(item.page);
                  }}
                >
                  <Icon src={item.icon} />
                  {!collapsed && <span className="v2-sidenav__label">{label(item.key)}</span>}
                </a>
              );
            })}
          </div>
        ))}
      </div>
      <div className="v2-sidenav__footer">
        <button type="button" className="v2-sidenav__collapse" aria-label={t('sec.nav.collapse')} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
          <CapeIcon name="doubleChevronLeft" size={20} className={collapsed ? 'v2-rot' : undefined} />
        </button>
      </div>
    </nav>
  );
}

/** Phone navigation: the same pages as the sidenav, as an app-style tab bar at the bottom. */
function BottomNav({ page, onGo }: { page: Page; onGo: (p: Page) => void }) {
  const { t } = useTranslation();
  const label = (key: string) => (key === 'stores' || key === 'settings' ? t(`v2.nav.${key}`) : t(`sec.nav.${key}`));
  return (
    <nav className="v2-bottomnav" aria-label={t('v2.nav.main')}>
      {NAV.flatMap((g) => g.items).map((item) => {
        const active = item.page === page || (item.page === 'monitoring' && page === 'overview');
        return (
          <a
            key={item.key}
            href="#"
            className={`v2-bottomnav__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onGo(item.page);
            }}
          >
            <Icon src={item.icon} />
            <span>{label(item.key)}</span>
          </a>
        );
      })}
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

type StageKey = 'unassigned' | 'picking' | 'packing' | 'ready_for_rider';
const STAGES: StageKey[] = ['unassigned', 'picking', 'packing', 'ready_for_rider'];
const WORKING: Activity[] = ['picking', 'packing', 'putaway', 'receiving'];

function Stat({ value, unit, label, stage, onClick }: { value: ReactNode; unit?: string; label: string; stage?: StageKey; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={`v2-stat${onClick ? ' v2-stat--button' : ''}${stage ? ` v2-stat--${stage === 'ready_for_rider' ? 'readyForRider' : stage}` : ''}`}>
      <span className="v2-stat__value">
        {value}
        {unit && <span className="v2-stat__unit">{unit}</span>}
      </span>
      <span className="v2-stat__label">{label}</span>
    </Tag>
  );
}

/** "1.9m" → value + unit, styled like the Figma tiles (24px number, 20px unit). */
function split(v: string) {
  const m = v.match(/^([\d.,]+)\s*(.*)$/);
  return m ? { value: m[1], unit: m[2] || undefined } : { value: v };
}


/** DMarts Portal layout (Cape default theme): the production content in Cape components. */
export function CockpitV2({ s, dispatch, rationales = true }: { s: State; dispatch: Dispatch<Action>; rationales?: boolean }) {
  const { t } = useTranslation();
  const o = useOverview(s);
  const name = warehouseName(s.warehouseId);
  const ready = o.stageOrders.status === 'ready';
  const legend = WORKING.map((a) => [a, o.ppl.filter((p) => p.activity === a).length] as const).filter(([, n]) => n > 0);
  const frame = useRef<HTMLDivElement>(null);
  // Opening another page or store always starts at the top.
  useEffect(() => {
    frame.current?.scrollTo({ top: 0 });
  }, [s.page, s.warehouseId]);
  const mobile = useMobile();
  const err = "Couldn't load this data. It shows up again as soon as the connection is back.";

  return (
    <div ref={frame} className="cockpit cockpit--v2" data-theme="cape-light-b2b" dir={RTL_LOCALES.has(s.lang) ? 'rtl' : 'ltr'} lang={s.lang} data-mobile={mobile ? '' : undefined}>
      {!mobile && <Sidenav page={s.page} onGo={(page) => dispatch({ type: 'page', page })} />}
      <main className="v2-main">
        {s.page === 'monitoring' ? (
          <Monitoring dispatch={dispatch} rationales={rationales} />
        ) : s.page !== 'overview' ? (
          <div className="v2-subpage">
            {s.page === 'warehouses' && <Warehouses s={s} dispatch={dispatch} />}
            {(s.page === 'orders' || s.page === 'issues') && <Orders s={s} dispatch={dispatch} />}
            {s.page === 'cancellations' && <Cancellations s={s} dispatch={dispatch} />}
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
                onClick={() => dispatch({ type: 'page', page: 'monitoring' })}
              />
              <h1 className="v2-page-header__title">{name}</h1>
              <div className="v2-page-header__actions">
                <span className={`v2-live${o.live ? ' v2-live--on' : ''}${o.failed ? ' v2-text--danger' : ''}`}>
                  <Indicator status={o.failed ? 'error' : o.live ? 'error' : 'neutral'} size="small" />
                  {o.liveText}
                </span>
                <VendorSwitcher vendors={o.vendors} />
                <Button variant="secondary" status="inverse" size="medium" className="v2-pill v2-help" startIcon={<Icon src={helpCircle} />}>
                  {t('v2.help')}
                </Button>
                <Button variant="secondary" status="inverse" size="medium" className="v2-pill v2-pill--icon" aria-label={t('v2.notifications')} startIcon={<Icon src={notifications} />} />
                <Avatar size="large" initials="A" title={t('header.account')} className="v2-avatar" />
              </div>
            </header>

            <div className="msm-layout v2-store-layout">
              <div className="msm-main">
            <section className="v2-section">
              <div className="v2-stats v2-stats--live">
                {STAGES.map((k) => {
                  const n = o.count(k);
                  return <Stat key={k} value={ready ? n : '–'} label={LIVE_STAGE_LABEL[k]} stage={ready && n > 0 ? k : undefined} onClick={ready ? () => o.setStageOpen(k) : undefined} />;
                })}
                {o.idle > 0 && (
                  <div className="v2-idle">
                    <b>{o.idle}</b>
                    <span>idle / untracked pickers</span>
                  </div>
                )}
              </div>
            </section>

                <section className="v2-section v2-card v2-people-card">
                  <SectionHeader title="People right now" action={o.people.status === 'ready' ? <span className="v2-section-header__note">{o.working} of {o.ppl.length} working</span> : undefined} />
                  {o.people.status === 'ready' && o.ppl.length > 0 && (
                    <div className="v2-people-bar">
                      <div className="pd-progress" role="img" aria-label={`${o.working} of ${o.ppl.length} working`}>
                        <span style={{ width: `${(o.working / o.ppl.length) * 100}%` }} />
                      </div>
                      <ul className="pd-legend">
                        {(legend.length ? legend : ([['idle', o.ppl.length]] as const)).map(([a, n]) => (
                          <li key={a}>
                            <span className={`pd-dot pd-dot--${a}`} />
                            {n} {ACTIVITY_LABEL[a]}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <List className="v2-list v2-list--scroll">
                    {o.people.status === 'ready' && o.ppl.length > 0 ? (
                      o.ppl.map((p) => (
                        <ListItem key={p.id} secondaryAction={<span className="v2-list__time v2-list__time--strong">{duration(p.seconds)}</span>}>
                          <span className={`pd-dot pd-dot--${p.activity} v2-status-dot`} role="img" aria-label={ACTIVITY_LABEL[p.activity]} />
                          <Avatar size="small" initials={personInitials(p.name)} />
                          <ListItemText primaryText={p.name} secondaryText={<span className={`v2-activity v2-activity--${p.activity}`}>{ACTIVITY_LABEL[p.activity]}</span>} />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primaryText={o.people.status === 'error' ? err : o.people.status === 'loading' ? 'Loading…' : 'No picker activity available right now.'} />
                      </ListItem>
                    )}
                  </List>
                </section>
            <section className="v2-section">
              <SectionHeader
                title="Shift performance"
                action={
                  <Button variant="secondary" status="inverse" size="small" onClick={() => dispatch({ type: 'page', page: 'orders' })}>
                    View order history →
                  </Button>
                }
              />
              <div className="v2-columns v2-combo v2-combo--shift">
                <div className="v2-column">
                  <BoxState state={o.shift} lines={4}>
                    {(m) => (
                      <>
                        <div className="v2-kpis v2-kpis--one">
                          <Stat value={m.successful} label="Successful orders" />
                        </div>
                        <SectionHeader title="Avg prep time" action={<span className="v2-section-header__note">{duration(m.assignment + m.picking + m.packing)}</span>} />
                        <div className="v2-kpis">
                          <Stat {...split(duration(m.assignment))} label="Assignment" />
                          <Stat {...split(duration(m.picking))} label="Picking" />
                          <Stat {...split(duration(m.packing))} label="Packing" />
                          <Stat value={m.dispatch == null ? 'N/A' : duration(m.dispatch)} label="Avg dispatch time" />
                          <Stat {...split(`${(m.pfr * 100).toFixed(2)}%`)} label="Partial fulfillment rate" />
                          <Stat value={<span className={m.failRate > FAIL_ALERT ? 'v2-text--danger' : undefined}>{(m.failRate * 100).toFixed(2)}%</span>} label="Fail rate" />
                        </div>
                      </>
                    )}
                  </BoxState>
                </div>
                <div className="v2-column">
                  <div className="v2-chart">
                    <div className="v2-chart__head">
                      <h3 className="v2-card__title">Time per order, by hour</h3>
                      <Select
                        className="v2-range"
                        aria-label="Time window"
                        value={s.range}
                        onChange={(v) => dispatch({ type: 'range', range: v as TimingRange })}
                        options={RANGES.map((r) => ({ value: r, label: r === 'today' ? 'Today' : `Last ${r}` }))}
                      />
                    </div>
                    <BoxState state={o.timing} lines={5}>
                      {(b) =>
                        b.length ? (
                          <>
                            <TimingChart buckets={b.slice(-RANGE_HOURS[s.range])} />
                            <TimingLegend />
                          </>
                        ) : (
                          <p className="v2-empty">No historical data available for this time range.</p>
                        )
                      }
                    </BoxState>
                  </div>
                </div>
              </div>
            </section>

            <section className="v2-section">
              <SectionHeader title="Picker team" />
              <BoxState state={o.team} lines={6}>
                {(rows) => <div className="v2-card v2-card--table">{rows.length ? <TeamTable rows={rows} sort={s.sort} onSort={(k) => dispatch({ type: 'sort', key: k })} /> : <p className="v2-empty">No picker data available for this time range.</p>}</div>}
              </BoxState>
            </section>
              </div>
              <AttentionPanel
                title="Needs attention"
                empty={o.attention.status === 'error' ? err : o.attention.status === 'loading' ? 'Loading…' : o.closed ? 'The store is closed. Orders and pickers show up here when it opens.' : 'Nothing needs attention right now.'}
                items={
                  o.attention.status === 'ready' && !o.closed
                    ? [
                        // Statuses as the Store Management Cockpit shows them: PF Pending, Late, Return and Count.
                        { key: 'pf-1', tone: 'warning' as const, title: '#695637493', tag: 'PF Pending', meta: 'Stage: Awaiting Approval · Picker A', strong: '1 item short' },
                        ...o.attn.map((a) => ({
                          key: a.orderId,
                          tone: (a.kind === 'return' ? (a.minutes >= 24 * 60 ? 'warning' : 'info') : 'error') as 'warning' | 'info' | 'error',
                          title: `#${a.orderId}`,
                          tag: a.kind === 'return' ? 'Return' : 'Late',
                          meta: attentionMeta(a),
                          strong: attentionTime(a),
                          onClick: () => o.setOrderOpen(a.orderId),
                        })),
                        { key: 'count-1', tone: 'info' as const, title: 'Fresh whole milk 1L', tag: 'Count', meta: '3 of 4 found', strong: 'Off sale 1h 15m' },
                        { key: 'count-2', tone: 'info' as const, title: 'Free-range eggs 6pk', tag: 'Count', meta: 'Waiting for a picker', strong: 'Off sale 40m' },
                      ]
                    : []
                }
              />
            </div>
            <OverviewDrawers o={o} s={s} />
          </>
        )}
      </main>
      {mobile && <BottomNav page={s.page} onGo={(page) => dispatch({ type: 'page', page })} />}
    </div>
  );
}
