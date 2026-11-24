import { CapeIcon } from '../legacy/icons';
import type { IconName } from '../legacy/icons';

export type ChipTone = 'all' | 'error' | 'warning' | 'info' | 'success';
export interface FilterChip {
  key: string;
  tone: ChipTone;
  icon: IconName;
  label: string;
  count: number;
}

/**
 * The one status filter of the Overview: used by Insights and by Stores by priority, so both look and behave the same.
 * Icon plus count, a tooltip for the name, grey until hover / focus / selected, then the whole chip takes its state colour.
 * Pressing the selected chip goes back to All.
 */
export function FilterChips({ chips, value, onChange, label, className }: { chips: FilterChip[]; value: string; onChange: (key: string) => void; label: string; className?: string }) {
  return (
    <div className={`fc${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
      {chips.map((c) => {
        const on = value === c.key;
        return (
          <button key={c.key} type="button" className={`fc__chip fc__chip--${c.tone}${on ? ' is-on' : ''}`} aria-pressed={on} aria-label={`${c.label}: ${c.count}`} data-tip={c.label} onClick={() => onChange(on && c.key !== chips[0].key ? chips[0].key : c.key)}>
            <CapeIcon name={c.icon} size={16} className="fc__icon" />
            <span className="fc__badge">{c.count}</span>
          </button>
        );
      })}
    </div>
  );
}
