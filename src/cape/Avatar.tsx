import type { ComponentPropsWithRef } from 'react';
import classNames from 'classnames';

export interface AvatarProps extends ComponentPropsWithRef<'div'> {
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined';
  title?: string;
  initials?: string;
  image?: string;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function Avatar({ size = 'medium', variant = 'filled', title, initials, image, className, ...rest }: AvatarProps) {
  return (
    <div
      className={classNames('cp-avatar', `cp-avatar--${size}`, { 'cp-avatar--outlined': variant === 'outlined' }, className)}
      title={title}
      aria-label={title}
      {...rest}
    >
      {image ? <img src={image} alt={title ?? ''} /> : (initials ?? (title ? initialsFromName(title) : ''))}
    </div>
  );
}
