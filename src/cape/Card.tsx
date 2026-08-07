import { forwardRef } from 'react';
import type { ComponentPropsWithRef } from 'react';
import classNames from 'classnames';

export interface CardProps extends ComponentPropsWithRef<'div'> {
  variant?: 'filled' | 'outlined' | 'elevated';
  disabled?: boolean;
  dragging?: boolean;
}

// Faithful local re-implementation of @deliveryhero/cape-core's Card —
// see Cockpit-Shift-View-Visual-Spec-v1.md for why this isn't the published package.
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'outlined', disabled = false, dragging = false, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={classNames('cp-card', `cp-card--${variant}`, { 'cp-card--dragging': dragging }, className)}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </div>
  ),
);

Card.displayName = 'Card';
