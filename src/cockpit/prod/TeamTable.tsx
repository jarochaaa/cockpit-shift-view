import { FAIL_ALERT, duration } from '../../domain/prod';
import type { TeamRow } from '../../domain/prod';
import type { State, TeamSortKey } from '../../state';
import { CapeIcon } from '../legacy/icons';

const COLS: { key: TeamSortKey; label: string }[] = [
  { key: 'name', label: 'Picker' },
  { key: 'assignment', label: 'Assignment Time' },
  { key: 'picking', label: 'Picking Time' },
  { key: 'pickingPerItem', label: 'Picking Time / Item' },
  { key: 'packing', label: 'Packing Time' },
  { key: 'prep', label: 'Prep Time' },
  { key: 'pfr', label: 'Partial fulfillment' },
  { key: 'failRate', label: 'Fail rate' },
  { key: 'successful', label: 'Successful' },
  { key: 'receivingPerSku', label: 'Receiving Time / SKU' },
];

const value = (r: TeamRow, k: TeamSortKey): number | string => {
  switch (k) {
    case 'name':
      return r.name;
    case 'prep':
      return r.assignment + r.picking + r.packing;
    case 'receivingPerSku':
      return r.receivingPerSku ?? -1;
    case 'default':
      return 0;
    default:
      return r[k];
  }
};
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/** Picker team, the 10 columns production shows; every header sorts, a fail rate above 5% turns red and flags the row. */
export function TeamTable({ rows, sort, onSort }: { rows: TeamRow[]; sort: State['sort']; onSort: (k: TeamSortKey) => void }) {
  const sorted =
    sort.key === 'default'
      ? rows
      : [...rows].sort((a, b) => {
          const x = value(a, sort.key);
          const y = value(b, sort.key);
          const c = typeof x === 'string' ? x.localeCompare(String(y)) : x - (y as number);
          return sort.dir === 'desc' ? -c : c;
        });
  return (
    <div className="pd-table-scroll">
      <table className="pd-team">
        <thead>
          <tr>
            {COLS.map((c) => {
              const on = sort.key === c.key;
              return (
                <th key={c.key} aria-sort={on ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
                  <button type="button" className={`pd-sort${on ? ' pd-sort--on' : ''}`} onClick={() => onSort(c.key)}>
                    <span>{c.label}</span>
                    <CapeIcon name="sort" size={14} />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const alert = r.failRate > FAIL_ALERT;
            return (
              <tr key={r.id} className={alert ? 'pd-team__alert' : undefined}>
                <td>{r.name}</td>
                <td>{duration(r.assignment)}</td>
                <td>{duration(r.picking)}</td>
                <td>{duration(r.pickingPerItem)}</td>
                <td>{duration(r.packing)}</td>
                <td>{duration(r.assignment + r.picking + r.packing)}</td>
                <td className="pd-ok">{pct(r.pfr)}</td>
                <td className={alert ? 'pd-bad' : 'pd-ok'}>{pct(r.failRate)}</td>
                <td>{r.successful}</td>
                <td>
                  {r.receivingPerSku == null ? (
                    '—'
                  ) : (
                    <>
                      <b>{duration(r.receivingPerSku)}</b> <span className="pd-muted">{r.receivingUnits} units</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
