import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../cape/Typography';
import type { Loaded } from './useMock';

/** One loading skeleton and one error message for every box, so they look identical everywhere. */
export function BoxState<T>({ state, lines = 3, children }: { state: Loaded<T>; lines?: number; children: (data: T) => ReactNode }) {
  const { t } = useTranslation();
  if (state.status === 'loading') {
    return (
      <div className="box-skeleton" role="status" aria-label={t('state.loading')}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="box-skeleton__line" />
        ))}
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="box-message box-message--error" role="alert">
        <Typography variant="body-medium">{t('state.error')}</Typography>
      </div>
    );
  }
  return <>{children(state.data)}</>;
}

/** Shared empty state: same component and wording pattern wherever a box has nothing to show. */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="box-message">
      <Typography variant="body-medium">{text}</Typography>
    </div>
  );
}
