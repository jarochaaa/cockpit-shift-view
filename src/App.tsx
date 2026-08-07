import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from './grid/Box';
import { BoxGrid } from './grid/BoxGrid';
import { useDashboardLayout } from './grid/useDashboardLayout';
import { Chrome } from './components/Chrome';
import { NeedsAttentionBox } from './boxes/NeedsAttentionBox';
import { PeopleTasksBox } from './boxes/PeopleTasksBox';
import { ShiftMetricsBox } from './boxes/ShiftMetricsBox';
import { OrdersTimingBox } from './boxes/OrdersTimingBox';
import type { ChartStyle, TimingRange } from './boxes/OrdersTimingBox';
import { PickerTeamBox } from './boxes/PickerTeamBox';
import { SkuAlertsBox } from './boxes/SkuAlertsBox';
import { PickerAlertsBox } from './boxes/PickerAlertsBox';
import { Select } from './cape/Select';
import { SegmentedControl, SegmentedControlItem } from './cape/SegmentedControl';
import { getBoxConfig } from './domain/boxCatalog';

// No auth flow in Layer 2 scope (IA §7) — RBAC is modeled in the schema for
// later, not exposed here. Fixed demo identity for the prototype.
const DEMO_USER_ID = 'demo-user';
const DEMO_STORE_ID = 'store_1';

function App() {
  const { t } = useTranslation();
  const { orderedKeys, setColSpan, reorder, resolvedColSpan } = useDashboardLayout(DEMO_USER_ID, DEMO_STORE_ID);
  const [range, setRange] = useState<TimingRange>('24h');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bars');

  function renderBody(boxKey: string): ReactNode {
    switch (boxKey) {
      case 'needs_attention':
        return <NeedsAttentionBox />;
      case 'people_tasks':
        return <PeopleTasksBox />;
      case 'shift_metrics':
        return <ShiftMetricsBox />;
      case 'orders_timing':
        return <OrdersTimingBox range={range} chartStyle={chartStyle} />;
      case 'picker_team':
        return <PickerTeamBox />;
      case 'sku_alerts':
        return <SkuAlertsBox />;
      case 'picker_alerts':
        return <PickerAlertsBox />;
      default:
        return null;
    }
  }

  function renderHeaderRightSlot(boxKey: string): ReactNode {
    if (boxKey !== 'orders_timing') return undefined;
    return (
      <>
        <SegmentedControl size="xsmall" value={chartStyle} onChange={(v) => setChartStyle(v as ChartStyle)}>
          <SegmentedControlItem value="bars" onPointerDown={(e) => e.stopPropagation()}>
            {t('ordersTimingChart.style.bars')}
          </SegmentedControlItem>
          <SegmentedControlItem value="pie" onPointerDown={(e) => e.stopPropagation()}>
            {t('ordersTimingChart.style.pie')}
          </SegmentedControlItem>
        </SegmentedControl>
        <Select
          value={range}
          onChange={(v) => setRange(v as TimingRange)}
          options={[
            { value: '6h', label: t('ordersTiming.range.last6h') },
            { value: '12h', label: t('ordersTiming.range.last12h') },
            { value: '24h', label: t('ordersTiming.range.last24h') },
          ]}
        />
      </>
    );
  }

  return (
    <div className="app">
      <Chrome />
      <main>
        <BoxGrid boxKeys={orderedKeys} onReorder={reorder}>
          {orderedKeys.map((boxKey) => {
            const config = getBoxConfig(boxKey);
            return (
              <Box
                key={boxKey}
                boxKey={boxKey}
                title={t(config.labelI18nKey)}
                colSpan={resolvedColSpan(boxKey)}
                onColSpanChange={(span) => setColSpan(boxKey, span)}
                headerRightSlot={renderHeaderRightSlot(boxKey)}
              >
                {renderBody(boxKey)}
              </Box>
            );
          })}
        </BoxGrid>
      </main>
    </div>
  );
}

export default App;
