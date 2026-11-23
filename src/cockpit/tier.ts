import { createContext, useContext } from 'react';

/** Product tier shown in the prototype: the MVP scope or the End Vision. */
export type Tier = 'mvp' | 'vision';
export const TierContext = createContext<Tier>('vision');
export const useMvp = () => useContext(TierContext) === 'mvp';
