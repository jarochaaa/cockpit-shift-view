import type { Dispatch } from 'react';
import { fetchFloor, fetchStore } from '../domain/mockApi';
import { RTL_LOCALES } from '../i18n';
import type { Action, State } from '../state';
import { Header } from './Header';
import { NowBar } from './NowBar';
import { ShiftBoard } from './ShiftBoard';
import { useMock } from './useMock';

/**
 * The web product itself (Cockpit Polish, direction 1B): a now bar over a shift board.
 * Everything here follows the Cockpit language; the board around it stays English.
 */
export function Cockpit({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  // One floor snapshot feeds the now bar and the active tags in Picker team, so they always agree.
  const store = useMock(fetchStore, s.scenario);
  const floor = useMock(fetchFloor, s.scenario);

  return (
    <div className="cockpit" data-theme="talabat-light-b2b" dir={RTL_LOCALES.has(s.lang) ? 'rtl' : 'ltr'} lang={s.lang}>
      <div className="cockpit__live">
        <Header store={store} />
        <NowBar store={store} floor={floor} />
      </div>
      <ShiftBoard s={s} dispatch={dispatch} floor={floor} />
    </div>
  );
}
