import { useLayoutEffect, useRef, useState } from 'react';
import { IconButton } from '../../cape/IconButton';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '../../cape/Tag';
import { Button } from '../../cape/Button';
import { CapeIcon } from '../legacy/icons';
import { useMobile } from '../v2/useMobile';
import { FilterChips } from './FilterChips';
import type { FilterChip } from './FilterChips';
import './monitoring.css';

export type AttentionTone = 'error' | 'warning' | 'info' | 'success';
export interface AttentionItem {
  key: string;
  tone: AttentionTone;
  title: ReactNode;
  tag: string;
  meta: ReactNode;
  strong: ReactNode;
  onClick?: () => void;
}

/**
 * Needs attention column (Figma 72:1672), shared by Multi-Store Monitoring and the store view.
 * It fills the visible height of the cockpit frame, scrolls inside itself, collapses to a pulsing rail
 * while the page scrolls down and opens again when the page is back at the top.
 */
export function AttentionPanel({ title, titleAddon, note, items, empty, side = 'end' }: { side?: 'start' | 'end'; title: string; titleAddon?: ReactNode; note?: ReactNode; items: AttentionItem[]; empty: string }) {
  const { t } = useTranslation();
  const mobile = useMobile();
  const [sheet, setSheet] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [sev, setSev] = useState<AttentionTone | null>(null);
  const live = items.filter((c) => !dismissed.has(c.key));
  const countOf = (tn: AttentionTone) => live.filter((c) => c.tone === tn).length;
  items = sev ? live.filter((c) => c.tone === sev) : live;
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const set = setCollapsed;

  useLayoutEffect(() => {
    const el = ref.current;
    const scroller = el?.closest('.cockpit') as HTMLElement | null;
    if (mobile || !el || !scroller) return;
    const gap = 16;
    scroller.style.overflowAnchor = 'none';
    const fit = () => {
      const sr = scroller.getBoundingClientRect();
      const top = Math.max(el.getBoundingClientRect().top, sr.top + gap);
      el.style.height = `${Math.max(240, sr.bottom - gap - top)}px`;
    };
    // The panel only follows the page height; it opens and closes with its own arrow, never by scrolling.
    const onScroll = fit;
    fit();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', fit);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', fit);
    };
  }, [mobile]);

  const card = (c: AttentionItem) => (
    <li key={c.key}>
      <div className={`msm-acard msm-acard--${c.tone}`}>
        <span className="msm-acard__head">
          <Tag size="small" status={c.tone}>
            {c.tag}
          </Tag>
          <span className="msm-acard__time">{c.strong}</span>
        </span>
        <span className="msm-acard__text">
          <b className="msm-acard__title">{c.title}</b>
          <span className="msm-acard__meta">{c.meta}</span>
        </span>
        {(c.tone === 'info' || c.onClick) && (
          <span className="msm-acard__actions">
            {c.tone === 'info' && (
              <Button size="medium" variant="secondary" className="msm-abtn msm-abtn--ghost" onClick={() => setDismissed(new Set(dismissed).add(c.key))}>
                {t('msm.review')}
              </Button>
            )}
            {c.onClick && (
              <Button size="medium" variant="secondary" className="msm-abtn msm-abtn--ghost" onClick={() => (setSheet(false), c.onClick?.())}>
                {t('msm.solve')}
              </Button>
            )}
          </span>
        )}
      </div>
    </li>
  );

  const chips: FilterChip[] = [
    { key: 'all', tone: 'all', icon: 'dashboard', label: t('msm.status.all'), count: live.length },
    { key: 'error', tone: 'error', icon: 'flag', label: t('msm.status.critical'), count: countOf('error') },
    { key: 'warning', tone: 'warning', icon: 'trending', label: t('msm.status.risk'), count: countOf('warning') },
    { key: 'info', tone: 'info', icon: 'info', label: t('msm.legend.info'), count: countOf('info') },
  ];
  const legend = (
    <div className="msm-legend">
      <FilterChips chips={chips} value={sev ?? 'all'} onChange={(k) => setSev(k === 'all' ? null : (k as AttentionTone))} label={t('msm.legend.label', { defaultValue: 'Filter by severity' })} />
    </div>
  );

  if (mobile)
    return (
      <>
        <button type="button" className="msm-fab" aria-expanded={sheet} onClick={() => setSheet(!sheet)}>
          <span>{title}</span>
          <span className="msm-fab__n">{items.length}</span>
        </button>
        {sheet && (
          <>
            <div className="msm-sheet-backdrop" onClick={() => setSheet(false)} aria-hidden />
            <section className="msm-sheet" role="dialog" aria-label={title}>
              <span className="msm-sheet__grab" aria-hidden />
              <div className="msm-sheet__head">
                <h2>
                  {title} {titleAddon}
                </h2>
                <Tag size="small" status="error" className="msm-attention__count">
                  {t('msm.open', { n: items.length })}
                </Tag>
                <IconButton className="msm-attention__collapse" aria-label={t('msm.collapse')} onClick={() => setSheet(false)}>
                  <CapeIcon name="close" size={20} />
                </IconButton>
              </div>
              {note && <p className="msm-attention__note">{note}</p>}
              {legend}
              <ul className="msm-sheet__list">
                {items.map(card)}
                {items.length === 0 && <li className="msm-attention__note">{empty}</li>}
              </ul>
            </section>
          </>
        )}
      </>
    );

  return (
    <div className={`msm-side${collapsed ? ' msm-side--collapsed' : ''}${side === 'start' ? ' msm-side--start' : ''}`} ref={ref}>
      {collapsed ? (
        <button type="button" className="msm-attention-rail" aria-label={t('msm.expand')} title={t('msm.expand')} onClick={() => set(false)}>
          <CapeIcon name="chevronLeft" size={20} className={side === 'start' ? 'v2-rot' : 'msm-flip'} />
          <span className="msm-attention-rail__n">{items.length}</span>
          <span className="msm-attention-rail__label">{title}</span>
        </button>
      ) : (
        <aside className="msm-attention" aria-label={title}>
          <div className="msm-attention__head">
            <h2>
              {title} {titleAddon}
            </h2>
            <Tag size="small" status="error" className="msm-attention__count">
              {t('msm.open', { n: items.length })}
            </Tag>
            {note && (
              <IconButton className="msm-attention__info msm-edit" aria-label={String(note)} data-tip={String(note)}>
                <CapeIcon name="info" size={20} />
              </IconButton>
            )}
            <IconButton className="msm-attention__collapse msm-edit" aria-label={t('msm.collapse')} data-tip={t('msm.collapse')} onClick={() => set(true)}>
              <CapeIcon name="chevronLeft" size={20} className={side === 'start' ? 'msm-flip' : 'v2-rot'} />
            </IconButton>
          </div>
          {legend}
          <ul className="msm-attention__list">
            {items.map(card)}
            {items.length === 0 && <li className="msm-attention__note">{empty}</li>}
          </ul>
        </aside>
      )}
    </div>
  );
}
