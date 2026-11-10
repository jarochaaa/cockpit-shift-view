import { useTranslation } from 'react-i18next';
import { Avatar } from '../cape/Avatar';
import { Tag } from '../cape/Tag';
import type { Store } from '../domain/types';
import type { Loaded } from './useMock';

/** Top bar: brand, breadcrumb to the store and the vendors tag. Fixed, never part of the board. */
export function Header({ store }: { store: Loaded<Store> }) {
  const { t } = useTranslation();
  const s = store.status === 'ready' ? store.data : null;
  const closed = s?.status === 'closed';

  return (
    <header className="topbar">
      <span className="topbar__brand">talabat</span>
      <nav className="topbar__crumbs" aria-label={t('header.backToStores')}>
        <span className="topbar__crumb">{t('header.product')}</span>
        <span className="topbar__sep" aria-hidden>
          /
        </span>
        <h1 className="topbar__store">{s?.name ?? 'QA_001_Test_Store'}</h1>
      </nav>
      {s && (
        <Tag status={closed ? 'disabled' : 'success'} size="small">
          {closed ? t('header.closed') : t('header.vendorsOpen', { open: s.vendorsOpen, total: s.vendorsTotal })}
        </Tag>
      )}
      <span className="topbar__spacer" />
      <span className="topbar__meta">{t('header.country')}</span>
      <span className="topbar__meta">{t('header.help')}</span>
      <Avatar size="small" initials="A" title={t('header.account')} />
    </header>
  );
}
