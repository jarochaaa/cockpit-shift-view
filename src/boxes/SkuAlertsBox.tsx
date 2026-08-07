import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { fetchSkuAlerts } from '../domain/mockApi';
import type { SkuAlertRow } from '../domain/types';

export function SkuAlertsBox() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SkuAlertRow[] | null>(null);

  useEffect(() => {
    fetchSkuAlerts().then(setRows);
  }, []);

  if (!rows) return null;

  return (
    <div>
      <Typography variant="caption">{t('placeholder.previewData')}</Typography>
      <ul className="needs-attention-list">
        {rows.map((row) => (
          <li key={row.sku} className="needs-attention-row">
            <div>
              <Typography variant="body-medium" as="span">
                {row.name}
              </Typography>{' '}
              <Typography variant="caption" as="span">
                {row.sku}
              </Typography>
            </div>
            <div className="needs-attention-row__meta">
              <Typography variant="body-small" as="span">
                {t('skuAlerts.soh', { soh: row.soh, threshold: row.threshold })}
              </Typography>
              <Tag status={row.severity} size="small">
                {t(`skuAlerts.severity.${row.severity}`)}
              </Tag>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
