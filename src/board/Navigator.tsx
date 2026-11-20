import { useState } from 'react';
import { presetsFor } from '../state';
import type { Version } from '../state';

type Row = { title: string; hint: string; presets: string[] };

const USE_CASES: Row[] = [
  { title: 'USE CASE 0 · Triage many stores at once', hint: 'Country Monitor: KPI strip → store ranking → drill-in → alerts', presets: ['monitoring'] },
  { title: 'USE CASE 1 · Read the live state in one glance', hint: 'Stage counts → Needs attention (returns) → People right now', presets: ['default'] },
  { title: 'USE CASE 2 · Find who needs a conversation', hint: 'Picker team, sortable by any column', presets: ['team-sorted'] },
  { title: 'USE CASE 3 · Pick a warehouse', hint: 'Warehouses, search by name or ID', presets: ['warehouses'] },
  { title: 'USE CASE 4 · Look up an order', hint: 'Order history: filters, rows per page, pages', presets: ['orders'] },
  { title: 'USE CASE 5 · Put cancelled stock back', hint: 'Needs attention or Cancellations → Return products', presets: ['cancellations'] },
];

const EDGE_CASES: Row[] = [
  { title: 'EDGE CASE 1 · No data yet', hint: 'Every empty state', presets: ['empty'] },
  { title: 'EDGE CASE 2 · Busy shift', hint: 'Late orders on top of the returns, work waiting in every stage', presets: ['spike'] },
  { title: 'EDGE CASE 3 · Idle store', hint: 'Nothing late, pickers waiting', presets: ['quiet'] },
  { title: 'EDGE CASE 4 · Store closed', hint: 'No live orders, everyone offline', presets: ['closed'] },
  { title: 'EDGE CASE 5 · Mock API delay or error', hint: 'Skeletons, then the shared error message', presets: ['slow', 'error'] },
];


export function Navigator({ code, version, onJump, open, onToggle, action }: { code: string; version: Version; onJump: (id: string) => void; open: boolean; onToggle: () => void; action?: React.ReactNode }) {
  const PRESETS = presetsFor(version);
  const has = (id: string) => PRESETS.some((p) => p.id === id);
  const byId = (id: string) => PRESETS.find((p) => p.id === id)!;
  const [groups, setGroups] = useState({ uc: true, ec: true, all: true });

  const pick = (id: string) => {
    onJump(id);
    onToggle();
  };
  const rowButton2 = (id: string, key: string) => {
    const p = byId(id);
    return (
      <button key={key} type="button" className={code === p.code ? 'is-on' : undefined} onClick={() => pick(id)}>
        <b className="proto-nav__code">{p.code}</b>
        {p.label}
      </button>
    );
  };
  const section2 = (rows: Row[]) =>
    rows.filter((u) => u.presets.some(has)).map((u) => (
      <div key={u.title} style={{ display: 'contents' }}>
        <div className="proto-nav__uc">
          {u.title}
          <small>{u.hint}</small>
        </div>
        {u.presets.filter(has).map((id) => rowButton2(id, `${u.title}-${id}`))}
      </div>
    ));

  return (
    <>
      <div className="proto-dock">{action}</div>
      {open && (
        <div className="flows-layer">
          <div className="flows-backdrop" onClick={onToggle} aria-hidden />
          <aside className="flows-drawer" role="dialog" aria-modal="true" aria-label="Product Flows">
            <header className="flows-drawer__head">
              <div>
                <h2>Product Flows</h2>
                <p>Store Management Cockpit - Prototype - Direction</p>
              </div>
              <button type="button" className="ia-close" onClick={onToggle} aria-label="Close">
                ×
              </button>
            </header>
            <nav className="proto-nav" aria-label="Prototype flow" data-open="true">
              <button type="button" className="proto-nav__group" aria-expanded={groups.uc} onClick={() => setGroups({ ...groups, uc: !groups.uc })}>
                <span className="proto-nav__chev" aria-hidden />
                Use cases
                <em>{USE_CASES.length}</em>
              </button>
              {groups.uc && section2(USE_CASES)}
              <button type="button" className="proto-nav__group" aria-expanded={groups.ec} onClick={() => setGroups({ ...groups, ec: !groups.ec })}>
                <span className="proto-nav__chev" aria-hidden />
                Edge cases
                <em>{EDGE_CASES.length}</em>
              </button>
              {groups.ec && section2(EDGE_CASES)}
              <button type="button" className="proto-nav__group" aria-expanded={groups.all} onClick={() => setGroups({ ...groups, all: !groups.all })}>
                <span className="proto-nav__chev" aria-hidden />
                Cockpit
                <em>{PRESETS.length}</em>
              </button>
              {groups.all &&
                PRESETS.map((p, i) => (
                  <div key={p.id} style={{ display: 'contents' }}>
                    {(i === 0 || PRESETS[i - 1].group !== p.group) && <div className="proto-nav__sub">{p.group}</div>}
                    {rowButton2(p.id, p.id)}
                  </div>
                ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
