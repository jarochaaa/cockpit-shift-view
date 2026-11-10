import { useState } from 'react';
import { PRESETS } from '../state';

type Row = { title: string; hint: string; presets: string[] };

const USE_CASES: Row[] = [
  { title: 'USE CASE 1 · Read the live state in one glance', hint: 'Now bar → Late orders → Working now', presets: ['default'] },
  { title: 'USE CASE 2 · Find who needs a conversation', hint: 'Picker team, sortable by any column', presets: ['default', 'team-sorted'] },
  { title: 'USE CASE 3 · Spot slow hours', hint: 'Orders timing by hour, last 1, 6, 12 or 24h', presets: ['default', 'range-6h'] },
];

const EDGE_CASES: Row[] = [
  { title: 'EDGE CASE 1 · Late-order spike', hint: 'Many late orders, unassigned work waiting', presets: ['spike'] },
  { title: 'EDGE CASE 2 · Idle store', hint: 'Both lists collapse into one line', presets: ['quiet'] },
  { title: 'EDGE CASE 3 · Store closed', hint: 'No live orders, everyone offline', presets: ['closed'] },
  { title: 'EDGE CASE 4 · Mock API delay or error', hint: 'Skeletons, then the shared error message', presets: ['slow', 'error'] },
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
