import { createContext, useContext } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import classNames from 'classnames';

export interface SegmentedControlProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

const SegmentedControlContext = createContext<{ value?: string; onChange?: (value: string) => void }>({});

export function SegmentedControl({ value, defaultValue, onChange, className, children, ...rest }: SegmentedControlProps) {
  return (
    <SegmentedControlContext.Provider value={{ value: value ?? defaultValue, onChange }}>
      <div role="radiogroup" className={classNames('cp-segmented-control', className)} {...rest}>
        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
}

export interface SegmentedControlItemProps extends ComponentPropsWithRef<'button'> {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function SegmentedControlItem({ value, disabled, className, children, ...rest }: SegmentedControlItemProps) {
  const ctx = useContext(SegmentedControlContext);
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      className={classNames('cp-segmented-control-item', { 'cp-segmented-control-item--active': active }, className)}
      onClick={() => ctx.onChange?.(value)}
      {...rest}
    >
      {children}
    </button>
  );
}
