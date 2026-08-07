import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../cape/Avatar';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { fetchPickerTeam } from '../domain/mockApi';
import { formatPercent, formatSeconds } from '../domain/format';
import type { PickerTeamRow } from '../domain/types';

type SortKey = keyof Pick<PickerTeamRow, 'avgAssignmentSeconds' | 'avgPickingSeconds' | 'avgPackingSeconds' | 'pfr' | 'failRate' | 'ordersCount'> | 'prep';

function failRateStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate === 0) return 'success';
  if (rate <= 0.02) return 'warning';
  return 'error';
}

function prepSeconds(row: PickerTeamRow) {
  return row.avgAssignmentSeconds + row.avgPickingSeconds + row.avgPackingSeconds;
}

export function PickerTeamBox() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PickerTeamRow[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('prep');

  useEffect(() => {
    fetchPickerTeam().then(setRows);
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const va = sortKey === 'prep' ? prepSeconds(a) : a[sortKey];
      const vb = sortKey === 'prep' ? prepSeconds(b) : b[sortKey];
      return vb - va;
    });
  }, [rows, sortKey]);

  if (!rows) return null;

  const columns: { key: SortKey; label: string; render: (row: PickerTeamRow) => ReactNode }[] = [
    { key: 'avgAssignmentSeconds', label: t('pickerTeam.columns.assign'), render: (r) => formatSeconds(r.avgAssignmentSeconds) },
    { key: 'avgPickingSeconds', label: t('pickerTeam.columns.pick'), render: (r) => formatSeconds(r.avgPickingSeconds) },
    { key: 'avgPackingSeconds', label: t('pickerTeam.columns.pack'), render: (r) => formatSeconds(r.avgPackingSeconds) },
    { key: 'prep', label: t('pickerTeam.columns.prep'), render: (r) => formatSeconds(prepSeconds(r)) },
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
    { key: 'ordersCount', label: t('pickerTeam.columns.orders'), render: (r) => String(r.ordersCount) },
  ];

  return (
    <div>
      <Typography variant="caption">{t('pickerTeam.sortedBy')}</Typography>
      <div className="table-scroll">
      <table className="cp-table">
        <thead>
          <tr>
            <th>{t('pickerTeam.columns.picker')}</th>
            {columns.map((col) => (
              <th key={col.label}>
                <button type="button" className="sort-header" onClick={() => setSortKey(col.key)}>
                  {col.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.pickerId}>
              <td>
                <div className="picker-cell">
                  <Avatar size="small" title={row.displayName} />
                  <span>{row.displayName}</span>
                </div>
              </td>
              {columns.map((col) => (
                <td key={col.label}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
