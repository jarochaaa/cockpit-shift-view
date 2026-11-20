import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '../../cape/Tag';
import { CapeIcon } from '../legacy/icons';
import { useMobile } from '../v2/useMobile';
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
export function AttentionPanel({ title, titleAddon, note, items, empty }: { title: string; titleAddon?: ReactNode; note?: ReactNode; items: AttentionItem[]; empty: string }) {
  const { t } = useTranslation();
  const mobile = useMobile();
  const [sheet, setSheet] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = useRef(false);
  const set = (v: boolean) => {
    cur.current = v;
    setCollapsed(v);
  };

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
    let last = scroller.scrollTop;
    let lockedUntil = 0;
    // Direction is judged on the distance travelled since the last decision, so a slow scroll still adds up.
    // After each toggle the layout reflows (the table changes width), which can nudge scrollTop on its own;
    // those nudges are ignored for a moment so the panel never flips back and forth.
    const toggle = (next: boolean) => {
      if (next === cur.current) return;
      set(next);
      lockedUntil = performance.now() + 350;
    };
    const onScroll = () => {
      const st = scroller.scrollTop;
      fit();
      if (performance.now() < lockedUntil) {
        last = st;
        return;
      }
      if (st < 40) {
        toggle(false);
        last = st;
        return;
      }
      // Scrolling down collapses it; it only opens again once the page is back at the top.
      if (st - last > 24) toggle(true);
      else if (st - last < -24) last = st;
      else return;
      last = st;
    };
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
      <div
        className={`msm-acard msm-acard--${c.tone}${c.onClick ? ' is-button' : ''}`}
        role={c.onClick ? 'button' : undefined}
        tabIndex={c.onClick ? 0 : undefined}
        onClick={c.onClick ? () => (setSheet(false), c.onClick?.()) : undefined}
        onKeyDown={(e) => c.onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSheet(false), c.onClick())}
      >
        <span className="msm-acard__top">
          <b>{c.title}</b>
          <Tag size="small" status={c.tone}>
            {c.tag}
          </Tag>
        </span>
        <span className="msm-acard__meta">{c.meta}</span>
        <span className="msm-acard__strong">{c.strong}</span>
        {c.onClick && <CapeIcon name="chevronRight" size={16} className="msm-acard__chev" />}
      </div>
    </li>
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
                <button type="button" className="msm-attention__collapse" aria-label={t('msm.collapse')} onClick={() => setSheet(false)}>
                  <CapeIcon name="close" size={20} />
                </button>
              </div>
              {note && <p className="msm-attention__note">{note}</p>}
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
    <div className={`msm-side${collapsed ? ' msm-side--collapsed' : ''}`} ref={ref}>
      {collapsed ? (
        <button type="button" className="msm-attention-rail" aria-label={t('msm.expand')} title={t('msm.expand')} onClick={() => set(false)}>
          <CapeIcon name="doubleChevronLeft" size={20} className="msm-flip" />
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
            <button type="button" className="msm-attention__collapse" aria-label={t('msm.collapse')} title={t('msm.collapse')} onClick={() => set(true)}>
              <CapeIcon name="doubleChevronLeft" size={20} className="v2-rot" />
            </button>
          </div>
          {note && <p className="msm-attention__note">{note}</p>}
          <ul className="msm-attention__list">
            {items.map((c) => (
              <li key={c.key}>
                <div
                  className={`msm-acard msm-acard--${c.tone}${c.onClick ? ' is-button' : ''}`}
                  role={c.onClick ? 'button' : undefined}
                  tabIndex={c.onClick ? 0 : undefined}
                  onClick={c.onClick}
                  onKeyDown={(e) => c.onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), c.onClick())}
                >
                  <span className="msm-acard__top">
                    <b>{c.title}</b>
                    <Tag size="small" status={c.tone}>
                      {c.tag}
                    </Tag>
                  </span>
                  <span className="msm-acard__meta">{c.meta}</span>
                  <span className="msm-acard__strong">{c.strong}</span>
                  {c.onClick && <CapeIcon name="chevronRight" size={16} className="msm-acard__chev" />}
                </div>
              </li>
            ))}
            {items.length === 0 && <li className="msm-attention__note">{empty}</li>}
          </ul>
        </aside>
      )}
    </div>
  );
}
