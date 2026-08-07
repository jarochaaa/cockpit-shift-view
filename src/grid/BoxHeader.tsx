import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl, SegmentedControlItem } from '../cape/SegmentedControl';
import { Typography } from '../cape/Typography';
import type { ColSpan } from '../domain/types';
import { DragHandleIcon } from './DragHandleIcon';

export interface BoxHeaderProps {
  title: string;
  colSpan: ColSpan;
  minColSpan: ColSpan;
  maxColSpan: ColSpan;
  onColSpanChange: (span: ColSpan) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: DraggableSyntheticListeners;
  rightSlot?: ReactNode;
}

const ALL_SPANS: ColSpan[] = [1, 2, 3];

export function BoxHeader({ title, colSpan, minColSpan, maxColSpan, onColSpanChange, dragAttributes, dragListeners, rightSlot }: BoxHeaderProps) {
  const { t } = useTranslation();
  return (
    <div
      className="box-header"
      {...dragAttributes}
      {...dragListeners}
      aria-label={t('grid.dragHandle', { box: title })}
    >
      <Typography variant="display-medium" as="h2">
        {title}
      </Typography>
      <div className="box-header__controls">
        {rightSlot}
        <SegmentedControl size="xsmall" value={String(colSpan)} onChange={(v) => onColSpanChange(Number(v) as ColSpan)}>
          {ALL_SPANS.map((span) => (
            <SegmentedControlItem
              key={span}
              value={String(span)}
              disabled={span < minColSpan || span > maxColSpan}
              aria-label={t(`grid.spanLabel.${span}`)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {t(`grid.span.${span}`)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <span className="box-header__drag-icon">
          <DragHandleIcon />
        </span>
      </div>
    </div>
  );
}
