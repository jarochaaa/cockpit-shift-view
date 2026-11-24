import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../prod/Drawers';
import { CapeIcon } from '../legacy/icons';
import { BLOCKS, type EditBlock } from './layout';
import { CAT } from '../../domain/metrics';

/**
 * Pencil next to a block title: opens the list of data points the block can print, as toggles.
 * A block that fits N data points lets N be on; the rest stay off until one is turned off.
 */
export function EditData({ block, title, selected, onChange, label, hint, available }: { block: EditBlock; title: string; selected: string[]; onChange: (keys: string[]) => void; label: (k: string) => string; hint?: (k: string) => string | undefined; available?: (k: string) => boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const cfg = BLOCKS[block];
  const needle = q.trim().toLowerCase();
  const options = cfg.options.filter((k) => (!available || available(k)) && (!needle || `${label(k)} ${CAT[k] ?? ''} ${hint?.(k) ?? ''}`.toLowerCase().includes(needle)));
  const full = selected.length >= cfg.capacity;
  const groups = options.reduce<{ head: string; keys: string[] }[]>((acc, k) => {
    const last = acc[acc.length - 1];
    if (last && last.head === CAT[k]) last.keys.push(k);
    else acc.push({ head: CAT[k], keys: [k] });
    return acc;
  }, []);
  const toggle = (k: string) => onChange(selected.includes(k) ? selected.filter((x) => x !== k) : full ? selected : [...selected, k]);
  return (
    <>
      <button type="button" className="msm-edit" data-tip={t('msm.edit.tip')} aria-label={`${t('msm.edit.tip')}: ${title}`} onClick={() => (setQ(''), setOpen(true))}>
        <CapeIcon name="edit" size={20} />
      </button>
      {open && (
        <Drawer
          title={`${t('msm.edit.tip')} · ${title}`}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className="pd-btn pd-btn--ghost" onClick={() => onChange(cfg.defaults)}>
                {t('msm.edit.reset')}
              </button>
              <button type="button" className="pd-btn pd-btn--primary" onClick={() => setOpen(false)}>
                {t('msm.edit.done')}
              </button>
            </>
          }
        >
          <p className="msm-edit__count" aria-live="polite">
            {t('msm.edit.count', { n: selected.length, max: cfg.capacity })}
            {full && <span> · {t('msm.edit.full')}</span>}
          </p>
          <label className="msm-searchbox msm-edit__search">
            <CapeIcon name="search" size={16} />
            <input type="search" className="msm-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('msm.edit.search')} aria-label={t('msm.edit.search')} />
          </label>
          {groups.map((g) => (
            <section key={g.head} className="msm-edit__sec">
              <h3 className="msm-edit__group">{g.head}</h3>
              <ul className="msm-edit__box">
                {g.keys.map((k) => {
                  const on = selected.includes(k);
                  const locked = full && !on;
                  return (
                    <li key={k} className={locked ? 'is-locked' : undefined}>
                      <label>
                        <span className="msm-edit__text">
                          <b>{label(k)}</b>
                          {hint?.(k) && <small>{hint(k)}</small>}
                        </span>
                        <input type="checkbox" role="switch" className="msm-switch" checked={on} disabled={locked} onChange={() => toggle(k)} />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {options.length === 0 && <p className="msm-edit__none">{t('msm.edit.none')}</p>}
        </Drawer>
      )}
    </>
  );
}
