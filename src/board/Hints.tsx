import type { State } from '../state';

type Hint = { title: string; look: string[]; tryThis: string[]; data?: string[] };

const HINTS: Record<string, Hint> = {
  SM1: {
    title: 'Store overview (as in production)',
    look: [
      'Live row: four stage counts (each opens its open orders), and the red "idle / untracked pickers" pill.',
      'Needs attention lists cancelled orders whose stock waits to go back, oldest first; each row opens the order drawer.',
      'People right now: working share bar, activity legend and how long each picker has been in that state.',
      'Shift performance: successful orders, prep time by stage, dispatch, PFR, fail rate, the hourly chart, Picker team.',
    ],
    tryThis: ['Click Ready for Rider to open its orders, then open one.', 'Open the oldest return and press Return products.', 'Open "3 / 4 open" next to the store name.', 'Sort Picker team by any column.'],
    data: ['11 returns waiting, from <1m to 166h.', '1 of 3 pickers working (Putaway), 2 idle / untracked.', 'All names, ids and amounts are placeholders (no production data).'],
  },
  SM2: {
    title: 'Picker team · sorted by fail rate',
    look: ['The orange sort icon marks the column. A fail rate above 5% turns red and flags the row with an orange bar.'],
    tryThis: ['Click Fail rate again to flip the direction.', 'Ask who needs a conversation at the end of the shift.'],
    data: ['Picker 07 (8.11%) and Picker 03 (6.67%) are above 5%.'],
  },
  SM3: {
    title: 'Shift performance · last 6h',
    look: ['The time window drives Time per order, by hour: bars and the completed-orders line now cover the last 6 hours.'],
    tryThis: ['Ask which hour they would look into, and why.', 'Switch to Last 1h and back to Today.'],
  },
  SM4: {
    title: 'Busy shift · late orders',
    look: ['14 open orders across the stages; Needs attention puts 5 late orders above the pending returns.', '4 of 6 pickers working, 2 idle / untracked.'],
    tryThis: ['Ask what they would do in the next minute.', 'Open Unassigned to see who is waiting.'],
  },
  SM5: {
    title: 'Idle store',
    look: ['No open orders and nothing to return; every picker is Idle / Untracked.'],
    tryThis: ['Ask whether the idle pill tells them enough.'],
  },
  SM6: {
    title: 'Store closed',
    look: ['The top bar says Closed and the now bar says Offline; Shift performance still shows the last 24h.'],
    tryThis: ['Ask what they would want to see before opening.'],
  },
  SM7: {
    title: 'Slow API · loading',
    look: ['Each region shows the same skeleton while the mock API takes 4 seconds, then the data appears.'],
    tryThis: ['Jump to SM7 again to repeat the delay.'],
  },
  SM8: {
    title: 'API error',
    look: ['Every card shows one shared error message; the now bar says live data is unavailable.'],
    tryThis: ['Ask whether they would trust the rest of the screen in this state.'],
  },
  SM10: { title: 'Warehouses', look: ['Every warehouse the user can open, searchable by name or ID. Order history and Cancellations stay disabled until one is opened.'], tryThis: ['Search for "002".'] },
  SM11: { title: 'Order history', look: ['Stage, Fulfillment and Date filters, exact Order ID / Customer / Picker search behind Apply, order drawer, ⋮ menu, rows per page and pages.'], tryThis: ['Filter by Cancelled.', 'Open the ⋮ menu: Cancel order is disabled with its reason.', 'Click an order number.'], data: ['Customer names are placeholders.'] },
  SM12: { title: 'Cancellations', look: ['Pending return · Settled · All cancelled. Reason shows who cancelled. Pending orders have Dismiss and Return.'], tryThis: ['Return one order and watch it move to Settled.'] },
  SM14: { title: 'No data yet', look: ['Every section in its empty state: no returns, no pickers, zero shift metrics, empty chart and team.'], tryThis: ['Walk through the three sections in the sidebar.'] },
  SM9: {
    title: 'Custom combination',
    look: ['A combination the tester built, e.g. a different sort or time window on top of a shift state.'],
    tryThis: ['Jump to SM1 in the navigator to restore the default view.'],
  },
};

const EDGE_RECIPES: { title: string; steps: string[] }[] = [
  { title: 'Late-order spike', steps: ['Jump to SM4 (mock data scenario, can’t be triggered by clicking).'] },
  { title: 'Idle store', steps: ['Jump to SM5.'] },
  { title: 'Store closed', steps: ['Jump to SM6.'] },
  { title: 'Mock API delay or error', steps: ['Jump to SM7 for a 4-second delay, SM8 for an error.'] },
];

/** Desktop-only side box: what to look at, what to try and what the data means in the current view. */
export function Hints({ s, code }: { s: State; code: string }) {
  const h = HINTS[code] ?? HINTS.SM1;
  return (
    <aside className="tester-notes" aria-label="Facilitator hints">
      <div className="tester-notes__tag">Facilitator hints · view {code}</div>
      <h2>{h.title}</h2>
      <p className="tester-notes__label">Look at</p>
      <ul>
        {h.look.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="tester-notes__label">Try</p>
      <ul>
        {h.tryThis.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {h.data && (
        <div className="expect">
          <p className="expect__title">What the data means</p>
          {h.data.map((l) => (
            <p key={l} className="expect__line">
              {l}
            </p>
          ))}
        </div>
      )}
      <p className="tester-notes__note">{s.version === 'legacy' ? 'Legacy Version: the Store Management Cockpit as it ships in production (portal.talabat.com), talabat theme. Use the sidebar to move between Overview, Order history and Cancellations.' : 'Cape Version: the same content in the DMarts Portal layout, on the default Cape theme.'}</p>
      {s.lang !== 'en' && <p className="tester-notes__note">The Cockpit is in {s.lang === 'es' ? 'Spanish' : 'Arabic'}; these hints stay in English.</p>}
      <details className="edge" open={code === 'SM1'}>
        <summary>Edge cases · how to recreate them</summary>
        {EDGE_RECIPES.map((e) => (
          <div key={e.title} className="edge__case">
            <h3>{e.title}</h3>
            <ol>
              {e.steps.map((st) => (
                <li key={st}>{st}</li>
              ))}
            </ol>
          </div>
        ))}
      </details>
    </aside>
  );
}
