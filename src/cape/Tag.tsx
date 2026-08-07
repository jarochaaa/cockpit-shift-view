import type { ComponentPropsWithRef, ReactNode } from 'react';
import classNames from 'classnames';

export interface TagProps extends ComponentPropsWithRef<'div'> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  size?: 'small' | 'medium';
  status?: 'branded' | 'info' | 'error' | 'warning' | 'success' | 'inverse' | 'disabled' | 'neutral';
}

export function Tag({ startIcon, endIcon, size = 'medium', status = 'branded', className, children, ...rest }: TagProps) {
  return (
    <div className={classNames('cp-tag', `cp-tag--${status}`, { 'cp-tag--small': size === 'small' }, className)} {...rest}>
      {startIcon}
      {children}
      {endIcon}
    </div>
  );
}
