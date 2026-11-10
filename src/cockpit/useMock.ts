import { useEffect, useState } from 'react';
import type { Scenario } from '../domain/types';

export type Loaded<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

/** Runs one mock-API fetcher for the current scenario and tracks loading / error / ready. */
export function useMock<T>(load: (scenario: Scenario) => Promise<T>, scenario: Scenario): Loaded<T> {
  const [state, setState] = useState<{ key: string; value: Loaded<T> }>({ key: '', value: { status: 'loading' } });
  const key = scenario;

  useEffect(() => {
    let live = true;
    load(scenario).then(
      (data) => live && setState({ key, value: { status: 'ready', data } }),
      () => live && setState({ key, value: { status: 'error' } }),
    );
    return () => {
      live = false;
    };
  }, [load, scenario, key]);

  return state.key === key ? state.value : { status: 'loading' };
}
