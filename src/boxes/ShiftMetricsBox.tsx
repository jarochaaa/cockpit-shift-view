import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../cape/Typography';
import { fetchShiftMetrics } from '../domain/mockApi';
import type { ShiftMetrics } from '../domain/types';
import { formatPercent, formatSeconds, minutesSince } from '../domain/format';

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="shift-metrics-cell">
      <Typography variant="display-large" className="metric-hero-value">
        {value}
      </Typography>
      <Typography variant="body-small">{label}</Typography>
    </div>
  );
}

export function ShiftMetricsBox() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<ShiftMetrics | null>(null);

  useEffect(() => {
    fetchShiftMetrics().then(setMetrics);
  }, []);

  if (!metrics) return null;

  return (
    <div>
      <div className="shift-metrics-grid">
        <Cell value={String(metrics.successfulOrders)} label={t('shiftMetrics.successfulOrders')} />
        <Cell value={formatSeconds(metrics.avgAssignmentSeconds + metrics.avgPickingSeconds + metrics.avgPackingSeconds)} label={t('shiftMetrics.avgPrepTime')} />
        <Cell value={formatSeconds(metrics.avgAssignmentSeconds)} label={t('shiftMetrics.assignment')} />
        <Cell value={formatSeconds(metrics.avgPickingSeconds)} label={t('shiftMetrics.picking')} />
        <Cell value={formatSeconds(metrics.avgPackingSeconds)} label={t('shiftMetrics.packing')} />
        <Cell value={formatPercent(metrics.pfr)} label={t('shiftMetrics.pfr')} />
      </div>
      <Typography variant="caption">{t('shiftMetrics.updated', { minutes: minutesSince(metrics.updatedAt) })}</Typography>
    </div>
  );
}
