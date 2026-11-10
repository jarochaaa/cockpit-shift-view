import { useTranslation } from 'react-i18next';
import type { OrderTimingBucket } from '../domain/types';

const PLOT_HEIGHT = 214;
const MAX_LABELS = 7;
const minutes = (s: number) => s / 60;

/**
 * Stacked bars (assignment, picking, packing average per hour) with the completed
 * orders line on top, drawn in plain HTML/SVG so it follows the design 1:1 and
 * mirrors in RTL with the rest of the layout.
 */
export function TimingChart({ buckets }: { buckets: OrderTimingBucket[] }) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const locale = i18n.language === 'ar' ? 'ar-u-nu-latn' : i18n.language;

  const totals = buckets.map((b) => minutes(b.assignmentAvgSeconds + b.pickingAvgSeconds + b.packingAvgSeconds));
  // Axis top rounded up to a multiple of 0.3m so the three gridlines land on clean values.
  const top = Math.max(0.3, Math.ceil(Math.max(...totals, 0) / 0.3) * 0.3);
  const px = (s: number) => Math.round((minutes(s) / top) * PLOT_HEIGHT);
  const ticks = [top, (top * 2) / 3, top / 3, 0];

  const maxCompleted = Math.max(...buckets.map((b) => b.completedCount), 1) * 1.2;
  const n = buckets.length;
  const line = buckets.map((b, i) => `${(((i + 0.5) / n) * 100).toFixed(2)},${(100 - (b.completedCount / maxCompleted) * 100).toFixed(2)}`).join(' ');

  const step = Math.max(1, Math.ceil((n - 1) / (MAX_LABELS - 1)));
  const labelIdx = buckets.map((_, i) => i).filter((i) => i % step === 0 || i === n - 1);
  const hour = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: 'numeric' });

  return (
    <div className="timing-chart" role="img" aria-label={t('shift.chartLabel')}>
      <div className="timing-chart__axis">
        {ticks.map((v) => (
          <span key={v}>{v === 0 ? 0 : v.toFixed(1)}m</span>
        ))}
      </div>
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
              title={`${hour(b.bucketStart)} · ${t('shift.assignment')} ${minutes(b.assignmentAvgSeconds).toFixed(1)}m · ${t('shift.picking')} ${minutes(b.pickingAvgSeconds).toFixed(1)}m · ${t('shift.packing')} ${minutes(b.packingAvgSeconds).toFixed(1)}m · ${t('shift.completed')} ${b.completedCount}`}
            >
              <span className="timing-chart__seg timing-chart__seg--pack" style={{ height: px(b.packingAvgSeconds) }} />
              <span className="timing-chart__seg timing-chart__seg--pick" style={{ height: px(b.pickingAvgSeconds) }} />
              <span className="timing-chart__seg timing-chart__seg--assign" style={{ height: px(b.assignmentAvgSeconds) }} />
            </div>
          ))}
          <svg className="timing-chart__line" viewBox="0 0 100 100" preserveAspectRatio="none" style={rtl ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
            <polyline points={line} fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="timing-chart__labels">
          {labelIdx.map((i) => (
            <span key={i}>{hour(buckets[i].bucketStart)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
