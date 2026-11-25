import { forwardRef } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import classNames from 'classnames';

export interface IconButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'dangerouslySetInnerHTML'> {
  icon?: ReactElement;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'elevated';
  status?: 'branded' | 'inverse';
  size?: '2xsmall' | 'xsmall' | 'small' | 'medium' | 'large';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'xsmall', variant = 'tertiary', status, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames('cp-icon-button', `cp-icon-button--${size}`, `cp-icon-button--${variant}`, status && `cp-icon-button--${status}`, className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
