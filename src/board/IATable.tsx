import { useEffect, useMemo, useRef, useState } from 'react';
import { IA_ROWS } from './iaData';

const SHEET = 'https://docs.google.com/spreadsheets/d/1jVD-QPSqIl6TcFvejJJWrsh151462OBJYLJ-Dq_Aoy0/edit';
const CATS = ['All', ...Array.from(new Set(IA_ROWS.map((r) => r.cat)))];

/** Floating, expanded Information Architecture table: every data point, who needs it, where it lives and how feasible it is. */
export function IATable({ onClose }: { onClose: () => void }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return IA_ROWS.filter((r) => (cat === 'All' || r.cat === cat) && (!n || `${r.metric} ${r.desc} ${r.persona} ${r.source}`.toLowerCase().includes(n)));
  }, [cat, q]);
  return (
    <div className="ia-layer">
      <div className="ia-backdrop" onClick={onClose} aria-hidden />
      <div className="ia-panel" role="dialog" aria-modal="true" aria-label="Information Architecture" tabIndex={-1} ref={ref}>
        <header className="ia-head">
          <div>
            <h2>Information Architecture · Multi-Store Data</h2>
            <p>
              {rows.length} of {IA_ROWS.length} data points · feasibility is a design estimate to validate with Data and Engineering; Unknown when we cannot tell yet.{' '}
              <a href={SHEET} target="_blank" rel="noreferrer">
                Open spreadsheet
              </a>
            </p>
          </div>
          <button type="button" className="ia-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="ia-tools">
          <input type="search" placeholder="Search data point, persona or source" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <div className="ia-chips" role="group" aria-label="Category">
            {CATS.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="ia-scroll">
          <table className="ia-table">
            <thead>
              <tr>
                {['Category', 'Data point / metric', 'Description', 'Target persona', 'Current source / tool', 'Feasibility', 'Critical when', 'Expected action when critical', 'LATAM class', 'Evidence', 'Top 10 (rank · why)'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.metric}>
                  <td>{r.cat}</td>
                  <th scope="row">{r.metric}</th>
                  <td>{r.desc}</td>
                  <td>{r.persona}</td>
                  <td>{r.source}</td>
                  <td>
                    <span className={`ia-feas${r.feas == null ? ' ia-feas--unknown' : r.feas >= 80 ? ' ia-feas--high' : ' ia-feas--mid'}`}>{r.feas == null ? 'Unknown' : `${r.feas}%`}</span>
                  </td>
                  <td>{r.critical}</td>
                  <td>{r.action}</td>
                  <td>{r.klass}</td>
                  <td>{r.evidence}</td>
                  <td>{r.top10 || '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11} className="ia-empty">
                    No data points match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
