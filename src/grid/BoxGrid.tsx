import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';

export interface BoxGridProps {
  boxKeys: string[];
  onReorder: (activeKey: string, overKey: string) => void;
  children: ReactNode;
}

export function BoxGrid({ boxKeys, onReorder, children }: BoxGridProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={boxKeys} strategy={rectSortingStrategy}>
        <div className="box-grid">{children}</div>
      </SortableContext>
    </DndContext>
  );
}
