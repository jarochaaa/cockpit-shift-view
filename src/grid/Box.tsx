import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { Card } from '../cape/Card';
import { getBoxConfig } from '../domain/boxCatalog';
import type { ColSpan } from '../domain/types';
import { BoxHeader } from './BoxHeader';

export interface BoxProps {
  boxKey: string;
  title: string;
  colSpan: ColSpan;
  onColSpanChange: (span: ColSpan) => void;
  headerRightSlot?: ReactNode;
  children: ReactNode;
}

export function Box({ boxKey, title, colSpan, onColSpanChange, headerRightSlot, children }: BoxProps) {
  const config = getBoxConfig(boxKey);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boxKey });

  // L (span 3) is always alone in its row — content drives its height with
  // no cap. M/S share a row, so height comes from the tallest sibling with
  // a max-height safety net (see index.css) instead of any one box's content.
  const isFluid = colSpan === 3;

  return (
    <div
      ref={setNodeRef}
      className={classNames('box-grid-item', `box-grid-item--span-${colSpan}`)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      } as CSSProperties}
    >
      <Card
        className={classNames('grid-box-card', isFluid ? 'grid-box-card--fluid' : 'grid-box-card--capped')}
        variant={isDragging ? 'elevated' : 'outlined'}
        dragging={isDragging}
      >
        <BoxHeader
          title={title}
          colSpan={colSpan}
          minColSpan={config.minColSpan}
          maxColSpan={config.maxColSpan}
          onColSpanChange={onColSpanChange}
          dragAttributes={attributes}
          dragListeners={listeners}
          rightSlot={headerRightSlot}
        />
        <div className="box-body">{children}</div>
      </Card>
    </div>
  );
}
