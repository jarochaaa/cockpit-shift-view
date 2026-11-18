import { useTranslation } from 'react-i18next';
import { duration } from '../domain/prod';
import type { OrderTimingBucket } from '../domain/types';

const PLOT_HEIGHT = 214;
const MAX_LABELS = 6;

/**
 * Production chart: stacked bars (assignment, picking, packaging average per hour) on the
 * Duration axis, plus the completed-orders line with dots on its own right-hand axis.
 * Plain HTML/SVG so it mirrors in RTL with the rest of the layout.
 */
export function TimingChart({ buckets }: { buckets: OrderTimingBucket[] }) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const locale = i18n.language === 'ar' ? 'ar-u-nu-latn' : 'en-US';

  const totals = buckets.map((b) => b.assignmentAvgSeconds + b.pickingAvgSeconds + b.packingAvgSeconds);
  // Duration axis top rounded up to a whole 30 s step so the ticks read cleanly.
  const top = Math.max(30, Math.ceil(Math.max(...totals, 0) / 30) * 30);
  const px = (s: number) => Math.round((s / top) * PLOT_HEIGHT);
  const ticks = [top, (top * 2) / 3, top / 3, 0];

  const maxDone = Math.max(4, Math.ceil(Math.max(...buckets.map((b) => b.completedCount), 0) / 4) * 4);
  const doneTicks = [maxDone, (maxDone * 3) / 4, maxDone / 2, maxDone / 4, 0];
  const n = buckets.length;
  const pts = buckets.map((b, i) => ({ x: ((i + 0.5) / n) * 100, y: 100 - (b.completedCount / maxDone) * 100 }));
  const line = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  const step = Math.max(1, Math.ceil(n / MAX_LABELS));
  const hour = (iso: string) => {
    const d = new Date(iso);
    d.setMinutes(0, 0, 0);
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="timing-chart" role="img" aria-label={t('shift.chartLabel')}>
      <div className="timing-chart__axis">
        {ticks.map((v) => (
          <span key={v}>{duration(v)}</span>
        ))}
      </div>
      <span className="timing-chart__title timing-chart__title--left">Duration</span>
      <div className="timing-chart__plot">
        <div className="timing-chart__grid" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="timing-chart__bars" style={{ height: PLOT_HEIGHT }}>
          {buckets.map((b) => (
            <div
              key={b.bucketStart}
              className="timing-chart__bar"
              title={`${hour(b.bucketStart)} · Assignment ${duration(b.assignmentAvgSeconds)} · Picking ${duration(b.pickingAvgSeconds)} · Packaging ${duration(b.packingAvgSeconds)} · Completed ${b.completedCount}`}
            >
              <span className="timing-chart__seg timing-chart__seg--pack" style={{ height: px(b.packingAvgSeconds) }} />
              <span className="timing-chart__seg timing-chart__seg--pick" style={{ height: px(b.pickingAvgSeconds) }} />
              <span className="timing-chart__seg timing-chart__seg--assign" style={{ height: px(b.assignmentAvgSeconds) }} />
            </div>
          ))}
          <svg className="timing-chart__line" viewBox="0 0 100 100" preserveAspectRatio="none" style={rtl ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
            <polyline points={line} fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="timing-chart__dots" style={rtl ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
            {pts.map((p, i) => (
              <span key={i} style={{ left: `${p.x}%`, top: `${p.y}%` }} />
            ))}
          </div>
        </div>
        <div className="timing-chart__labels">
          {buckets.map((b, i) =>
            i % step === step - 1 ? (
              <span key={b.bucketStart} style={{ insetInlineStart: `${((i + 0.5) / n) * 100}%` }}>
                {hour(b.bucketStart)}
              </span>
            ) : null,
          )}
        </div>
      </div>
      <div className="timing-chart__axis timing-chart__axis--right">
        {doneTicks.map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
      <span className="timing-chart__title timing-chart__title--right">Completed Orders</span>
    </div>
  );
}

/** Legend in production order: Assignment, Completed Orders, Packaging, Picking. */
export function TimingLegend() {
  return (
    <ul className="legend timing-legend">
      <li>
        <span className="legend__swatch legend__swatch--assign" />
        Assignment
      </li>
      <li>
        <span className="legend__swatch legend__swatch--line" />
        Completed Orders
      </li>
      <li>
        <span className="legend__swatch legend__swatch--pack" />
        Packaging
      </li>
      <li>
        <span className="legend__swatch legend__swatch--pick" />
        Picking
      </li>
    </ul>
  );
}
