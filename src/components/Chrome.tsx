import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Indicator } from '../cape/Indicator';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { fetchChromeStageCounts, fetchStore } from '../domain/mockApi';
import type { ChromeStageCounts, Store } from '../domain/types';

export function Chrome() {
  const { t } = useTranslation();
  const [store, setStore] = useState<Store | null>(null);
  const [counts, setCounts] = useState<ChromeStageCounts | null>(null);

  useEffect(() => {
    fetchStore().then(setStore);
    fetchChromeStageCounts().then(setCounts);
  }, []);

  if (!store || !counts) return null;

  return (
    <header className="chrome">
      <div className="chrome__row">
        <div className="chrome__title">
          <Typography variant="subtitle-large" as="h1">
            {store.name}
          </Typography>
          <Tag status={store.status === 'open' ? 'success' : 'neutral'} size="small">
            {store.vendorsOpen}/{store.vendorsTotal} open
          </Tag>
        </div>
        <div className="chrome__badges">
          {counts.idlePickers > 0 && <Tag status="neutral" size="small">{t('chrome.idlePickers', { count: counts.idlePickers })}</Tag>}
          {counts.lateOrders > 0 && <Tag status="error" size="small">{t('chrome.lateOrders', { count: counts.lateOrders })}</Tag>}
        </div>
      </div>
      <div className="chrome__stages">
        <span className="chrome__live">
          <Indicator status="error" size="small" />
          {t('chrome.live')}
        </span>
        {(
          [
            ['unassigned', counts.unassigned, 'warning'],
            ['picking', counts.picking, 'info'],
            ['packing', counts.packing, 'branded'],
            ['readyForRider', counts.readyForRider, 'success'],
          ] as const
        ).map(([key, value, tone]) => (
          <div key={key} className={`chrome__stage-cell chrome__stage-cell--${tone}`}>
            <Typography variant="display-small" as="span">
              {value}
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
