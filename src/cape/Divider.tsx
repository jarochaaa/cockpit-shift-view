import type { ComponentPropsWithRef } from 'react';
import classNames from 'classnames';

// Local re-implementation of @deliveryhero/cape-core's Divider (same props).
export interface DividerProps extends ComponentPropsWithRef<'hr'> {
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium';
  variant?: 'normal' | 'dark' | 'inverse';
}

export function Divider({ orientation = 'horizontal', size = 'small', variant = 'normal', className, ...rest }: DividerProps) {
  return <hr aria-orientation={orientation} className={classNames('cp-divider', `cp-divider--${orientation}`, `cp-divider--${size}`, `cp-divider--${variant}`, className)} {...rest} />;
}
