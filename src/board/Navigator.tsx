import { useState } from 'react';
import { PRESETS } from '../state';

type Row = { title: string; hint: string; presets: string[] };

const USE_CASES: Row[] = [
  { title: 'USE CASE 1 · Read the live state in one glance', hint: 'Stage counts → Needs attention → People right now', presets: ['default'] },
  { title: 'USE CASE 2 · Find who needs a conversation', hint: 'Picker team, sortable by any column', presets: ['team-sorted'] },
  { title: 'USE CASE 3 · Pick a warehouse', hint: 'Warehouse list with search', presets: ['warehouses'] },
  { title: 'USE CASE 4 · Look up an order', hint: 'Order history: filters, rows per page, pages', presets: ['orders'] },
  { title: 'USE CASE 5 · Put cancelled stock back', hint: 'Cancellations: pending return → Return to stock', presets: ['cancellations'] },
  { title: 'USE CASE 6 · Review order issues', hint: 'KPIs, New / Reviewed, group by picker', presets: ['issues'] },
];

const EDGE_CASES: Row[] = [
  { title: 'EDGE CASE 1 · No data yet', hint: 'Every empty state, as staging shows it today', presets: ['empty'] },
  { title: 'EDGE CASE 2 · Late-order spike', hint: 'Many late orders, unassigned work waiting', presets: ['spike'] },
  { title: 'EDGE CASE 3 · Idle store', hint: 'Nothing late, pickers waiting', presets: ['quiet'] },
  { title: 'EDGE CASE 4 · Store closed', hint: 'No live orders, everyone offline', presets: ['closed'] },
  { title: 'EDGE CASE 5 · Mock API delay or error', hint: 'Skeletons, then the shared error message', presets: ['slow', 'error'] },
];

const byId = (id: string) => PRESETS.find((p) => p.id === id)!;

export function Navigator({ code, onJump, open, onToggle }: { code: string; onJump: (id: string) => void; open: boolean; onToggle: () => void }) {
  const [groups, setGroups] = useState({ uc: true, ec: true, all: true });

  const rowButton = (id: string, key: string) => {
    const p = byId(id);
    return (
      <button key={key} type="button" className={code === p.code ? 'is-on' : undefined} onClick={() => onJump(id)}>
        <b className="proto-nav__code">{p.code}</b>
        {p.label}
      </button>
    );
  };

  const section = (rows: Row[]) =>
    rows.map((u) => (
      <div key={u.title} style={{ display: 'contents' }}>
        <div className="proto-nav__uc">
          {u.title}
          <small>{u.hint}</small>
        </div>
        {u.presets.map((id) => rowButton(id, `${u.title}-${id}`))}
      </div>
    ));

  return (
    <nav className="proto-nav" aria-label="Prototype flow" data-open={open}>
      <button type="button" className="proto-nav__title" aria-expanded={open} onClick={onToggle}>
        <span className="proto-nav__chev" aria-hidden />
        Store Management Cockpit - Shift View
      </button>
      {open && (
        <>
          <button type="button" className="proto-nav__group" aria-expanded={groups.uc} onClick={() => setGroups({ ...groups, uc: !groups.uc })}>
            <span className="proto-nav__chev" aria-hidden />
            Use cases
            <em>{USE_CASES.length}</em>
          </button>
          {groups.uc && section(USE_CASES)}

          <button type="button" className="proto-nav__group" aria-expanded={groups.ec} onClick={() => setGroups({ ...groups, ec: !groups.ec })}>
            <span className="proto-nav__chev" aria-hidden />
            Edge cases
            <em>{EDGE_CASES.length}</em>
          </button>
          {groups.ec && section(EDGE_CASES)}

          <button type="button" className="proto-nav__group" aria-expanded={groups.all} onClick={() => setGroups({ ...groups, all: !groups.all })}>
            <span className="proto-nav__chev" aria-hidden />
            Cockpit
            <em>{PRESETS.length}</em>
          </button>
          {groups.all &&
            PRESETS.map((p, i) => (
              <div key={p.id} style={{ display: 'contents' }}>
                {(i === 0 || PRESETS[i - 1].group !== p.group) && <div className="proto-nav__sub">{p.group}</div>}
                {rowButton(p.id, p.id)}
              </div>
            ))}
        </>
      )}
    </nav>
  );
}
