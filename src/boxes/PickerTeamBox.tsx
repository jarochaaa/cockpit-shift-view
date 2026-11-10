import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../cape/Avatar';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { BoxState } from '../cockpit/BoxState';
import { useMock } from '../cockpit/useMock';
import { fetchPickerTeam } from '../domain/mockApi';
import { formatPercent, formatSeconds } from '../domain/format';
import type { PickerTeamRow, Scenario } from '../domain/types';
import type { SortDir, TeamSortKey } from '../state';

function failRateStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate === 0) return 'success';
  if (rate <= 0.02) return 'warning';
  return 'error';
}

const prepSeconds = (r: PickerTeamRow) => r.avgAssignmentSeconds + r.avgPickingSeconds + r.avgPackingSeconds;
const valueOf = (r: PickerTeamRow, key: TeamSortKey) => (key === 'prep' ? prepSeconds(r) : r[key]);

interface Props {
  scenario: Scenario;
  sort: { key: TeamSortKey; dir: SortDir };
  onSort: (key: TeamSortKey) => void;
}

// Every column sorts (critique item 4); the same column again flips the direction.
export function PickerTeamBox({ scenario, sort, onSort }: Props) {
  const { t } = useTranslation();
  const team = useMock(fetchPickerTeam, scenario);

  return (
    <BoxState state={team} lines={6}>
      {(rows) => {
        const total = rows.reduce((n, r) => n + r.ordersCount, 0);
        const sorted = [...rows].sort((a, b) => (sort.dir === 'desc' ? valueOf(b, sort.key) - valueOf(a, sort.key) : valueOf(a, sort.key) - valueOf(b, sort.key)));
        const columns: { key: TeamSortKey; label: string; render: (r: PickerTeamRow) => ReactNode }[] = [
          { key: 'prep', label: t('pickerTeam.columns.prep'), render: (r) => formatSeconds(prepSeconds(r)) },
          { key: 'avgAssignmentSeconds', label: t('stage.assignedIn'), render: (r) => formatSeconds(r.avgAssignmentSeconds) },
          { key: 'avgPickingSeconds', label: t('stage.pickedIn'), render: (r) => formatSeconds(r.avgPickingSeconds) },
          { key: 'avgPackingSeconds', label: t('stage.packedIn'), render: (r) => formatSeconds(r.avgPackingSeconds) },
          { key: 'pfr', label: t('pickerTeam.columns.pfr'), render: (r) => formatPercent(r.pfr) },
          {
            key: 'failRate',
            label: t('pickerTeam.columns.failRate'),
            render: (r) => (
              <Tag status={failRateStatus(r.failRate)} size="small">
                {formatPercent(r.failRate)}
              </Tag>
            ),
          },
          { key: 'ordersCount', label: t('pickerTeam.columns.orders'), render: (r) => t('pickerTeam.ordersShare', { count: r.ordersCount, share: Math.round((r.ordersCount / total) * 100) }) },
        ];
        const active = columns.find((c) => c.key === sort.key)!;
        const above = rows.filter((r) => r.failRate > 0.02).length;
        return (
          <div>
            <Typography variant="caption" className="picker-team__caption">
              {t(sort.dir === 'desc' ? 'pickerTeam.sortedDesc' : 'pickerTeam.sortedAsc', { column: active.label })} · {t('pickerTeam.aboveThreshold', { count: above })}
            </Typography>
            <div className="table-scroll">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>{t('pickerTeam.columns.picker')}</th>
                    {columns.map((col) => {
                      const on = col.key === sort.key;
                      return (
                        <th key={col.key} aria-sort={on ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
                          <button type="button" className={`sort-header${on ? ' sort-header--on' : ''}`} onClick={() => onSort(col.key)} onPointerDown={(e) => e.stopPropagation()}>
                            {col.label}
                            <span className="sort-header__arrow" aria-hidden>
                              {on ? (sort.dir === 'desc' ? '↓' : '↑') : '↕'}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={row.pickerId}>
                      <td>
                        <div className="picker-cell">
                          <Avatar size="small" title={row.displayName} initials={row.displayName.replace('Picker ', 'P')} />
                          <span>{row.displayName}</span>
                        </div>
                      </td>
                      {columns.map((col) => (
                        <td key={col.key}>{col.render(row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </BoxState>
  );
}
