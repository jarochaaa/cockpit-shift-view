import { createContext, useContext } from 'react';

/** Product tier shown in the prototype: the MVP scope or the End Vision. */
export type Tier = 'mvp' | 'vision';
export const TierContext = createContext<Tier>('vision');
export const useMvp = () => useContext(TierContext) === 'mvp';

/** Cape dark theme switch (Cape Version only). */
export const DarkContext = createContext(false);
export const useDark = () => useContext(DarkContext);

/** Charts proposal switch: sparklines in KPI tiles, bullet bars in the ranking and a trend chart. */
export const ChartsContext = createContext(false);
export const useCharts = () => useContext(ChartsContext);

/** Blueprint mode: the Overview explains how it is built instead of showing data. */
export const BlueprintContext = createContext(false);
export const useBlueprint = () => useContext(BlueprintContext);
