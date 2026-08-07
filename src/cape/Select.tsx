import type { ComponentPropsWithRef } from 'react';
import classNames from 'classnames';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export function Select({ options, value, onChange, className, ...rest }: SelectProps) {
  return (
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
  );
}
