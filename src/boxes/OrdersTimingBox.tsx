import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BoxState } from '../cockpit/BoxState';
import { useMock } from '../cockpit/useMock';
import { fetchOrderTiming } from '../domain/mockApi';
import type { OrderTimingBucket, Scenario } from '../domain/types';
import type { ChartStyle, TimingRange } from '../state';

const RANGE_HOURS: Record<TimingRange, number> = { '6h': 6, '12h': 12, '24h': 24 };

// Series colors come from the chart token set: 3 stages + 1 completed-orders line.
const COLOR_ASSIGNMENT = 'var(--cp-chart-color-info-medium)';
const COLOR_PICKING = 'var(--cp-chart-color-branded-highest)';
const COLOR_PACKING = 'var(--cp-chart-color-branded-medium)';
const COLOR_COMPLETED_LINE = 'var(--cp-text-color-primary)';

// Recharts renders plain SVG <text> with no inherited font.
const FONT = "Figtree, 'Noto Sans Arabic', var(--cp-font-fallback)";
const AXIS_TICK_STYLE = { fontSize: 11, fontFamily: FONT, fill: 'var(--cp-text-color-tertiary)' };
const LEGEND_STYLE = { fontSize: 12, fontFamily: FONT, color: 'var(--cp-text-color-secondary)' };

function Chart({ buckets, range, chartStyle }: { buckets: OrderTimingBucket[]; range: TimingRange; chartStyle: ChartStyle }) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === 'rtl';
  const minutes = (s: number) => Number((s / 60).toFixed(1));

  const visible = useMemo(
    () =>
      buckets.slice(-RANGE_HOURS[range]).map((b) => ({
        label: new Date(b.bucketStart).toLocaleTimeString(i18n.language === 'ar' ? 'ar-u-nu-latn' : i18n.language, { hour: '2-digit' }),
        assignment: minutes(b.assignmentAvgSeconds),
        picking: minutes(b.pickingAvgSeconds),
        packing: minutes(b.packingAvgSeconds),
        completed: b.completedCount,
      })),
    [buckets, range, i18n.language],
  );

  if (chartStyle === 'pie') {
    const totals = visible.reduce((acc, b) => ({ assignment: acc.assignment + b.assignment, picking: acc.picking + b.picking, packing: acc.packing + b.packing }), { assignment: 0, picking: 0, packing: 0 });
    const pieData = [
      { key: 'assignment', label: t('stage.assignedIn'), value: totals.assignment, color: COLOR_ASSIGNMENT },
      { key: 'picking', label: t('stage.pickedIn'), value: totals.picking, color: COLOR_PICKING },
      { key: 'packing', label: t('stage.packedIn'), value: totals.packing, color: COLOR_PACKING },
    ];
    return (
      <div className="orders-timing-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2} isAnimationActive={false}>
              {pieData.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} formatter={(v) => `${Number(v).toFixed(1)}m`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // RTL mirrors the time axis and swaps the two Y axes.
  return (
    <div className="orders-timing-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={visible} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-border-color-normal)" vertical={false} />
          <XAxis dataKey="label" reversed={rtl} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis yAxisId="minutes" orientation={rtl ? 'right' : 'left'} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} unit="m" />
          <YAxis yAxisId="orders" orientation={rtl ? 'left' : 'right'} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
          <Bar yAxisId="minutes" dataKey="assignment" name={t('stage.assignedIn')} stackId="stage" fill={COLOR_ASSIGNMENT} isAnimationActive={false} />
          <Bar yAxisId="minutes" dataKey="picking" name={t('stage.pickedIn')} stackId="stage" fill={COLOR_PICKING} isAnimationActive={false} />
          <Bar yAxisId="minutes" dataKey="packing" name={t('stage.packedIn')} stackId="stage" fill={COLOR_PACKING} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="orders" type="monotone" dataKey="completed" name={t('ordersTiming.completed')} stroke={COLOR_COMPLETED_LINE} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersTimingBox({ scenario, range, chartStyle }: { scenario: Scenario; range: TimingRange; chartStyle: ChartStyle }) {
  const timing = useMock(fetchOrderTiming, scenario);
  return <BoxState state={timing} lines={5}>{(buckets) => <Chart buckets={buckets} range={range} chartStyle={chartStyle} />}</BoxState>;
}
