import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { fetchPickerAlerts } from '../domain/mockApi';
import type { PickerAlertRow } from '../domain/types';

export function PickerAlertsBox() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PickerAlertRow[] | null>(null);

  useEffect(() => {
    fetchPickerAlerts().then(setRows);
  }, []);

  if (!rows) return null;

  return (
    <div>
      <Typography variant="caption">{t('placeholder.previewData')}</Typography>
      <ul className="needs-attention-list">
        {rows.map((row, index) => (
          <li key={`${row.pickerId}-${index}`} className="needs-attention-row">
            <div>
              <Typography variant="body-medium" as="span">
                {row.displayName}
              </Typography>{' '}
              <Typography variant="caption" as="span">
                {row.alertType}
              </Typography>
            </div>
            <div className="needs-attention-row__meta">
              <Typography variant="body-small" as="span">
                {row.detail}
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
