import { useTranslation } from 'react-i18next';
import { Indicator } from '../cape/Indicator';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { useMock } from '../cockpit/useMock';
import { fetchFloor, fetchStore } from '../domain/mockApi';
import type { Scenario } from '../domain/types';

// Header strip: fixed, never part of the draggable grid. Counts are derived
// from the same floor snapshot the Orders & pickers box reads, so they always agree.
export function Chrome({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation();
  const store = useMock(fetchStore, scenario);
  const floor = useMock(fetchFloor, scenario);

  const ready = store.status === 'ready' && floor.status === 'ready';
  const s = store.status === 'ready' ? store.data : null;
  const f = floor.status === 'ready' ? floor.data : null;
  const closed = s?.status === 'closed';

  const count = (stage: string) => f?.orders.filter((o) => o.stage === stage).length ?? 0;
  const late = f?.orders.filter((o) => o.lateByMinutes != null).length ?? 0;
  const pf = f?.orders.filter((o) => o.pfPending).length ?? 0;
  const idle = f?.pickers.filter((p) => p.status === 'idle').length ?? 0;

  return (
    <header className="chrome">
      <div className="chrome__row">
        <div className="chrome__title">
          <Typography variant="caption" as="span" className="chrome__crumb">
            {t('chrome.product')}
          </Typography>
          <Typography variant="display-small" as="h1">
            {s?.name ?? 'QA_001_Test_Store'}
          </Typography>
          {s && (
            <Tag status={closed ? 'disabled' : 'success'} size="small">
              {closed ? t('chrome.closed') : t('chrome.vendorsOpen', { open: s.vendorsOpen, total: s.vendorsTotal })}
            </Tag>
          )}
        </div>
        <div className="chrome__badges">
          {store.status === 'error' && <Tag status="error" size="small">{t('chrome.dataUnavailable')}</Tag>}
          {ready && late > 0 && <Tag status="error" size="small">{t('chrome.lateOrders', { count: late })}</Tag>}
          {ready && pf > 0 && <Tag status="warning" size="small">{t('chrome.pfPending', { count: pf })}</Tag>}
          {ready && idle > 0 && <Tag status="neutral" size="small">{t('chrome.idlePickers', { count: idle })}</Tag>}
        </div>
      </div>
      <div className="chrome__stages">
        <span className={`chrome__live${closed || !ready ? ' chrome__live--off' : ''}`}>
          <Indicator status={closed || !ready ? 'subtle' : 'error'} size="small" />
          {store.status === 'loading' ? t('state.loading') : closed || store.status === 'error' ? t('chrome.offline') : t('chrome.live')}
        </span>
        {(
          [
            ['unassigned', count('unassigned'), 'warning'],
            ['picking', count('picking'), 'info'],
            ['packing', count('packing'), 'branded'],
            ['readyForRider', f?.readyForRider ?? 0, 'success'],
          ] as const
        ).map(([key, value, tone]) => (
          <div key={key} className={`chrome__stage-cell chrome__stage-cell--${ready && value > 0 ? tone : 'empty'}`}>
            <Typography variant="display-small" as="span">
              {ready ? value : '–'}
            </Typography>
            <Typography variant="caption" as="span">
              {t(`chrome.${key}`)}
            </Typography>
          </div>
        ))}
      </div>
    </header>
  );
}
