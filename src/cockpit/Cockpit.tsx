import type { Dispatch, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../cape/Select';
import { SegmentedControl, SegmentedControlItem } from '../cape/SegmentedControl';
import { FloorBox } from '../boxes/FloorBox';
import { OrdersTimingBox } from '../boxes/OrdersTimingBox';
import { PickerAlertsBox } from '../boxes/PickerAlertsBox';
import { PickerTeamBox } from '../boxes/PickerTeamBox';
import { ShiftMetricsBox } from '../boxes/ShiftMetricsBox';
import { SkuAlertsBox } from '../boxes/SkuAlertsBox';
import { Chrome } from '../components/Chrome';
import { getBoxConfig } from '../domain/boxCatalog';
import { Box } from '../grid/Box';
import { BoxGrid } from '../grid/BoxGrid';
import { spanForRowSize } from '../grid/rowLayout';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { RTL_LOCALES } from '../i18n';
import type { Action, ChartStyle, FloorFilter, State, TimingRange } from '../state';

const FILTERS: FloorFilter[] = ['all', 'attention', 'unassigned', 'idle'];
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

/** The web product itself. Everything here follows the Cockpit language; the board around it stays English. */
export function Cockpit({ s, dispatch }: { s: State; dispatch: Dispatch<Action> }) {
  const { t } = useTranslation();
  // Drag and S/M/L only on the desktop layout; below 1100px the grid is one column.
  const interactive = useMediaQuery('(min-width: 1100px)');
  const orderedKeys = s.rows.flat();
  const spanOf = (key: string) => spanForRowSize(s.rows.find((r) => r.includes(key))?.length ?? 1);

  function body(key: string): ReactNode {
    switch (key) {
      case 'floor':
        return <FloorBox scenario={s.scenario} filter={s.filter} />;
      case 'shift_metrics':
        return <ShiftMetricsBox scenario={s.scenario} />;
      case 'orders_timing':
        return <OrdersTimingBox scenario={s.scenario} range={s.range} chartStyle={s.chartStyle} />;
      case 'picker_team':
        return <PickerTeamBox scenario={s.scenario} sort={s.sort} onSort={(k) => dispatch({ type: 'sort', key: k })} />;
      case 'sku_alerts':
        return <SkuAlertsBox scenario={s.scenario} />;
      case 'picker_alerts':
        return <PickerAlertsBox scenario={s.scenario} />;
      default:
        return null;
    }
  }

  function headerSlot(key: string): ReactNode {
    if (key === 'floor') {
      return (
        <SegmentedControl size="xsmall" value={s.filter} onChange={(v) => dispatch({ type: 'filter', filter: v as FloorFilter })} aria-label={t('box.floor.label')}>
          {FILTERS.map((f) => (
            <SegmentedControlItem key={f} value={f} onPointerDown={stop}>
              {t(`floor.filter.${f}`)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      );
    }
    if (key === 'orders_timing') {
      return (
        <>
          <SegmentedControl size="xsmall" value={s.chartStyle} onChange={(v) => dispatch({ type: 'chartStyle', chartStyle: v as ChartStyle })}>
            <SegmentedControlItem value="bars" onPointerDown={stop}>
              {t('ordersTiming.style.bars')}
            </SegmentedControlItem>
            <SegmentedControlItem value="pie" onPointerDown={stop}>
              {t('ordersTiming.style.pie')}
            </SegmentedControlItem>
          </SegmentedControl>
          <Select
            value={s.range}
            onPointerDown={stop}
            onChange={(v) => dispatch({ type: 'range', range: v as TimingRange })}
            options={[
              { value: '6h', label: t('ordersTiming.range.last6h') },
              { value: '12h', label: t('ordersTiming.range.last12h') },
              { value: '24h', label: t('ordersTiming.range.last24h') },
            ]}
          />
        </>
      );
    }
    return undefined;
  }

  return (
    <div className="cockpit" data-theme="cape-light-b2b" dir={RTL_LOCALES.has(s.lang) ? 'rtl' : 'ltr'} lang={s.lang}>
      <Chrome scenario={s.scenario} />
      <main className="cockpit__main">
        <BoxGrid boxKeys={orderedKeys} onReorder={(active, over) => dispatch({ type: 'move', active, over })}>
          {orderedKeys.map((key) => (
            <Box
              key={key}
              boxKey={key}
              title={t(getBoxConfig(key).labelI18nKey)}
              colSpan={spanOf(key)}
              onColSpanChange={(size) => dispatch({ type: 'resize', box: key, size })}
              headerRightSlot={headerSlot(key)}
              interactive={interactive}
            >
              {body(key)}
            </Box>
          ))}
        </BoxGrid>
      </main>
    </div>
  );
}
