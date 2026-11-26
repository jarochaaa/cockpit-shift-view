import type { CSSProperties } from 'react';

/** Small deterministic noise so every chart keeps its shape between renders. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export type Trend = 'up' | 'down' | 'flat';
const TONE = { up: 'var(--cp-chart-color-danger-high)', mild: 'var(--cp-chart-color-warning-highest)', calm: 'var(--cp-chart-color-neutral-high)' };

const SPARK_TIP = 'Last 12 hours, one point per hour; the dot is now. A line climbing means the KPI is drifting away from target (red or amber when it matters); flat means stable.';

/** Last 12 hours of one KPI: a thin line with a round dot on "now". Colour only when the trend is a problem. */
export function Sparkline({ seed, trend, tone = 'calm' }: { seed: string; trend: Trend; tone?: keyof typeof TONE }) {
  const r = rng(seed);
  const n = 12;
  const pts = Array.from({ length: n }, (_, i) => {
    const base = trend === 'up' ? 0.25 + (i / (n - 1)) * 0.55 : trend === 'down' ? 0.7 - (i / (n - 1)) * 0.35 : 0.5;
    return Math.min(0.95, Math.max(0.05, base + (r() - 0.5) * 0.22));
  });
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (v: number) => 100 - v * 100;
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <span className="msm-spark" data-tip={SPARK_TIP} tabIndex={0} role="img" aria-label={SPARK_TIP} style={{ '--spark': TONE[tone] } as CSSProperties}>
      <span className="msm-spark__plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polygon points={`0,100 ${line} 100,100`} className="msm-spark__area" />
          <polyline points={line} className="msm-spark__line" vectorEffect="non-scaling-stroke" />
        </svg>
        <i className="msm-spark__dot" style={{ top: `${y(pts[n - 1])}%` }} />
      </span>
    </span>
  );
}

const BULLET_TIP = 'Bar: how far this value is from its target. The tick is the target; a full bar is twice the target. Amber above target, red above 1.5 times the target.';

/** Bullet bar for a table cell: how far the value is from its target (the tick). The tooltip explains how to read it. */
export function Bullet({ value, target }: { value: number; target: number }) {
  const ratio = value / target;
  const tone = ratio >= 1.5 ? 'high' : ratio > 1 ? 'mild' : 'ok';
  return (
    <span className={`msm-bullet msm-bullet--${tone}`} data-tip={BULLET_TIP} role="img" aria-label={BULLET_TIP} tabIndex={0}>
      <i style={{ width: `${Math.min(100, (ratio / 2) * 100)}%` }} />
      <b />
    </span>
  );
}
