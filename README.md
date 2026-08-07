# Cockpit — Shift View

A front-end prototype of a store-operations dashboard's "Shift View": a live status strip plus a grid of draggable, resizable boxes (Needs Attention, People & Tasks, Shift Metrics, Orders Timing, Picker Team, and two reserved placeholder slots).

**[Live demo →](https://jarochaaa.github.io/cockpit-shift-view/)**

## What this is

- Every box can be dragged by its header to reorder, and resized between **S / M / L** (third / half / full width). Dropping or resizing a box automatically rebalances whatever row it lands in or leaves, so rows never end up with a visible gap.
- A box's height is driven by its own content when it's alone in a row (L); boxes sharing a row (M/S) stretch to match their tallest neighbor, with an internal scroll as a safety net.
- All data is mocked client-side (`src/domain/mockApi.ts`) — no backend. The mock functions are async and shaped like real query results specifically so a real backend can be swapped in later without touching any component.
- Styled with real design-token values (colors, type scale, spacing, elevation) rather than ad-hoc CSS — see `src/cape/`.

## Running it locally

```bash
npm install
npm run dev
```

## Stack

React + TypeScript + Vite, [@dnd-kit](https://dndkit.com/) for drag-and-drop, [Recharts](https://recharts.org/) for the chart, [react-i18next](https://react.i18next.com/) for i18n (English only for now, structured for more locales).
