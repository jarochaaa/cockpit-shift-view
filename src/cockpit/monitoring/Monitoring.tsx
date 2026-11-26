import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconButton } from '../../cape/IconButton';
import type { CSSProperties, Dispatch } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../cape/Avatar';
import { Button } from '../../cape/Button';
import { Indicator } from '../../cape/Indicator';
import { Select } from '../../cape/Select';
import { Tag } from '../../cape/Tag';
import helpCircle from '../../assets/v2/help-circle.svg';
import notifications from '../../assets/v2/notifications.svg';
import { ALERTS, COUNTRIES, DONOR, ESCALATE_DAY, FEASIBILITY, LEADER, SECONDARY, STORES, SYSTEM_ISSUE, TARGET, aggregate, band, cell, coverage, deviation, instore, nextAction, prep, score } from '../../domain/monitoring';
import type { Band, CountryId, RegionId, SignalKey, StoreRow, Zone } from '../../domain/monitoring';
import type { Action } from '../../state';
import { CapeIcon } from '../legacy/icons';
import { Drawer } from '../prod/Drawers';
import { EditData } from './EditData';
import { useBlueprint, useCharts, useMvp } from '../tier';
import { useLayoutPrefs } from './layout';
import type { EditBlock } from './layout';
import { useMobile } from '../v2/useMobile';
import { METRIC, countryValue, metricBand, storeValue } from '../../domain/metrics';
import type { Metric } from '../../domain/metrics';
import { IA_ROWS } from '../../board/iaData';
import './strings';
import { AttentionPanel } from './AttentionPanel';
import { FilterChips } from './FilterChips';
import type { FilterChip } from './FilterChips';
import { AiIcon } from './AiIcon';
import { Blueprint } from './Blueprint';
import { Bullet, Sparkline } from './Charts';
import type { Trend } from './Charts';
import { NewsBanner } from './NewsBanner';
import './monitoring.css';

const byId = (id: string) => STORES.find((s) => s.id === id)!;
const SYSTEM_FIRST = SYSTEM_ISSUE[0];
const REGIONS: RegionId[] = ['mena', 'latam', 'europe', 'apac'];
const pct = (v: number, d = 1) => `${v.toFixed(d)}%`;
const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 100))}%`;

const RationalesOn = createContext(true);
const POP_W = 300;

/** Soft grey "i": why this data point is here, why in this position, why shown this way.
 *  The popover is portalled and kept inside the viewport, so it never resizes or clips the layout. */
export function Info({ k }: { k: string }) {
  const { t, i18n } = useTranslation();
  const on = useContext(RationalesOn);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const btn = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left - 8, window.innerWidth - POP_W - 8));
    const below = r.bottom + 6;
    setPos(below + 380 > window.innerHeight ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: below });
  }, [open]);
  if (!on) return null;
  const metric = METRIC[k];
  const row = metric ? IA_ROWS.find((r) => r.metric === metric.ia) : undefined;
  const feas = row ? row.feas : (FEASIBILITY[k] ?? null);
  const [why, where, how] = row ? [`Critical when: ${row.critical}`, `Target cluster: ${row.persona}. Evidence: ${row.evidence}.`, `Expected action: ${row.action}`] : (t(`msm.r.${k}`, { returnObjects: true }) as string[]);
  return (
    <span className="msm-info" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <IconButton ref={btn} className="msm-info__btn" aria-label={t('msm.info.label')} aria-expanded={open} onClick={() => setOpen(!open)} onBlur={() => setOpen(false)}>
        <CapeIcon name="info" size={16} />
      </IconButton>
      {open &&
        createPortal(
          <span className="msm-info__pop" role="tooltip" dir={i18n.dir()} style={{ ...pos, width: POP_W }}>
            <b>{t('msm.info.why')}</b>
            <span>{why}</span>
            <b>{t('msm.info.where')}</b>
            <span>{where}</span>
            <b>{t('msm.info.how')}</b>
            <span>{how}</span>
            <b>{t('msm.info.src')}</b>
            <span>{row ? row.source : t(`msm.rs.${k}`)}</span>
            <b>{t('msm.info.feas')}</b>
            <span className={`msm-info__feas${feas == null ? ' msm-info__feas--unknown' : ''}`}>
              {feas == null ? t('msm.info.unknown') : `${feas}%`}
              <small>{t('msm.info.estimate')}</small>
            </span>
          </span>,
          document.querySelector('.cockpit--v2') ?? document.body,
        )}
    </span>
  );
}

const COLS: SignalKey[] = ['late', 'assign', 'unassigned', 'prep', 'pickers', 'instore', 'awt', 'pfr', 'fail', 'age'];

/** Critical: act now. At risk: off its usual level or target, act or check soon. On track: nothing to do. */
type Status = 'all' | 'critical' | 'risk' | 'ok';
const STATUSES: Status[] = ['all', 'critical', 'risk', 'ok'];
/** One colour language for status everywhere: chips, row bars, attention cards, tags. */
const STATUS_TONE: Record<Exclude<Status, 'all'>, 'error' | 'warning' | 'info' | 'success'> = { critical: 'error', risk: 'warning', ok: 'success' };
const STATUS_ICON: Record<Status, 'dashboard' | 'flag' | 'trending' | 'checkCircle'> = { all: 'dashboard', critical: 'flag', risk: 'trending', ok: 'checkCircle' };
const EXTRA_BASE = ['nsfr', 'basket', 'refunds', 'forecast'];
const MIN_COLS: SignalKey[] = ['assign', 'prep', 'awt', 'instore'];
const statusOf = (s: StoreRow): Exclude<Status, 'all'> => {
  const a = nextAction(s);
  return a === 'borrow' || a === 'riders' || a === 'escalate' || a === 'jira' ? 'critical' : a === 'staff' || a === 'watch' ? 'risk' : 'ok';
};

function useFmt() {
  const { t } = useTranslation();
  const min = (v: number) => t('msm.min', { v: v.toFixed(1) });
  const value = (s: StoreRow, k: SignalKey): string => {
    switch (k) {
      case 'late':
        return pct(s.late, 0);
      case 'assign':
        return min(s.assign);
      case 'unassigned':
        return String(s.unassigned);
      case 'prep':
        return min(prep(s));
      case 'pickers':
        return `${s.active}/${s.planned}`;
      case 'instore':
        return min(instore(s));
      case 'awt':
        return min(s.awt);
      case 'pfr':
        return pct(s.pfr);
      case 'fail':
        return pct(s.fail);
      case 'age':
        return t('msm.days', { n: s.age });
    }
  };
  return { t, min, value };
}

/** "18 stores live" pill, same pattern as the store view's "3 / 4 open" dropdown. */
function StoresLive({ stores, short }: { stores: StoreRow[]; short?: boolean }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDetailsElement>(null);
  const cities = [...new Set(stores.map((s) => s.zone))];
  return (
    <details ref={ref} className="pd-vendors msm-live-stores" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && ref.current?.removeAttribute('open')}>
      <summary className="pd-vendors__btn">
        {short ? t('msm.storesShort') : t('msm.storesLive', { n: stores.length })}
        <CapeIcon name="chevronDown" size={16} />
      </summary>
      <ul className="pd-vendors__list" aria-label={t('msm.storesLiveList')}>
        {cities.map((z) => (
          <li key={z}>
            <span>{t(`msm.zone.${z}`)}</span>
            <span className="pd-badge pd-badge--success">{stores.filter((s) => s.zone === z).length}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** One attention card per market alert or store needing action, tinted like the store view's Needs attention. */
type AttentionCard = { key: string; tone: 'error' | 'warning' | 'info' | 'success'; title: string; tag: string; meta: string; strong: string; drawerId?: string };

/** Area manager view across many stores, in the Cape store-view layout (72:1672). Cape Version only. */
export function Monitoring({ dispatch, rationales }: { dispatch: Dispatch<Action>; rationales: boolean }) {
  const { t, min, value } = useFmt();
  const unit = t('msm.min', { v: '' }).trim();
  const [region, setRegion] = useState<RegionId>('mena');
  const [country, setCountry] = useState<CountryId>('ae');
  const [zone, setZone] = useState<Zone | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());


  const market = COUNTRIES.find((c) => c.id === country)!;
  const inCountry = STORES.filter((s) => s.country === country);
  const scoped = inCountry.filter((s) => zone === 'all' || s.zone === zone).sort((a, b) => score(b) - score(a));
  const needle = q.trim().toLowerCase();
  const rows = (status === 'all' ? scoped : scoped.filter((s) => statusOf(s) === status)).filter((s) => !needle || `${s.name} ${s.id}`.toLowerCase().includes(needle));
  const C = aggregate(scoped);
  const layout = useLayoutPrefs();
  const cols = layout.get('table') as SignalKey[];
  const name = (id: string) => byId(id).name;
  const ctx = { store: name('st-07'), donor: name(DONOR), leader: LEADER, v: C.late.toFixed(1) };
  // The store level view is the Legacy one everywhere; App decides what renders for page 'overview'.
  const openStore = (id: string) => dispatch({ type: 'page', page: 'overview', warehouseId: id });
  const markDone = (id: string) => setDone(new Set(done).add(id));
  const count = (st: Status) => (st === 'all' ? scoped.length : scoped.filter((s) => statusOf(s) === st).length);
  const statusChips: FilterChip[] = STATUSES.map((st) => ({ key: st, tone: st === 'all' ? 'all' : STATUS_TONE[st], icon: STATUS_ICON[st], label: t(`msm.status.${st}`), count: count(st) }));

  // Market-wide alerts first (scenario alerts in the UAE, a computed one elsewhere), then every store needing action.
  const marketCards: AttentionCard[] =
    country === 'ae'
      ? ALERTS.filter((a) => a.stores.length !== 1 && (a.key !== 'system' || a.stores.some((id) => scoped.some((s) => s.id === id)))).map((a) => ({
          key: a.key,
          tone: a.key === 'system' && done.has(SYSTEM_FIRST) ? 'success' : a.tone,
          title: t(`msm.alert.${a.key}.title`, ctx),
          tag: a.key === 'promo' ? 'Promo' : a.key === 'system' ? t('msm.act.jira') : t('msm.k.late'),
          meta: t(`msm.alert.${a.key}.cause`, ctx),
          strong: t('msm.ago', { n: a.minutesAgo }),
          drawerId: a.key === 'system' ? SYSTEM_FIRST : undefined,
        }))
      : band(C.late, TARGET.late) === 'high'
        ? [{ key: 'countryGen', tone: 'error', title: t('msm.alert.countryGen.title', ctx), tag: t('msm.k.late'), meta: t('msm.alert.countryGen.cause'), strong: t('msm.ago', { n: 5 }) }]
        : [];
  const storeCards: AttentionCard[] = scoped
    .filter((s) => statusOf(s) === 'critical' || statusOf(s) === 'risk')
    .map((s) => {
      const a = nextAction(s);
      const reds = COLS.filter((k) => k !== 'age' && cell(s, k) === 'high').slice(0, 3);
      return {
        key: s.id,
        drawerId: s.id,
        tone: done.has(s.id) ? 'success' : STATUS_TONE[statusOf(s)],
        title: s.name,
        tag: done.has(s.id) ? t('msm.done') : t(`msm.act.${a}`),
        meta: (reds.length ? reds : COLS.filter((k) => cell(s, k) === 'mild').slice(0, 2)).map((k) => `${t(`msm.k.${k}`)} ${value(s, k)}`).join(' · '),
        strong: s.age ? t('msm.daysLong', { n: s.age }) : t('msm.today'),
      };
    });
  const attention = [...marketCards, ...storeCards];

  const labelOf = (k: string) => (EXTRA_BASE.includes(k) ? t(`msm.sec.${k}`) : t(`msm.k.${k}`, { defaultValue: METRIC[k]?.label ?? k }));
  const fmtM = (x: Metric, v: number) => (x.unit === 'pct' ? `${v.toFixed(v < 3 ? 2 : 1)}%` : x.unit === 'min' ? min(v) : x.unit === 'sec' ? `${v.toFixed(1)}s` : x.unit === 'count' ? String(Math.round(v)) : v.toFixed(v < 10 ? 1 : 0));
  let sparkNow = false;
  const tile = (k: string, v: string, b: Band | 'neutral', target?: string) => (
    <div className={`v2-stat msm-tile msm-tile--${b}`} key={k}>
      <div className="msm-tile__row">
        <div className="msm-tile__text">
          <span className="v2-stat__value">{v}</span>
          <span className="v2-stat__label msm-tile__label">
            {labelOf(k)} <Info k={EXTRA_BASE.includes(k) ? 'secondary' : k} />
          </span>
          {!mvp && (
            <span className="msm-tile__foot">
              {b !== 'neutral' && t(`msm.band.${b}`)}
              {target && ` · ${t('msm.target', { v: target })}`}
            </span>
          )}
        </div>
        {charts && sparkNow && <Sparkline seed={k} trend={(b === 'high' ? 'up' : b === 'mild' ? 'up' : b === 'exceeds' ? 'down' : 'flat') as Trend} tone={b === 'high' ? 'up' : b === 'mild' ? 'mild' : 'calm'} />}
      </div>
    </div>
  );

  const tileFor = (k: string, spark = false) => {
    sparkNow = spark;
    switch (k) {
      case 'late':
        return tile('late', pct(C.late), band(C.late, TARGET.late), pct(TARGET.late, 0));
      case 'assign':
        return tile('assign', min(C.assign), band(C.assign, TARGET.assign), min(TARGET.assign));
      case 'unassigned':
        return tile('unassigned', String(C.unassigned), band(C.unassigned, Math.max(1, scoped.length) * TARGET.unassigned));
      case 'pickers':
        return tile('pickers', `${C.active}/${C.planned}`, C.active / Math.max(1, C.planned) < 0.9 ? 'mild' : 'meets');
      case 'prep':
        return tile('prep', min(C.prep), band(C.prep, TARGET.instore * 0.75));
      case 'instore':
        return tile('instore', min(C.instore), band(C.instore, TARGET.instore), min(TARGET.instore));
      case 'awt':
        return tile('awt', min(C.awt), band(C.awt, TARGET.awt), min(TARGET.awt));
      case 'pfr':
        return tile('pfr', pct(C.pfr), band(C.pfr, TARGET.pfr), pct(TARGET.pfr, 0));
      case 'fail':
        return tile('fail', pct(C.fail), band(C.fail, TARGET.fail), pct(TARGET.fail, 0));
      case 'nsfr': {
        // Country nSFR is the order-weighted average of its stores, so it matches the Stores table.
        const nsfr = countryValue(METRIC.nsfr, scoped);
        return tile('nsfr', `${nsfr.toFixed(1)}%`, nsfr >= 95 ? 'meets' : 'mild', pct(95, 0));
      }
      case 'basket':
        return tile('basket', `${market.currency} ${market.basket.toLocaleString('en-US', { maximumFractionDigits: market.basket >= 1000 ? 0 : 2 })}`, 'neutral');
      case 'refunds':
        return tile('refunds', pct(SECONDARY.refunds), band(SECONDARY.refunds, 1.5), pct(1.5));
      case 'forecast':
        return tile('forecast', `+${SECONDARY.vsForecast}%`, 'neutral');
      default: {
        const x = METRIC[k];
        const v = countryValue(x, scoped);
        return tile(k, fmtM(x, v), metricBand(x, v), fmtM(x, x.target));
      }
    }
  };
  const sigLabel = labelOf;
  const sigHint = (k: string) => (METRIC[k] ? IA_ROWS.find((r) => r.metric === METRIC[k].ia)?.desc : Array.isArray(t(`msm.r.${k}`, { returnObjects: true })) ? (t(`msm.r.${k}`, { returnObjects: true }) as string[])[0] : undefined);
  const mvp = useMvp();
  const charts = useCharts();
  const blueprint = useBlueprint();
  const edit = (block: EditBlock, title: string) => mvp ? null : (
    <EditData block={block} title={title} selected={layout.get(block)} onChange={(keys) => layout.set(block, keys)} label={sigLabel} hint={sigHint} available={(k) => k !== 'forecast' || country === 'ae'} />
  );
  const mobile = useMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<'list' | 'cards'>('list');
  const wrapRef = useRef<HTMLDivElement>(null);
  // Filtering shortens the list; hold the table's height so the page does not shrink and throw the scroll back up.
  const [holdH, setHoldH] = useState(0);
  const hold = () => setHoldH((h) => Math.max(h, wrapRef.current?.offsetHeight ?? 0));
  useEffect(() => setHoldH(0), [country, zone, region]);
  // The sticky table header sits exactly under the chips row: measure it instead of guessing its height.
  useLayoutEffect(() => {
    const el = mobile ? statusRef.current : headRef.current;
    const card = el?.parentElement;
    if (!el || !card) return;
    const set = () => card.style.setProperty('--msm-chips-h', `${el.getBoundingClientRect().height}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobile]);

  if (blueprint) return <Blueprint />;

  return (
    <RationalesOn.Provider value={rationales}>
      <div className="msm">
        <header className="v2-page-header">
          <h1 className="v2-page-header__title">{t('msm.title')}</h1>
          <div className="v2-page-header__actions">
            <StoresLive stores={scoped} short={mobile} />
            <Button variant="secondary" status="inverse" size="medium" className="v2-pill v2-help" startIcon={<img src={helpCircle} alt="" />}>
              {t('v2.help')}
            </Button>
            {!mvp && <Button variant="secondary" status="inverse" size="medium" className={`v2-pill v2-pill--icon${filtersOpen ? ' is-on' : ''}`} aria-label={t('msm.filters')} aria-pressed={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} startIcon={<CapeIcon name="filter" size={24} />} />}
            {!mobile && <Button variant="secondary" status="inverse" size="medium" className="v2-pill v2-pill--icon" aria-label={t('v2.notifications')} startIcon={<img src={notifications} alt="" />} />}
            <Avatar size="large" initials="A" className="v2-avatar" />
          </div>
        </header>

        {filtersOpen && !mvp && (
        <div className="msm-scope" role="group" aria-label={t('msm.scope.region')}>
          <Select
            className="msm-scope__select"
            wrapperClassName="msm-scope__sel"
            aria-label={t('msm.scope.region')}
            value={region}
            onChange={(v) => {
              setRegion(v as RegionId);
              setCountry(COUNTRIES.find((c) => c.region === v)!.id);
              setZone('all');
              setStatus('all');
            }}
            options={REGIONS.map((rg) => ({ value: rg, label: `${t('msm.scope.region')}: ${t(`msm.region.${rg}`)}` }))}
          />
          <Select
            className="msm-scope__select"
            wrapperClassName="msm-scope__sel"
            aria-label={t('msm.scope.country')}
            value={country}
            onChange={(v) => {
              setCountry(v as CountryId);
              setZone('all');
            }}
            options={COUNTRIES.filter((c) => c.region === region).map((c) => ({ value: c.id, label: `${t('msm.scope.country')}: ${t(`msm.country.${c.id}`)}` }))}
          />
          <Select
            className="msm-scope__select"
            wrapperClassName="msm-scope__sel"
            aria-label={t('msm.scope.zone')}
            value={zone}
            onChange={(v) => {
              setZone(v as Zone | 'all');
            }}
            options={[{ value: 'all', label: `${t('msm.scope.zone')}: ${t('msm.scope.all')}` }, ...market.zones.map((z) => ({ value: z, label: `${t('msm.scope.zone')}: ${t(`msm.zone.${z}`)}` }))]}
          />
          <Info k="scope" />
        </div>
        )}

        {!mvp && <NewsBanner />}

        <div className={`msm-layout${mvp ? ' msm-layout--solo' : ''}`}>
          <div className="msm-main">
            <section className="msm-card msm-strip">
              <div className="v2-section-header msm-head">
                <h2 className="v2-section-header__title">
                  {t('msm.liveNow')} <span className="msm-liveDot"><Indicator status="success" size="small" /></span> <Info k="kpis" />
                </h2>
                <span className="v2-section-header__note">{t('msm.liveNote', { every: '\u0000' }).split('\u0000').flatMap((x, i, arr) => (i < arr.length - 1 ? [x, <b key={i} className="msm-every">{t('msm.liveEvery')}</b>] : [x]))}</span>
                {edit('live', t('msm.liveNow'))}
              </div>
              <div className="v2-stats">{layout.get('live').map((k) => tileFor(k, true))}</div>
            </section>

            <section className="msm-card">
              <div className="v2-section-header msm-head">
                <h2 className="v2-section-header__title">
                  {t('msm.countryPerf')} <Info k="instore" />
                </h2>
                <span className="v2-section-header__note">{t('msm.lastHour')} · {t('msm.weighted', { n: C.orders })}</span>
                {edit('perf', t('msm.countryPerf'))}
              </div>
              <div className="msm-grid">{layout.get('perf').filter((k) => k !== 'forecast' || country === 'ae').map((k) => tileFor(k))}</div>
            </section>

            <section className="msm-card">
              <div className="v2-section-header msm-head" ref={headRef}>
                <h2 className="v2-section-header__title">
                  {t('msm.ranking')} <Info k="ranking" />
                </h2>
                <span className="v2-section-header__note">{t('msm.storesN', { n: count('all') })}</span>
                {!mobile && (
                  <>
                    <label className="msm-searchbox msm-head__search">
                      <CapeIcon name="search" size={16} />
                      <input type="search" className="msm-search" value={q} onChange={(e) => (hold(), setQ(e.target.value))} placeholder={t('msm.searchStores')} aria-label={t('msm.searchStores')} />
                    </label>
                    {!mvp && (
                    <div className="msm-head__filters">
                      <FilterChips chips={statusChips} value={status} onChange={(k) => (hold(), setStatus(k as Status))} label={t('msm.col.action')} />
                    </div>
                    )}
                  </>
                )}
                {edit('table', t('msm.ranking'))}
                {!mobile && (
                  <span className="msm-viewtoggle" role="group" aria-label={t('msm.ranking')}>
                    <IconButton className="msm-edit" data-tip={t('msm.viewList')} aria-label={t('msm.viewList')} aria-pressed={view === 'list'} onClick={() => (hold(), setView('list'))}>
                      <CapeIcon name="list" size={20} />
                    </IconButton>
                    <IconButton className="msm-edit" data-tip={t('msm.viewCards')} aria-label={t('msm.viewCards')} aria-pressed={view === 'cards'} onClick={() => (hold(), setView('cards'))}>
                      <CapeIcon name="layoutBlock" size={20} />
                    </IconButton>
                  </span>
                )}
              </div>
              {mobile && (
              <div className="msm-status" ref={statusRef}>
                {mobile && !searchOpen && !mvp && <FilterChips chips={statusChips} value={status} onChange={(k) => (hold(), setStatus(k as Status))} label={t('msm.col.action')} />}
                {mobile && !searchOpen ? (
                  <IconButton className="msm-search-btn" aria-label={t('msm.searchStores')} title={t('msm.searchStores')} onClick={() => setSearchOpen(true)}>
                    <CapeIcon name="search" size={20} />
                  </IconButton>
                ) : (
                  <label className="msm-searchbox">
                    <CapeIcon name="search" size={16} />
                    <input type="search" className="msm-search" autoFocus={mobile} value={q} onChange={(e) => (hold(), setQ(e.target.value))} placeholder={t('msm.searchStores')} aria-label={t('msm.searchStores')} />
                    {mobile && (
                      <IconButton className="msm-search-close" aria-label={t('msm.drawer.close')} onClick={() => (setQ(''), setSearchOpen(false))}>
                        <CapeIcon name="close" size={16} />
                      </IconButton>
                    )}
                  </label>
                )}
              </div>
              )}
              <div className="msm-table-wrap pd-table-scroll" data-view={view} ref={wrapRef} style={holdH ? { minHeight: holdH } : undefined}>
                <table className="msm-table">
                  <thead>
                    <tr>
                      <th>
                        <span className="msm-th">
                          {t('msm.col.store')} · {t('msm.col.deviation')} <Info k="deviation" /> <Info k="age" />
                        </span>
                      </th>
                      {cols.map((k) => (
                        <th key={k}>
                          <span className="msm-th">
                            {labelOf(k)}
                            {(MIN_COLS.includes(k) || METRIC[k]?.unit === 'min') && ` (${unit})`} <Info k={k} />
                          </span>
                        </th>
                      ))}
                      {!mvp && (
                        <th>
                          <span className="msm-th">
                            {t('msm.col.action')} <Info k="action" />
                          </span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => {
                      const a = nextAction(s);
                      const d = deviation(s);
                      return (
                        <tr
                          key={s.id}
                          className={`msm-row msm-row--${STATUS_TONE[statusOf(s)]}`}
                          tabIndex={0}
                          onClick={() => openStore(s.id)}
                          onKeyDown={(e) => e.key === 'Enter' && openStore(s.id)}
                        >
                          <td>
                            <span className="msm-store">
                              <span className="msm-store__name">
                                <span className={`msm-dot-status msm-dot-status--${STATUS_TONE[statusOf(s)]}`} title={t(`msm.status.${statusOf(s)}`)} />
                                <b>{s.name}</b>
                                {s.age > 0 && (
                                  <Tag size="small" status={cell(s, 'age') === 'high' ? 'error' : cell(s, 'age') === 'mild' ? 'warning' : 'neutral'} title={t('msm.daysLong', { n: s.age })}>
                                    {value(s, 'age')}
                                  </Tag>
                                )}
                              </span>
                              <span>
                                {t(`msm.zone.${s.zone}`)}
                              </span>
                              {!mvp && (
                              <span className={`msm-dev msm-dev--${d.tone}`} title={t('msm.vsCountry', { v: signed(d.country) })}>
                                {t('msm.vsUsualSig', { v: signed(d.usual), signal: t(`msm.sig.${d.signal}`) })}
                              </span>
                              )}
                            </span>
                          </td>
                          {cols.map((k, ci) => {
                            const wide = ci === cols.length - 1 && cols.length % 2 === 1 ? ' msm-cell--wide' : '';
                            if (METRIC[k]) {
                              const x = METRIC[k];
                              const v = storeValue(x, s);
                              return (
                                <td key={k} data-label={labelOf(k)} className={`msm-cell msm-cell--${metricBand(x, v)}${wide}`}>
                                  {x.unit === 'min' ? v.toFixed(1) : fmtM(x, v)}
                                </td>
                              );
                            }
                            const c = cell(s, k);
                            return (
                              <td key={k} data-label={labelOf(k)} className={`msm-cell msm-cell--${k === 'pickers' && cell(s, 'unassigned') === 'high' ? 'high' : c}${wide}`}>
                                {k === 'age' ? (
                                  <Tag size="small" status={c === 'high' ? 'error' : c === 'mild' ? 'warning' : 'neutral'} title={t('msm.daysLong', { n: s.age })}>
                                    {value(s, k)}
                                  </Tag>
                                ) : MIN_COLS.includes(k) ? (
                                  (k === 'assign' ? s.assign : k === 'prep' ? prep(s) : k === 'instore' ? instore(s) : s.awt).toFixed(1)
                                ) : k === 'pickers' ? (
                                  <span className="msm-two">
                                    {value(s, k)}
                                    <small className={`msm-cell--${cell(s, 'unassigned')}`}>
                                      {t('msm.waiting', { n: s.unassigned })}
                                    </small>
                                  </span>
                                ) : (
                                  value(s, k)
                                )}
                                {charts && (k === 'late' || k === 'assign' || k === 'awt') && <Bullet value={k === 'late' ? s.late : k === 'assign' ? s.assign : s.awt} target={TARGET[k]} />}
                              </td>
                            );
                          })}
                          {!mvp && (
                            <td className="msm-cell-action">
                              {done.has(s.id) ? (
                                <span className="msm-act msm-act--done" title={t('msm.done')}>
                                  <CapeIcon name="checkCircle" size={18} />
                                </span>
                              ) : (
                                <Button
                                  size="small"
                                  variant="secondary"
                                  status={mobile ? 'branded' : 'inverse'}
                                  className="msm-solve"
                                  title={a === 'none' ? t('msm.review') : t(`msm.act.${a}`)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenId(s.id);
                                  }}
                                >
                                  {statusOf(s) === 'ok' ? t('msm.review') : t('msm.solve')}
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={cols.length + 2} className="msm-empty">
                          {t('msm.noStores')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {!mvp && (
          <AttentionPanel
            title={t('msm.attention')}
            titleAddon={<Info k="alerts" />}
            note={t('msm.alertsNote', { n: ESCALATE_DAY })}
            empty={t('msm.noAttention')}
            items={attention.map((c) => ({ ...c, onClick: c.drawerId ? () => setOpenId(c.drawerId!) : undefined }))}
          />
          )}
        </div>

        {openId && <StoreDrawer s={byId(openId)} done={done.has(openId)} onDone={() => markDone(openId)} onClose={() => setOpenId(null)} onOpenStore={() => openStore(openId)} />}
      </div>
    </RationalesOn.Provider>
  );
}

function StoreDrawer({ s, done, onDone, onClose, onOpenStore }: { s: StoreRow; done: boolean; onDone: () => void; onClose: () => void; onOpenStore: () => void }) {
  const { t, min } = useFmt();
  const mobile = useMobile();
  const mvp = useMvp();
  const a = nextAction(s);
  const vars = { donor: byId(DONOR).name, leader: LEADER, store: s.name, n: s.age, v: s.awt.toFixed(0) };
  void min;
  return (
    <Drawer
      title={s.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" status="inverse" onClick={onClose}>
            {t('msm.drawer.close')}
          </Button>
          <Button variant="secondary" status="inverse" onClick={onOpenStore}>
            {t('msm.openStore')}
          </Button>
          {!mvp && t(`msm.do.${a}`, vars) &&
            (done ? (
              <Tag status="success">{t('msm.done')}</Tag>
            ) : (
              <Button variant="primary" onClick={onDone}>
                {mobile ? t(`msm.doShort.${a}`) : t(`msm.do.${a}`, vars)}
              </Button>
            ))}
        </>
      }
    >
      <div className="msm-drawer__tags">
        <Tag size="small" status="neutral">
          {t(`msm.zone.${s.zone}`)}
        </Tag>
        {s.age >= ESCALATE_DAY && (
          <Tag size="small" status="error">
            {t('msm.escalated')} · {t('msm.daysLong', { n: s.age })}
          </Tag>
        )}
        <Info k="drill" />
      </div>

      {a === 'watch' || a === 'none' ? (
        <section className="msm-suggest msm-suggest--ok">
          <h3>{t('msm.drawer.contactStore')}</h3>
          <p>{t('msm.drawer.noAction')}</p>
          <div className="msm-suggest__contact">
            <span>
              <b>{t('msm.drawer.storePhone')}</b>
            </span>
          </div>
        </section>
      ) : (
      <section className={`msm-suggest msm-suggest--${done ? 'success' : STATUS_TONE[statusOf(s)]}`}>
        <h3>
          {t('msm.drawer.suggested')}
          <Tag size="small" status="neutral">
            Our playbook
          </Tag>
        </h3>
        <p>{t(`msm.actLong.${a}`, vars)}</p>
        <div className="msm-suggest__contact">
          <span>
            {t('msm.drawer.contact')}: <b>{t(`msm.contact.${a}`, vars)}</b>
          </span>
          <Button size="small" variant="secondary" status="inverse">
            {t('msm.drawer.call')}
          </Button>
        </div>
      </section>
      )}

      <section className="msm-suggest msm-suggest--ai">
        <h3>
          <AiIcon size={18} className="msm-ai-icon" />
          AI agent analysis
          <Tag size="small" status="branded">
            AI
          </Tag>
        </h3>
        <p>
          {`Late orders are ${pct(s.late, 0)} against a usual ${pct(s.usualLate, 0)}, with ${s.unassigned} ${s.unassigned === 1 ? 'order' : 'orders'} still waiting for a picker. In 3 similar peaks over the last 4 weeks, assignment time came back under target within 30 minutes after the store added 2 pickers.`}
        </p>
        <div className="msm-suggest__contact">
          <span>
            Confidence: <b>Medium</b> · based on this store's last 4 weeks
          </span>
        </div>
      </section>

      <section className="msm-dsec">
        <div className="v2-section-header msm-head">
          <h3 className="v2-section-header__title">{t('msm.liveNow')}</h3>
        </div>
        <div className="v2-stats">
            <div className="v2-stat">
              <span className={`v2-stat__value${cell(s, 'unassigned') === 'high' ? ' v2-stat__value--danger' : ''}`}>{s.unassigned}</span>
              <span className="v2-stat__label">{t('msm.k.unassigned')}</span>
            </div>
            <div className="v2-stat">
              <span className={`v2-stat__value${cell(s, 'late') === 'high' ? ' v2-stat__value--danger' : ''}`}>{pct(s.late, 0)}</span>
              <span className="v2-stat__label">{t('msm.k.late')}</span>
            </div>
          {s.idle > 0 && (
            <div className="v2-idle">
              <b>{s.idle}</b>
              <span>{t('msm.drawer.idle', { n: '' }).trim()}</span>
            </div>
          )}
        </div>
      </section>

      <section className="msm-dsec">
        <div className="v2-section-header msm-head">
          <h3 className="v2-section-header__title">{t('msm.drawer.pickers')}</h3>
          <span className="v2-section-header__note">{t('msm.drawer.pickersLine', { a: s.active, p: s.planned })}</span>
        </div>
        <div className="pd-progress" role="img" aria-label={t('msm.drawer.pickersLine', { a: s.active, p: s.planned })}>
          <span style={{ width: `${Math.min(1, coverage(s)) * 100}%` }} />
        </div>
        <ul className="pd-legend">
          <li>
            <span className="pd-dot pd-dot--picking" />
            {s.active} {t('msm.k.pickers').split('/')[0].trim()}
          </li>
          {s.planned > s.active && (
            <li>
              <span className="pd-dot pd-dot--idle" />
              {s.planned - s.active} {t('msm.drawer.missing')}
            </li>
          )}
        </ul>
      </section>

      <section className="msm-dsec">
        <div className="v2-section-header msm-head">
          <h3 className="v2-section-header__title">{t('msm.drawer.stages')}</h3>
          <span className="v2-section-header__note">
            {t('msm.k.prep')} {min(prep(s))} · {t('msm.drawer.estPickup', { v: s.estPickup })}
          </span>
        </div>
        <div className="v2-kpis">
            <div className="v2-stat">
              <span className={`v2-stat__value${cell(s, 'assign') === 'high' ? ' v2-stat__value--danger' : ''}`}>{min(s.assign)}</span>
              <span className="v2-stat__label">{t('msm.drawer.stage.assign')}</span>
            </div>
            <div className="v2-stat">
              <span className={`v2-stat__value${false ? ' v2-stat__value--danger' : ''}`}>{min(s.pick)}</span>
              <span className="v2-stat__label">{t('msm.drawer.stage.pick')}</span>
            </div>
            <div className="v2-stat">
              <span className={`v2-stat__value${false ? ' v2-stat__value--danger' : ''}`}>{min(s.pack)}</span>
              <span className="v2-stat__label">{t('msm.drawer.stage.pack')}</span>
            </div>
            <div className="v2-stat">
              <span className={`v2-stat__value${cell(s, 'awt') === 'high' ? ' v2-stat__value--danger' : ''}`}>{min(s.awt)}</span>
              <span className="v2-stat__label">{t('msm.drawer.stage.dispatch')}</span>
            </div>
            <div className="v2-stat">
              <span className={`v2-stat__value${cell(s, 'pfr') === 'high' ? ' v2-stat__value--danger' : ''}`}>{pct(s.pfr)}</span>
              <span className="v2-stat__label">{t('msm.k.pfr')}</span>
            </div>
            <div className="v2-stat">
              <span className={`v2-stat__value${cell(s, 'fail') === 'high' ? ' v2-stat__value--danger' : ''}`}>{pct(s.fail)}</span>
              <span className="v2-stat__label">{t('msm.k.fail')}</span>
            </div>
        </div>
      </section>
    </Drawer>
  );
}
