import { useTranslation } from 'react-i18next';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { BoxState, EmptyState } from '../cockpit/BoxState';
import { useMock } from '../cockpit/useMock';
import { fetchSkuAlerts } from '../domain/mockApi';
import type { Scenario } from '../domain/types';

export function SkuAlertsBox({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation();
  const alerts = useMock(fetchSkuAlerts, scenario);
  return (
    <BoxState state={alerts}>
      {(rows) => (
        <div>
          <Typography variant="caption">{t('placeholder.previewData')}</Typography>
          {rows.length === 0 ? (
            <EmptyState text={t('skuAlerts.empty')} />
          ) : (
            <ul className="alert-list">
              {rows.map((row) => (
                <li key={row.sku} className={`alert-row alert-row--${row.severity}`}>
                  <div className="alert-row__main">
                    <Typography variant="subtitle-medium" as="span">
                      {row.name}
                    </Typography>
                    <Typography variant="caption" as="span">
                      {row.sku}
                    </Typography>
                  </div>
                  <div className="alert-row__meta">
                    <Typography variant="body-small" as="span">
                      {t('skuAlerts.soh', { soh: row.soh, threshold: row.threshold })}
                    </Typography>
                    <Tag status={row.severity} size="small">
                      {t(`alerts.severity.${row.severity}`)}
                    </Tag>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </BoxState>
  );
}
