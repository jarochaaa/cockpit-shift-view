import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchOrderTiming } from '../domain/mockApi';
import type { OrderTimingBucket } from '../domain/types';

export type TimingRange = '6h' | '12h' | '24h';
export type ChartStyle = 'bars' | 'pie';

const RANGE_HOURS: Record<TimingRange, number> = { '6h': 6, '12h': 12, '24h': 24 };

// Chart series colors come straight from the feedback token set (see
// Cockpit-Shift-View-Visual-Spec-v1.md §5) — capped at the 3 stages + 1
// completed-count line that actually exist, never more just to look full.
const COLOR_ASSIGNMENT = 'var(--cp-feedback-color-info-accent-low)';
const COLOR_PICKING = 'var(--cp-action-color-branded-primary-enabled)';
const COLOR_PACKING = 'var(--cp-feedback-color-branded-low)';
const COLOR_COMPLETED_LINE = 'var(--cp-text-color-primary)';

// Recharts renders plain SVG <text> with no inherited font — has to be set
// explicitly to match the Roboto the rest of the UI loads (index.html).
const AXIS_TICK_STYLE = { fontSize: 11, fontFamily: 'Roboto, var(--cp-font-fallback)', fill: 'var(--cp-text-color-tertiary)' };

export function OrdersTimingBox({ range, chartStyle }: { range: TimingRange; chartStyle: ChartStyle }) {
  const { t } = useTranslation();
  const [buckets, setBuckets] = useState<OrderTimingBucket[] | null>(null);

  useEffect(() => {
    fetchOrderTiming().then(setBuckets);
  }, []);

  const visible = useMemo(() => {
    if (!buckets) return [];
    const hours = RANGE_HOURS[range];
    return buckets.slice(-hours).map((b) => ({
      ...b,
      label: new Date(b.bucketStart).toLocaleTimeString([], { hour: '2-digit' }),
    }));
  }, [buckets, range]);

  const pieData = useMemo(() => {
    if (visible.length === 0) return [];
    const totals = visible.reduce(
      (acc, b) => ({
        assignment: acc.assignment + b.assignmentAvgSeconds,
        picking: acc.picking + b.pickingAvgSeconds,
        packing: acc.packing + b.packingAvgSeconds,
      }),
      { assignment: 0, picking: 0, packing: 0 },
    );
    return [
      { key: 'assignment', label: t('ordersTimingChart.pieLegend.assignment'), value: totals.assignment, color: COLOR_ASSIGNMENT },
      { key: 'picking', label: t('ordersTimingChart.pieLegend.picking'), value: totals.picking, color: COLOR_PICKING },
      { key: 'packing', label: t('ordersTimingChart.pieLegend.packing'), value: totals.packing, color: COLOR_PACKING },
    ];
  }, [visible, t]);

  if (!buckets) return null;

  if (chartStyle === 'pie') {
    return (
      <div className="orders-timing-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {pieData.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontFamily: 'Roboto, var(--cp-font-fallback)', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="orders-timing-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-border-color-normal)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis yAxisId="seconds" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis yAxisId="orders" orientation="right" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <Bar yAxisId="seconds" dataKey="assignmentAvgSeconds" stackId="stage" fill={COLOR_ASSIGNMENT} />
          <Bar yAxisId="seconds" dataKey="pickingAvgSeconds" stackId="stage" fill={COLOR_PICKING} />
          <Bar yAxisId="seconds" dataKey="packingAvgSeconds" stackId="stage" fill={COLOR_PACKING} radius={[4, 4, 0, 0]} />
          <Line yAxisId="orders" type="monotone" dataKey="completedCount" stroke={COLOR_COMPLETED_LINE} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
