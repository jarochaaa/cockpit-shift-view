import type { State } from '../state';

type Hint = { title: string; look: string[]; tryThis: string[]; data?: string[] };

const HINTS: Record<string, Hint> = {
  SM1: {
    title: 'Default shift view',
    look: [
      'The now bar: can you tell the state of the shift in 3–5 seconds?',
      'Late orders and Working now sit right under it; everything below is the shift.',
      'Shift performance: successful orders, prep time by stage, orders timing by hour, Picker team.',
    ],
    tryThis: ['Ask the Store Manager what they would do first, and why.', 'Change the time window to Last 6h.', 'Click a Picker team column to sort by it.'],
    data: ['2 late orders: #67891 (Picker 02, 6m late) and #67892 (not assigned, 3m late).', '4 pickers are on an order, 5 are idle, 2 are offline.', 'Picker team totals add up to the 387 successful orders.'],
  },
  SM2: {
    title: 'Picker team · sorted by fail rate',
    look: ['The arrow marks the sorted column. Fail rates over 4% read red, under 4% yellow, zero stays quiet.'],
    tryThis: ['Click Fail rate again to flip the direction.', 'Ask who needs a conversation at the end of the shift.'],
    data: ['5 pickers have a non-zero fail rate; Picker 11 (5.88%), 03 (5.00%) and 06 (4.55%) are over 4%.'],
  },
  SM3: {
    title: 'Shift performance · last 6h',
    look: ['The time window drives Orders timing by hour: the bars now show only the last 6 hours.'],
    tryThis: ['Ask which hour they would look into, and why.', 'Switch to Last 1h and back to Last 24h.'],
  },
  SM4: {
    title: 'Late-order spike',
    look: ['6 late orders, 3 of them still unassigned, while pickers sit idle.'],
    tryThis: ['Ask what they would do in the next minute.'],
    data: ['Orders timing shows the spike in the last 3 hours.'],
  },
  SM5: {
    title: 'Idle store · nothing late',
    look: ['Both detail lists collapse and the bar carries the whole live state in one line, so the shift board moves up.', 'The live dot turns grey: there are no open orders.'],
    tryThis: ['Ask whether one line tells them enough.'],
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
  SM10: { title: 'Warehouse list', look: ['Every store the user can open, with search. Click a card to open its overview.'], tryThis: ['Search for "002".'] },
  SM11: { title: 'Order history', look: ['Stage and fulfillment filters, order ID and customer search, rows per page and pages.'], tryThis: ['Filter by Cancelled.', 'Search order 67890 and press Apply.'], data: ['Customer names are placeholders.'] },
  SM12: { title: 'Cancellations', look: ['Pending return · Settled · All cancelled. Each pending order has Return to stock.'], tryThis: ['Return one order and watch it move to Settled.'] },
  SM13: { title: 'Order issues', look: ['Four KPIs, New / Reviewed / All, group by Order or Picker, filters behind Apply.'], tryThis: ['Group by Picker.', 'Mark an issue reviewed.'] },
  SM14: { title: 'No data yet · as in staging', look: ['Every section in its empty state, exactly as staging shows it today.'], tryThis: ['Walk through all four sections in the sidebar.'] },
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
      <p className="tester-notes__note">{s.version === 'legacy' ? 'Legacy Version: the Store Management Cockpit as it ships in staging, talabat theme. Use the sidebar to move between Overview, Order history, Cancellations and Order issues.' : 'Cape Version: the same content in the DMarts Portal layout, on the default Cape theme.'}</p>
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
