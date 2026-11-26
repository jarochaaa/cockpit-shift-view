import type { ComponentPropsWithRef } from 'react';
import classNames from 'classnames';
import { CapeIcon } from '../cockpit/legacy/icons';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  wrapperClassName?: string;
}

export function Select({ options, value, onChange, className, wrapperClassName, ...rest }: SelectProps) {
  return (
    <span className={classNames('cp-select-wrap', wrapperClassName)}>
    <select
      className={classNames('cp-select', className)}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <CapeIcon name="chevronDown" size={18} className="cp-select-wrap__icon" />
    </span>
  );
}
