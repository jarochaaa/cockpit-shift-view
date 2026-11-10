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
  interactive: boolean;
}

const ALL_SPANS: ColSpan[] = [1, 2, 3];

export function BoxHeader({ title, colSpan, minColSpan, maxColSpan, onColSpanChange, dragAttributes, dragListeners, rightSlot, interactive }: BoxHeaderProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`box-header${interactive ? ' box-header--draggable' : ''}`}
      {...(interactive ? dragAttributes : {})}
      {...(interactive ? dragListeners : {})}
      aria-label={interactive ? t('grid.dragHandle', { box: title }) : undefined}
    >
      <Typography variant="display-medium" as="h2">
        {title}
      </Typography>
      <div className="box-header__controls">
        {rightSlot}
        {interactive && (
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
        )}
        {interactive && (
          <span className="box-header__drag-icon">
            <DragHandleIcon />
          </span>
        )}
      </div>
    </div>
  );
}
