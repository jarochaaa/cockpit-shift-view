import type { AriaRole, ComponentPropsWithRef, ReactNode } from 'react';
import classNames from 'classnames';

export interface IndicatorProps extends ComponentPropsWithRef<'span'> {
  role?: AriaRole;
  status?: 'branded' | 'neutral' | 'error' | 'warning' | 'success' | 'subtle';
  size?: 'small' | 'medium' | 'large';
  children?: ReactNode;
}

export function Indicator({ role = 'status', status = 'branded', size = 'medium', className, children, ...rest }: IndicatorProps) {
  return (
    <span
      role={role}
      className={classNames('cp-indicator', `cp-indicator--${status}`, `cp-indicator--${size}`, { 'cp-indicator--content': children != null }, className)}
      {...rest}
    >
      {children}
    </span>
  );
}
