import type { Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../cape/Card';
import { Select } from '../cape/Select';
import { Tag } from '../cape/Tag';
import { fetchOrderTiming, fetchPickerTeam, fetchShiftMetrics } from '../domain/mockApi';
import { formatPercent, formatSeconds } from '../domain/format';
import type { FloorSnapshot, PickerTeamRow } from '../domain/types';
import type { Action, State, TeamSortKey, TimingRange } from '../state';
import { BoxState } from './BoxState';
import { TimingChart } from './TimingChart';
import type { Loaded } from './useMock';
import { useMock } from './useMock';

const RANGES: TimingRange[] = ['1h', '6h', '12h', '24h'];
const RANGE_HOURS: Record<TimingRange, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 };
const COLUMNS: TeamSortKey[] = ['prep', 'avgAssignmentSeconds', 'avgPickingSeconds', 'avgPackingSeconds', 'pfr', 'failRate', 'ordersCount'];

const prepSeconds = (r: PickerTeamRow) => r.avgAssignmentSeconds + r.avgPickingSeconds + r.avgPackingSeconds;
const valueOf = (r: PickerTeamRow, key: TeamSortKey) => (key === 'prep' ? prepSeconds(r) : r[key]);
// Zero reads quiet; up to 4% is a warning, above that it is a problem.
const failTone = (rate: number) => (rate === 0 ? 'zero' : rate >= 0.04 ? 'high' : 'mid');

function cell(r: PickerTeamRow, key: TeamSortKey) {
  if (key === 'prep') return formatSeconds(prepSeconds(r));
  if (key === 'pfr' || key === 'failRate') return formatPercent(r[key]);
  if (key === 'ordersCount') return String(r.ordersCount);
  return formatSeconds(r[key]);
}

function Metrics({ s }: { s: State }) {
  const { t } = useTranslation();
  const metrics = useMock(fetchShiftMetrics, s.scenario);
  return (
    <Card variant="outlined" className="board-card metrics-card">
      <BoxState state={metrics} lines={6}>
        {(m) => (
          <>
            <div>
              <div className="metrics-card__label">{t('shift.successfulOrders')}</div>
              <div className="metrics-card__hero">
                <span className="metrics-card__hero-value">{m.successfulOrders}</span>
                <span className="metrics-card__hero-detail">{t('shift.failRate', { rate: formatPercent(m.issueRate) })}</span>
              </div>
            </div>
            <hr className="divider" />
            <dl className="metrics-card__list">
              <div className="metrics-card__row">
                <dt>{t('shift.avgPrep')}</dt>
                <dd className="metrics-card__big">{formatSeconds(m.avgAssignmentSeconds + m.avgPickingSeconds + m.avgPackingSeconds)}</dd>
              </div>
              <div className="metrics-card__row metrics-card__row--sub">
                <dt>{t('shift.assignment')}</dt>
                <dd>{formatSeconds(m.avgAssignmentSeconds)}</dd>
              </div>
              <div className="metrics-card__row metrics-card__row--sub">
                <dt>{t('shift.picking')}</dt>
                <dd>{formatSeconds(m.avgPickingSeconds)}</dd>
              </div>
              <div className="metrics-card__row metrics-card__row--sub">
                <dt>{t('shift.packing')}</dt>
                <dd>{formatSeconds(m.avgPackingSeconds)}</dd>
              </div>
              <hr className="divider" />
              <div className="metrics-card__row">
                <dt>{t('shift.pfr')}</dt>
                <dd className="metrics-card__big">{formatPercent(m.pfr)}</dd>
              </div>
            </dl>
          </>
        )}
      </BoxState>
    </Card>
  );
}

function Timing({ s }: { s: State }) {
  const { t } = useTranslation();
  const timing = useMock(fetchOrderTiming, s.scenario);
  return (
    <Card variant="outlined" className="board-card timing-card">
      <div className="board-card__head">
        <h3 className="board-card__title">{t('shift.chartTitle')}</h3>
        <ul className="legend">
          <li><span className="legend__swatch legend__swatch--assign" />{t('shift.assignment')}</li>
          <li><span className="legend__swatch legend__swatch--pick" />{t('shift.picking')}</li>
          <li><span className="legend__swatch legend__swatch--pack" />{t('shift.packing')}</li>
          <li><span className="legend__swatch legend__swatch--line" />{t('shift.completed')}</li>
        </ul>
      </div>
      <BoxState state={timing} lines={6}>
        {(buckets) => <TimingChart buckets={buckets.slice(-RANGE_HOURS[s.range])} />}
      </BoxState>
    </Card>
  );
}

function PickerTeam({ s, dispatch, floor }: { s: State; dispatch: Dispatch<Action>; floor: Loaded<FloorSnapshot> }) {
  const { t } = useTranslation();
  const team = useMock(fetchPickerTeam, s.scenario);
  const status = new Map(floor.status === 'ready' ? floor.data.pickers.map((p) => [p.pickerId, p.status]) : []);

  return (
    <Card variant="outlined" className="board-card">
      <BoxState state={team} lines={8}>
        {(rows) => {
          const { key, dir } = s.sort;
          const sorted = [...rows].sort((a, b) => (dir === 'desc' ? valueOf(b, key) - valueOf(a, key) : valueOf(a, key) - valueOf(b, key)));
          return (
            <>
              <div className="board-card__head">
                <h3 className="board-card__title">
                  {t('team.title')} <span className="board-card__count">{rows.length}</span>
                </h3>
                <span className="board-card__note">{t('team.nonZero', { count: rows.filter((r) => r.failRate > 0).length })}</span>
              </div>
              <div className="table-scroll">
                <table className="cp-table team-table">
                  <thead>
                    <tr>
                      <th>{t('team.columns.picker')}</th>
                      {COLUMNS.map((c) => {
                        const on = c === key;
                        const label = t(`team.columns.${c}`);
                        return (
                          <th key={c} className="num" aria-sort={on ? (dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
                            <button type="button" className={`sort-header${on ? ' sort-header--on' : ''}`} aria-label={t('team.sortBy', { column: label })} onClick={() => dispatch({ type: 'sort', key: c })}>
                              {on && (
                                <span className="sort-header__arrow" aria-hidden>
                                  {dir === 'desc' ? '↓' : '↑'}
                                </span>
                              )}
                              {label}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => {
                      const st = status.get(r.pickerId);
                      return (
                        <tr key={r.pickerId}>
                          <td>
                            <span className="team-table__picker">
                              <span className="team-table__name">{r.displayName}</span>
                              {(st === 'picking' || st === 'packing') && (
                                <Tag status="success" size="small">
                                  {t(`now.stage.${st}`)}
                                </Tag>
                              )}
                            </span>
                          </td>
                          {COLUMNS.map((c) => (
                            <td key={c} className={`num team-table__${c === 'prep' ? 'prep' : c === 'failRate' ? `fail team-table__fail--${failTone(r.failRate)}` : c === 'pfr' ? 'pfr' : 'muted'}`}>
                              {cell(r, c)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        }}
      </BoxState>
    </Card>
  );
}

/** Everything below the now bar is the shift, on a tinted board. */
export function ShiftBoard({ s, dispatch, floor }: { s: State; dispatch: Dispatch<Action>; floor: Loaded<FloorSnapshot> }) {
  const { t } = useTranslation();
  return (
    <section className="shift-board" aria-labelledby="shift-board-title">
      <div className="shift-board__head">
        <h2 id="shift-board-title" className="shift-board__title">
          {t('shift.title')}
        </h2>
        <Select
          className="shift-board__range"
          aria-label={t('shift.timeWindow')}
          value={s.range}
          onChange={(v) => dispatch({ type: 'range', range: v as TimingRange })}
          options={RANGES.map((r) => ({ value: r, label: t(`shift.range.${r}`) }))}
        />
      </div>
      <div className="shift-board__top">
        <Metrics s={s} />
        <Timing s={s} />
      </div>
      <PickerTeam s={s} dispatch={dispatch} floor={floor} />
    </section>
  );
}
