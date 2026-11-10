import { useTranslation } from 'react-i18next';
import { Typography } from '../cape/Typography';
import { BoxState } from '../cockpit/BoxState';
import { useMock } from '../cockpit/useMock';
import { fetchShiftMetrics } from '../domain/mockApi';
import type { Scenario } from '../domain/types';
import { formatPercent, formatSeconds, minutesSince } from '../domain/format';

function Cell({ value, label, detail, hero }: { value: string; label: string; detail?: string; hero?: boolean }) {
  return (
    <div className="shift-metrics-cell">
      <Typography variant="display-large" className={hero ? 'metric-hero-value' : 'metric-value'}>
        {value}
      </Typography>
      <Typography variant="subtitle-medium">{label}</Typography>
      {detail && <Typography variant="body-small">{detail}</Typography>}
    </div>
  );
}

// Ratios, not only raw counts (critique Aug 17, item 5): success as a share of
// received orders, each prep stage as a share of the whole prep time.
export function ShiftMetricsBox({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation();
  const metrics = useMock(fetchShiftMetrics, scenario);
  return (
    <BoxState state={metrics} lines={3}>
      {(m) => {
        const prep = m.avgAssignmentSeconds + m.avgPickingSeconds + m.avgPackingSeconds;
        const share = (s: number) => t('shiftMetrics.shareOfPrep', { share: Math.round((s / prep) * 100) });
        return (
          <div>
            <div className="shift-metrics-grid">
              <Cell hero value={String(m.successfulOrders)} label={t('shiftMetrics.successfulOrders')} detail={t('shiftMetrics.ofReceived', { share: formatPercent(m.successfulOrders / m.receivedOrders, 1), received: m.receivedOrders })} />
              <Cell hero value={formatPercent(m.issueRate)} label={t('shiftMetrics.issueRate')} />
              <Cell hero value={formatSeconds(prep)} label={t('shiftMetrics.prepTime')} />
              <Cell value={formatSeconds(m.avgAssignmentSeconds)} label={t('stage.assignedIn')} detail={share(m.avgAssignmentSeconds)} />
              <Cell value={formatSeconds(m.avgPickingSeconds)} label={t('stage.pickedIn')} detail={share(m.avgPickingSeconds)} />
              <Cell value={formatSeconds(m.avgPackingSeconds)} label={t('stage.packedIn')} detail={share(m.avgPackingSeconds)} />
              <Cell value={formatPercent(m.pfr)} label={t('shiftMetrics.pfr')} />
            </div>
            <Typography variant="caption">{t('shiftMetrics.updated', { minutes: minutesSince(m.updatedAt) })}</Typography>
          </div>
        );
      }}
    </BoxState>
  );
}
