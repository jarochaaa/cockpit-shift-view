import { useTranslation } from 'react-i18next';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { BoxState, EmptyState } from '../cockpit/BoxState';
import { useMock } from '../cockpit/useMock';
import { fetchPickerAlerts } from '../domain/mockApi';
import type { Scenario } from '../domain/types';

export function PickerAlertsBox({ scenario }: { scenario: Scenario }) {
  const { t } = useTranslation();
  const alerts = useMock(fetchPickerAlerts, scenario);
  return (
    <BoxState state={alerts}>
      {(rows) => (
        <div>
          <Typography variant="caption">{t('placeholder.previewData')}</Typography>
          {rows.length === 0 ? (
            <EmptyState text={t('pickerAlerts.empty')} />
          ) : (
            <ul className="alert-list">
              {rows.map((row) => (
                <li key={`${row.pickerId}-${row.alertType}`} className={`alert-row alert-row--${row.severity}`}>
                  <div className="alert-row__main">
                    <Typography variant="subtitle-medium" as="span">
                      {row.displayName}
                    </Typography>
                    <Typography variant="caption" as="span">
                      {t(`pickerAlerts.type.${row.alertType}`)}
                    </Typography>
                  </div>
                  <div className="alert-row__meta">
                    <Typography variant="body-small" as="span">
                      {t(`pickerAlerts.detail.${row.alertType}`, { value: row.value, threshold: row.threshold })}
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
