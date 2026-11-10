# Cockpit — Shift View

A front-end prototype of a store-operations dashboard's "Shift View", built from the Cockpit Polish design (direction 1B, "Now bar over shift board"): the live state compresses into one bar (stage counts, late orders, who is working now) and everything below is the shift on a tinted board (shift metrics, orders timing by hour, picker team).

**[Live demo →](https://jarochaaa.github.io/cockpit-shift-view/)**

## What this is

- **Now bar:** stage counts, a late-orders tag and the team split, then Late orders and Working now. With nothing late and nobody on an order, both lists collapse into one line.
- **Shift board:** successful orders and prep time by stage, orders timing by hour (last 1, 6, 12 or 24h) and a sortable picker team table.
- **Version 2** ("Switch to Version 2" above the language switch): the same content in the DMarts Portal layout (sidenav, Live orders tiles, Late orders and Working now lists, shift performance, picker team), on the default Cape theme (`cape-light-b2b`).
- A prototype board around the product: a navigator with every view (SM1–SM9), facilitator hints and an EN/ES/AR language switch with RTL.
- All data is mocked client-side (`src/domain/mockApi.ts`), with no backend. The mock functions are async and shaped like real query results, so a real backend can be swapped in later without touching any component.
- Styled with Cape design tokens: talabat light B2B for Version 1, Cape light B2B for Version 2. Cape components are local re-implementations with the same props as `@deliveryhero/cape-core` (see `src/cape/`).

## Running it locally

```bash
npm install
npm run dev
```

## Stack

React + TypeScript + Vite and [react-i18next](https://react.i18next.com/) for i18n (English, Spanish and Arabic). The chart is plain HTML and SVG.
