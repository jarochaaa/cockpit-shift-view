import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { CapeIcon } from './icons';
import type { IconName } from './icons';

export interface Option<T extends string | number> {
  value: T;
  label: string;
}

/** Cape Dropdown as the SMC uses it: a <details> trigger with a list body; closes on pick or outside click. */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  label,
  active = false,
  align = 'start',
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  label: string;
  active?: boolean;
  align?: 'start' | 'end';
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const current = options.find((o) => o.value === value)?.label ?? String(value);
  return (
    <details ref={ref} className={`lg-dd lg-dd--${align}`}>
      <summary className={`lg-dd__trigger${active ? ' lg-dd__trigger--active' : ''}`} aria-label={`${label}: ${current}`}>
        {current}
        <CapeIcon name="chevronDown" size={16} />
      </summary>
      <ul className="lg-dd__body" role="listbox" aria-label={label}>
        {options.map((o) => (
          <li key={String(o.value)} role="option" aria-selected={o.value === value}>
            <button
              type="button"
              className={`lg-dd__item${o.value === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(o.value);
                if (ref.current) ref.current.open = false;
              }}
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`lg-field${wide ? ' lg-field--wide' : ''}`}>
      <span className="lg-field__label">{label}</span>
      {children}
    </label>
  );
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`lg-chip${selected ? ' lg-chip--on' : ''}`} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}

export function EmptyCenter({ icon, text, tall }: { icon: IconName; text: string; tall?: boolean }) {
  return (
    <div className={`lg-empty${tall ? ' lg-empty--tall' : ''}`}>
      <CapeIcon name={icon} size={32} />
      <p>{text}</p>
    </div>
  );
}

export function EmptyBox({ title, body }: { title: string; body?: string }) {
  return (
    <div className="lg-empty-box">
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

export function LiveTag({ text, on }: { text: string; on: boolean }) {
  return (
    <span className="lg-live">
      <span className={`lg-live__dot${on ? ' lg-live__dot--on' : ''}`} aria-hidden />
      {text}
    </span>
  );
}
