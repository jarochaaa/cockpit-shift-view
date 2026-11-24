import { createContext, useContext } from 'react';

/** Product tier shown in the prototype: the MVP scope or the End Vision. */
export type Tier = 'mvp' | 'vision';
export const TierContext = createContext<Tier>('vision');
export const useMvp = () => useContext(TierContext) === 'mvp';

/** Cape dark theme switch (Cape Version only). */
export const DarkContext = createContext(false);
export const useDark = () => useContext(DarkContext);
