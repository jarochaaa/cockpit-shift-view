import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '../cape/Tag';
import { Typography } from '../cape/Typography';
import { fetchNeedsAttention } from '../domain/mockApi';
import type { NeedsAttentionRow } from '../domain/types';

export function NeedsAttentionBox() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<NeedsAttentionRow[] | null>(null);

  useEffect(() => {
    fetchNeedsAttention().then(setRows);
  }, []);

  if (!rows) return null;

  if (rows.length === 0) {
    return <Typography variant="body-medium">{t('needsAttention.empty')}</Typography>;
  }

  return (
    <ul className="needs-attention-list">
      {rows.map((row) => (
        <li key={row.orderId} className="needs-attention-row">
          <div>
            <Typography variant="body-medium" as="span">
              #{row.externalOrderId}
            </Typography>{' '}
            <Typography variant="caption" as="span">
              {row.stage}
            </Typography>
          </div>
          <div className="needs-attention-row__meta">
            <Typography variant="body-small" as="span">
              {row.assignedPickerName ?? t('needsAttention.unassigned')}
            </Typography>
            {row.overdueByMinutes != null && (
              <Tag status="error" size="small">
                {t('needsAttention.overdueBy', { minutes: row.overdueByMinutes })}
              </Tag>
            )}
            {row.pfStatus === 'pending' && (
              <Tag status="warning" size="small">
                {t('needsAttention.pendingPf')}
              </Tag>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
