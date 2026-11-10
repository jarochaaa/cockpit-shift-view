import { createContext, useContext } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import classNames from 'classnames';

// Local re-implementation of @deliveryhero/cape-core's List compound component
// (List, ListListItem, ListListItemText; same props).
type Size = 'small' | 'medium' | 'large';
const ListContext = createContext<{ size: Size; divider: boolean }>({ size: 'medium', divider: true });

export interface ListProps extends ComponentPropsWithRef<'ul'> {
  size?: Size;
  divider?: boolean;
}

export function List({ size = 'medium', divider = true, className, children, ...rest }: ListProps) {
  return (
    <ListContext.Provider value={{ size, divider }}>
      <ul className={classNames('cp-list', `cp-list--${size}`, className)} {...rest}>
        {children}
      </ul>
    </ListContext.Provider>
  );
}

export interface ListItemProps extends ComponentPropsWithRef<'li'> {
  size?: Size;
  divider?: boolean;
  selected?: boolean;
  disabled?: boolean;
  secondaryAction?: ReactNode;
}

export function ListItem({ size, divider, selected = false, disabled = false, secondaryAction, className, children, ...rest }: ListItemProps) {
  const ctx = useContext(ListContext);
  return (
    <li
      className={classNames('cp-list-item', `cp-list-item--${size ?? ctx.size}`, { 'cp-list-item--divider': divider ?? ctx.divider, 'cp-list-item--selected': selected }, className)}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      <div className="cp-list-item__content">{children}</div>
      {secondaryAction != null && <div className="cp-list-item__action">{secondaryAction}</div>}
    </li>
  );
}

export function ListItemText({ primaryText, secondaryText, className }: { primaryText?: ReactNode; secondaryText?: ReactNode; className?: string }) {
  return (
    <div className={classNames('cp-list-item-text', className)}>
      {primaryText != null && <span className="cp-list-item-text__title">{primaryText}</span>}
      {secondaryText != null && <span className="cp-list-item-text__subtitle">{secondaryText}</span>}
    </div>
  );
}
