import { forwardRef } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import classNames from 'classnames';

export interface IconButtonProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'dangerouslySetInnerHTML'> {
  icon?: ReactElement;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'elevated';
  status?: 'branded' | 'inverse';
  size?: '2xsmall' | 'xsmall' | 'small' | 'medium' | 'large';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'xsmall', className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={classNames('cp-icon-button', `cp-icon-button--${size}`, className)}
      {...rest}
    >
      {icon}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
