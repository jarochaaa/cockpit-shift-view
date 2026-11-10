import type { State } from '../state';

type Hint = { title: string; look: string[]; tryThis: string[]; data?: string[] };

const HINTS: Record<string, Hint> = {
  SM1: {
    title: 'Default shift view',
    look: ['The header strip: can you tell the state of the shift in 3–5 seconds?', 'Orders & pickers: one list, unassigned orders first, then each picker with the order they hold.'],
    tryThis: ['Ask the Store Manager what they would do first, and why.', 'Use the filter in the Orders & pickers header.', 'Scroll to the warm zone: Shift metrics, Orders timing, Picker team.'],
    data: ['2 late orders (#67891, #67892) and 1 PF pending (#67893).', '4 of 9 pickers on shift are working, 5 are idle, 2 are offline.', 'SKU and Picker alerts show preview data: their stream ships in Slice 2.'],
  },
  SM2: {
    title: 'Needs attention',
    look: ['Only late or PF-pending work stays: the unassigned order and the pickers holding late or PF orders.'],
    tryThis: ['Ask which row they would act on first.', 'Switch back to All and compare.'],
    data: ['#67892 is unassigned and 3m late; Picker 02 holds #67891, 6m late; Picker 05 holds #67893 with PF pending.'],
  },
  SM3: {
    title: 'Unassigned orders',
    look: ['The 2 orders nobody holds yet, longest waiting first.'],
    tryThis: ['Ask who they would give each order to, then check the idle filter.'],
    data: ['#67892 waits 8m and is late; #67896 waits 2m.'],
  },
  SM4: {
    title: 'Idle pickers',
    look: ['Pickers with no task, longest idle first. Over 30 minutes turns the tag yellow.'],
    tryThis: ['Ask whether 53 minutes idle is normal on this shift.'],
    data: ['Picker 03 (53m) and Picker 04 (31m) are over the 30-minute threshold.'],
  },
  SM5: {
    title: 'Picker team · sorted by fail rate',
    look: ['Every column sorts. The arrow and the caption say which column and direction.'],
    tryThis: ['Click Fail rate again to flip the direction.', 'Ask who needs a conversation at the end of the shift.'],
    data: ['Orders show their share of the store total, e.g. 74 · 19%.', '3 pickers are above the 2% fail-rate threshold: Picker 03, 06 and 11.'],
  },
  SM6: {
    title: 'Orders timing · pie',
    look: ['Where prep time goes across the selected range: assigned, picked, packed.'],
    tryThis: ['Switch between Bars and Pie and ask which one answers "where is the time going?" faster.', 'Change the range to the last 6h.'],
  },
  SM7: {
    title: 'Layout · Orders & pickers resized to M',
    look: ['Clicking M pulled SKU alerts into the same row; Picker alerts kept its own row.'],
    tryThis: ['Click L to give the list its full width back.', 'Ask whether they would arrange the board differently.'],
  },
  SM8: {
    title: 'Layout · box dropped onto a full row',
    look: ['Shift metrics was set to S, so its row is full. Picker team was dropped on it and opened a new row instead of overflowing.'],
    tryThis: ['Drag any box by its header onto another box.'],
  },
  SM9: {
    title: 'Custom layout',
    look: ['A layout the tester built. Boxes alone in a row grow with their content; boxes that share a row scroll inside.'],
    tryThis: ['Jump to SM1 in the navigator to restore the default layout.'],
  },
  SM10: {
    title: 'Late-order spike, idle pickers',
    look: ['6 late orders, 3 of them still unassigned, while 6 pickers sit idle.'],
    tryThis: ['Ask what they would do in the next minute.', 'Use Needs attention, then Idle.'],
    data: ['Orders timing shows the spike in the last 3 hours.'],
  },
  SM11: {
    title: 'Quiet shift · empty states',
    look: ['Every box with nothing to show uses the same empty state and wording pattern.'],
    tryThis: ['Ask whether the empty states tell them enough.'],
  },
  SM12: {
    title: 'Store closed',
    look: ['The header turns to Closed and Offline; orders and pickers wait for opening. Metrics and timing still show the last 24h.'],
    tryThis: ['Ask what they would want to see before opening.'],
  },
  SM13: {
    title: 'Slow API · loading',
    look: ['Each box shows the same skeleton while the mock API takes 4 seconds, then the data appears.'],
    tryThis: ['Jump to SM13 again to repeat the delay.'],
  },
  SM14: {
    title: 'API error',
    look: ['Every box shows one shared error message; the header says live data is unavailable.'],
    tryThis: ['Ask whether they would trust the rest of the screen in this state.'],
  },
};

const EDGE_RECIPES: { title: string; steps: string[] }[] = [
  { title: 'Placeholder box, no stream yet', steps: ['Open SM1.', 'SKU alerts and Picker alerts carry "Preview data · Slice 2, not live yet".'] },
  { title: 'Row already full on drop', steps: ['Click S on Shift metrics: it pulls Picker alerts and Orders timing into its row (3 boxes).', 'Drag Picker team by its header onto Shift metrics: it opens a new row below.'] },
  { title: 'Late-order spike, idle pickers', steps: ['Jump to SM10 (mock data scenario, can’t be triggered by clicking).'] },
  { title: 'Store closed', steps: ['Jump to SM12.'] },
  { title: 'Empty states', steps: ['Jump to SM11, or use a filter with no matches (e.g. Needs attention in SM11).'] },
  { title: 'Mock API delay or error', steps: ['Jump to SM13 for a 4-second delay, SM14 for an error.'] },
];

/** Desktop-only side box: what to look at, what to try and what the data means in the current view. */
export function Hints({ s, code }: { s: State; code: string }) {
  const h = HINTS[code] ?? HINTS.SM1;
  const editing = code === 'SM7' || code === 'SM8' || code === 'SM9';
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
      {s.lang !== 'en' && <p className="tester-notes__note">The Cockpit is in {s.lang === 'es' ? 'Spanish' : 'Arabic'}; these hints stay in English.</p>}
      <details className="edge" open={editing || code === 'SM1'}>
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
