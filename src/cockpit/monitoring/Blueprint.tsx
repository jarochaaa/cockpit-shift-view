import type { ReactNode } from 'react';
import { useMvp } from '../tier';

type Role = 'see' | 'decide' | 'act';
const ROLES: Record<Role, { label: string; desc: string }> = {
  see: { label: 'Visualisation', desc: 'Shows the data or its context' },
  decide: { label: 'Decision making', desc: 'Helps to understand and choose' },
  act: { label: 'Action trigger', desc: 'Starts the next step' },
};

interface Block {
  roles: Role[];
  n: number;
  name: string;
  /** The one question the block answers. */
  role: string;
  goes: string;
  why: string;
  vision?: boolean;
  skeleton?: 'bar' | 'filters' | 'cells4' | 'cells6' | 'rows' | 'cards';
}

const BLOCKS: Record<string, Block> = {
  header: {
    roles: ['see'],
    n: 1,
    name: 'Page header',
    role: 'Orient: where am I, and is it live?',
    goes: 'Page title, data freshness, stores live, then help, filters and account.',
    why: 'It is read first. If the data is stale, nothing below can be trusted.',
    skeleton: 'bar',
  },
  scope: {
    roles: ['see'],
    n: 2,
    name: 'Scope filters',
    role: 'Set the lens for the whole page.',
    goes: 'Region, Country and Zone. Hidden behind the filter icon next to Help.',
    why: 'One scope drives every number below. Kept out of sight so the data stays first.',
    skeleton: 'filters',
  },
  context: {
    roles: ['see', 'decide'],
    n: 4,
    name: 'Context banner',
    role: 'Explain the numbers before they are read.',
    goes: 'What is moving demand or supply this week: peak days, promos, weather. Date range, one line, details on demand.',
    why: 'A spike is expected, not alarming, when you already know why it is there.',
    vision: true,
    skeleton: 'bar',
  },
  live: {
    roles: ['see', 'decide'],
    n: 5,
    name: 'Live now',
    role: 'Live data: what is happening right now?',
    goes: 'The few KPIs that say if the market is healthy at this moment, each with its last 12 hours.',
    why: 'Answers "do I need to act?" in five seconds. Capped at 4 so nothing competes for attention.',
    skeleton: 'cells4',
  },
  perf: {
    roles: ['see', 'decide'],
    n: 6,
    name: 'Country performance',
    role: 'Diagnosis: how did the last hour do against target?',
    goes: 'Country-wide results weighted by order volume: speed (in-store time, rider waiting), fulfilment quality (partial fulfilment, fail rate, nSFR) and commercial health (basket).',
    why: 'Live now says what is happening; this says why, and whether the operation behind it is healthy. One hour smooths the noise of the live view. Capped at 6.',
    skeleton: 'cells6',
  },
  stores: {
    roles: ['decide', 'act'],
    n: 7,
    name: 'Stores updates',
    role: 'Where to act first.',
    goes: 'Every store ranked worst-first by how far it is from its own usual level and the country average. Status, key signals, search and status filters. A row opens the store level view.',
    why: 'The country numbers say something is off; this says which stores. The header stays sticky so filters are always at hand.',
    skeleton: 'rows',
  },
  insights: {
    roles: ['decide', 'act'],
    n: 3,
    name: 'Insights',
    role: 'Decision making and action triggering.',
    goes: 'Pre-digested alerts by severity (Critical, At risk, For info): what happened, the likely cause and the suggested action (Solve or Dismiss).',
    why: 'It sits beside the data and stays open, so the next step is never hunted for. It is the bridge from reading to acting.',
    vision: true,
    skeleton: 'cards',
  },
};

function Skeleton({ kind }: { kind?: Block['skeleton'] }) {
  if (!kind) return null;
  const cells = kind === 'cells4' ? 4 : kind === 'cells6' ? 6 : 0;
  if (cells)
    return (
      <div className={`bp__cells bp__cells--${cells}`} aria-hidden>
        {Array.from({ length: cells }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    );
  if (kind === 'filters')
    return (
      <div className="bp__row" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="bp__pill" />
        ))}
      </div>
    );
  if (kind === 'rows')
    return (
      <div className="bp__rows" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} />
        ))}
      </div>
    );
  if (kind === 'cards')
    return (
      <div className="bp__cards" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} />
        ))}
      </div>
    );
  return <div className="bp__bar" aria-hidden />;
}

function BlockView({ id, className }: { id: keyof typeof BLOCKS; className?: string }) {
  const b = BLOCKS[id];
  return (
    <section className={`bp__block${b.vision ? ' bp__block--vision' : ''}${className ? ` ${className}` : ''}`} aria-label={b.name}>
      <header className="bp__head">
        <span className="bp__num">{b.n}</span>
        <h2>{b.name}</h2>
        <span className="bp__roles">
          {b.roles.map((r) => (
            <i key={r} className={`bp__dot bp__dot--${r}`} title={ROLES[r].label} />
          ))}
        </span>
        <span className="bp__tier">{b.vision ? 'End Vision only' : 'MVP + End Vision'}</span>
      </header>
      <p className="bp__role">{b.role}</p>
      <Skeleton kind={b.skeleton} />
      <dl>
        <div>
          <dt>Goes here</dt>
          <dd>{b.goes}</dd>
        </div>
        <div>
          <dt>Why here</dt>
          <dd>{b.why}</dd>
        </div>
      </dl>
    </section>
  );
}

const PRINCIPLES: [string, ReactNode][] = [
  ['Reading order', 'Orient, scope, context, live, diagnose, act. Top to bottom, left to right.'],
  ['Context before numbers', 'Say why the data moves before showing it.'],
  ['Few KPIs per block', '4 live, 6 performance. More goes behind Edit.'],
  ['Fewer lines', 'KPIs share one box with dividers; no card inside a card.'],
];

const NAV = ['Overview', 'Order history', 'Cancellations'];

/** The portal navigation drawn as part of the blueprint: only Overview is lit, it is the view being introduced. */
function BlueprintNav() {
  return (
    <nav className="bp__nav" aria-label="Navigation (blueprint)">
      <span className="bp__brand">DMarts Portal</span>
      <ul>
        {NAV.map((n) => (
          <li key={n} className={n === 'Overview' ? 'is-on' : undefined} aria-current={n === 'Overview' ? 'page' : undefined}>
            {n}
          </li>
        ))}
      </ul>
      <p>Lit: the view this blueprint introduces. The rest is context.</p>
    </nav>
  );
}

/** Overview in blueprint mode: the same structure, no data, each block says what it is for and why it sits there. */
export function Blueprint({ withNav = false }: { withNav?: boolean }) {
  const mvp = useMvp();
  const body = (
    <>
      <header className="bp__intro">
        <h1>Overview · Page architecture blueprint</h1>
        <p>The structure where reading, deciding and acting happen. No data here: every block says what it is for and why it sits where it does. Read it in order: orient, scope, context, live, diagnose, act.</p>
        <ul className="bp__legend" aria-label="Legend">
          {(Object.keys(ROLES) as Role[]).map((r) => (
            <li key={r}>
              <i className={`bp__dot bp__dot--${r}`} />
              <b>{ROLES[r].label}</b>
              <span>{ROLES[r].desc}</span>
            </li>
          ))}
        </ul>
      </header>
      <div className={`bp__layout${mvp ? ' bp__layout--solo' : ''}`}>
        <div className="bp__main">
          <BlockView id="header" />
          <BlockView id="scope" />
          {!mvp && <BlockView id="context" />}
          <BlockView id="live" />
          <BlockView id="perf" />
          <BlockView id="stores" />
        </div>
        {!mvp && <BlockView id="insights" className="bp__side" />}
      </div>
      <footer className="bp__principles">
        {PRINCIPLES.map(([h, d]) => (
          <div key={h}>
            <b>{h}</b>
            <span>{d}</span>
          </div>
        ))}
      </footer>
    </>
  );
  if (!withNav) return <div className="bp">{body}</div>;
  return (
    <div className="bp bp--shell">
      <BlueprintNav />
      <div className="bp__body">{body}</div>
    </div>
  );
}
