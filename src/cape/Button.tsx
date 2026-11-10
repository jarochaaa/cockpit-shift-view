import { forwardRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import classNames from 'classnames';

// Local re-implementation of @deliveryhero/cape-core's Button (same props).
export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'tertiary';
  status?: 'branded' | 'error' | 'success' | 'inverse';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'medium', variant = 'primary', status = 'branded', startIcon, endIcon, loading = false, disabled, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={loading || disabled}
      className={classNames('cp-button', `cp-button--${size}`, `cp-button--${variant}`, `cp-button--${status}`, className)}
      {...rest}
    >
      {startIcon && <span className="cp-button__icon">{startIcon}</span>}
      {children != null && <span className="cp-button__label">{children}</span>}
      {endIcon && <span className="cp-button__icon">{endIcon}</span>}
    </button>
  ),
);

Button.displayName = 'Button';
