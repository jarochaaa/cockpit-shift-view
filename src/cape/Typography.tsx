import type { ComponentPropsWithRef, ElementType } from 'react';
import classNames from 'classnames';

type TypographyVariant =
  | 'display-2xlarge' | 'display-xlarge' | 'display-large' | 'display-medium' | 'display-small'
  | 'subtitle-large' | 'subtitle-medium' | 'body-medium' | 'body-small' | 'caption';

export interface TypographyProps extends ComponentPropsWithRef<'p'> {
  variant: TypographyVariant;
  as?: ElementType;
}

export function Typography({ variant, as, className, children, ...rest }: TypographyProps) {
  const Component = as ?? 'p';
  return (
    <Component className={classNames(`cp-${variant}`, className)} {...rest}>
      {children}
    </Component>
  );
}
