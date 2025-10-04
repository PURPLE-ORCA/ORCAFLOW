/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';;
import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  defaultDropAnimation,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot } from '@radix-ui/react-slot';

const KanbanContext = React.createContext({
  columns: {},
  setColumns: () => {},
  getItemId: () => '',
  columnIds: [],
  activeId: null,
  setActiveId: () => {},
  findContainer: () => undefined,
  isColumn: () => false,
});

const ColumnContext = React.createContext({
  attributes: {},
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

const ItemContext = React.createContext({
  listeners: undefined,
  isDragging: false,
  disabled: false,
});

const dropAnimationConfig = {
  ...defaultDropAnimation,
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

function Kanban(
  {
    value,
    onValueChange,
    getItemValue,
    children,
    className,
    onMove
  }
) {
  const columns = value;
  const setColumns = onValueChange;
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 10 to 3 for more responsive dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  

  const columnIds = React.useMemo(() => Object.keys(columns), [columns]);

  const isColumn = React.useCallback((id) => columnIds.includes(id), [columnIds]);

  const findContainer = React.useCallback((id) => {
    if (isColumn(id)) return id;
    return columnIds.find((key) => columns[key] && columns[key].items && Array.isArray(columns[key].items) && columns[key].items.some((item) => getItemValue(item) === id));
  }, [columns, columnIds, getItemValue, isColumn]);

  const handleDragStart = React.useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = React.useCallback((event) => {
    ('🚀 [KANBAN DEBUG] handleDragOver called:', event);
    ('🚀 [KANBAN DEBUG] Active:', event.active);
    ('🚀 [KANBAN DEBUG] Over:', event.over);
    if (onMove) {
      ('🚀 [KANBAN DEBUG] onMove callback provided, returning');
      return;
    }

    const { active, over } = event;
    if (!over) {
      ('🚀 [KANBAN DEBUG] No over element');
      return;
    }

    if (isColumn(active.id)) {
      ('🚀 [KANBAN DEBUG] Active is column, returning');
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    ('🚀 [KANBAN DEBUG] Active container:', activeContainer);
    ('🚀 [KANBAN DEBUG] Over container:', overContainer);

    // Only handle moving items between different columns
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      ('🚀 [KANBAN DEBUG] Same container or invalid container');
      return;
    }

    const activeItems = [...columns[activeContainer].items];
    const overItems = [...columns[overContainer].items];

    const activeIndex = activeItems.findIndex((item) => getItemValue(item) === active.id);
    let overIndex = overItems.findIndex((item) => getItemValue(item) === over.id);

    ('🚀 [KANBAN DEBUG] Active index:', activeIndex);
    ('🚀 [KANBAN DEBUG] Over index before:', overIndex);

    // If dropping on the column itself, not an item
    if (isColumn(over.id)) {
      overIndex = overItems.length;
      ('🚀 [KANBAN DEBUG] Dropping on column, overIndex set to:', overIndex);
    }

    const newOverItems = [...overItems];
    const [movedItem] = activeItems.splice(activeIndex, 1);
    newOverItems.splice(overIndex, 0, movedItem);

    ('🚀 [KANBAN DEBUG] Updating columns state');
    setColumns({
      ...columns,
      [activeContainer]: [...activeItems],
      [overContainer]: newOverItems,
    });
  }, [findContainer, getItemValue, isColumn, setColumns, columns, onMove]);

  const handleDragEnd = React.useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    // Handle item move callback
    if (onMove && !isColumn(active.id)) {
      const activeContainer = findContainer(active.id);
      const overContainer = findContainer(over.id);

      if (activeContainer && overContainer) {
        const activeIndex = columns[activeContainer].items.findIndex((item) => getItemValue(item) === active.id);
        const overIndex = isColumn(over.id)
          ? columns[overContainer].items.length
          : columns[overContainer].items.findIndex((item) => getItemValue(item) === over.id);

        onMove({
          event,
          activeContainer,
          activeIndex,
          overContainer,
          overIndex,
        });
      }
      return;
    }

    // Handle column reordering
    if (isColumn(active.id) && isColumn(over.id)) {
      const activeIndex = columnIds.indexOf(active.id);
      const overIndex = columnIds.indexOf(over.id);
      if (activeIndex !== overIndex) {
        const newOrder = arrayMove(Object.keys(columns), activeIndex, overIndex);
        const newColumns = {};
        newOrder.forEach((key) => {
          newColumns[key] = columns[key];
        });
        setColumns(newColumns);
      }
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    // Handle item reordering within the same column
    if (activeContainer && overContainer && activeContainer === overContainer) {
      const container = activeContainer;
      const activeIndex = columns[container].items.findIndex((item) => getItemValue(item) === active.id);
      const overIndex = columns[container].items.findIndex((item) => getItemValue(item) === over.id);

      if (activeIndex !== overIndex) {
        setColumns({
          ...columns,
          [container]: {
            ...columns[container],
            items: arrayMove(columns[container].items, activeIndex, overIndex),
          },
        });
      }
    }
  }, [columnIds, columns, findContainer, getItemValue, isColumn, setColumns, onMove]);

  const contextValue = React.useMemo(() => ({
    columns,
    setColumns,
    getItemId: getItemValue,
    columnIds,
    activeId,
    setActiveId,
    findContainer,
    isColumn,
  }), [columns, setColumns, getItemValue, columnIds, activeId, findContainer, isColumn]);

  ('🚀 [KANBAN DEBUG] Kanban component rendering with:', {
    columnsCount: Object.keys(columns).length,
    activeId,
    columnIds,
    childrenCount: React.Children.count(children)
  });

  return (
    <KanbanContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}>
        <div
          data-slot="kanban"
          data-dragging={activeId !== null}
          className={cn(className)}>
          {children}
        </div>
      </DndContext>
    </KanbanContext.Provider>
  );
}

function KanbanBoard({
  children,
  className
}) {
  const { columnIds } = React.useContext(KanbanContext);

  return (
    <SortableContext items={columnIds} strategy={rectSortingStrategy}>
      <div
        data-slot="kanban-board"
        className={cn('grid auto-rows-fr sm:grid-cols-3 gap-4', className)}>
        {children}
      </div>
    </SortableContext>
  );
}

function KanbanColumn({
  value,
  className,
  children,
  disabled
}) {
  
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
  });

  ('🚀 [KANBAN DEBUG] Column sortable props:', {
    hasSetNodeRef: !!setNodeRef,
    transform,
    transition,
    hasAttributes: !!attributes,
    hasListeners: !!listeners,
    isSortableDragging
  });

  const { activeId, isColumn } = React.useContext(KanbanContext);
  const isColumnDragging = activeId ? isColumn(activeId) : false;

  ('🚀 [KANBAN DEBUG] Column context:', {
    activeId,
    isColumnDragging,
    isColumn: isColumn(value)
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  ('🚀 [KANBAN DEBUG] Column style:', style);

  return (
    <ColumnContext.Provider value={{ attributes, listeners, isDragging: isColumnDragging, disabled }}>
      <div
        data-slot="kanban-column"
        data-value={value}
        data-dragging={isSortableDragging}
        data-disabled={disabled}
        ref={setNodeRef}
        style={style}
        className={cn(
          'group/kanban-column flex flex-col',
          isSortableDragging && 'opacity-50',
          disabled && 'opacity-50',
          className
        )}>
        {children}
      </div>
    </ColumnContext.Provider>
  );
}

function KanbanColumnHandle({
  asChild,
  className,
  children,
  cursor = true
}) {
  const { attributes, listeners, isDragging, disabled } = React.useContext(ColumnContext);

  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...attributes}
      {...listeners}
      className={cn(
        'opacity-0 transition-opacity group-hover/kanban-column:opacity-100',
        cursor && (isDragging ? '!cursor-grabbing' : '!cursor-grab'),
        className
      )}>
      {children}
    </Comp>
  );
}

function KanbanItem({
   value,
   asChild = false,
   className,
   children,
   disabled
  }) {
   ('🚀 [KANBAN DEBUG] KanbanItem rendered for value:', value);
   ('🚀 [KANBAN DEBUG] KanbanItem props:', { value, disabled, className });
   
   const {
     setNodeRef,
     transform,
     transition,
     attributes,
     listeners,
     isDragging: isSortableDragging,
   } = useSortable({
     id: value,
     disabled,
   });

   const { activeId, isColumn } = React.useContext(KanbanContext);
   const isItemDragging = activeId ? !isColumn(activeId) : false;

   ('🚀 [KANBAN DEBUG] Item listeners:', !!listeners);
   ('🚀 [KANBAN DEBUG] Item attributes:', !!attributes);
   ('🚀 [KANBAN DEBUG] Item isSortableDragging:', isSortableDragging);
   ('🚀 [KANBAN DEBUG] Item listeners type:', typeof listeners);
   ('🚀 [KANBAN DEBUG] Item attributes type:', typeof attributes);
   ('🚀 [KANBAN DEBUG] Item element ref:', setNodeRef);
   ('🚀 [KANBAN DEBUG] Item style transform:', transform);
   ('🚀 [KANBAN DEBUG] Item style transition:', transition);
   
   // Log CSS classes and pointer events
   ('🚀 [KANBAN DEBUG] Item CSS classes:', className);
   ('🚀 [KANBAN DEBUG] Item will have cursor classes:', isSortableDragging ? 'cursor-grabbing' : 'cursor-grab');

   const style = {
     transition,
     transform: CSS.Translate.toString(transform)
   };

   const Comp = asChild ? Slot : 'div';

   ('🚀 [KANBAN DEBUG] KanbanItem render - attributes:', attributes);
   ('🚀 [KANBAN DEBUG] KanbanItem render - listeners:', listeners);
   ('🚀 [KANBAN DEBUG] KanbanItem render - attributes keys:', Object.keys(attributes || {}));
   ('🚀 [KANBAN DEBUG] KanbanItem render - listeners keys:', Object.keys(listeners || {}));
   
   const mergedProps = {
     'data-slot': "kanban-item",
     'data-value': value,
     'data-dragging': isSortableDragging,
     'data-disabled': disabled,
     ref: setNodeRef,
     style: style,
     ...attributes,
     ...listeners,
     className: cn(isSortableDragging && 'opacity-50', disabled && 'opacity-50', className)
   };
   
   ('🚀 [KANBAN DEBUG] KanbanItem merged props:', {
     hasRef: !!mergedProps.ref,
     hasStyle: !!mergedProps.style,
     hasAttributes: !!mergedProps.attributes,
     hasListeners: !!mergedProps.listeners,
     className: mergedProps.className,
     styleKeys: Object.keys(mergedProps.style || {}),
     attributeKeys: Object.keys(mergedProps).filter(k => k !== 'ref' && k !== 'style' && k !== 'className' && k !== 'children'),
   });
 
   return (
     <ItemContext.Provider value={{ listeners, isDragging: isItemDragging, disabled }}>
       <Comp {...mergedProps}>
         {children}
       </Comp>
     </ItemContext.Provider>
   );
 }

function KanbanItemHandle({
  asChild,
  className,
  children,
  cursor = true
}) {
  const { listeners, isDragging, disabled } = React.useContext(ItemContext);

  const Comp = asChild ? Slot : 'div';

  ('🚀 [KANBAN DEBUG] KanbanItemHandle render - listeners:', listeners);
  ('🚀 [KANBAN DEBUG] KanbanItemHandle render - isDragging:', isDragging);
  ('🚀 [KANBAN DEBUG] KanbanItemHandle render - disabled:', disabled);
  ('🚀 [KANBAN DEBUG] KanbanItemHandle render - listeners keys:', Object.keys(listeners || {}));
  
  const mergedProps = {
    'data-slot': "kanban-item-handle",
    'data-dragging': isDragging,
    'data-disabled': disabled,
    ...listeners,
    className: cn(cursor && (isDragging ? '!cursor-grabbing' : '!cursor-grab'), className)
  };
  
  ('🚀 [KANBAN DEBUG] KanbanItemHandle merged props:', {
    hasListeners: !!mergedProps.listeners,
    className: mergedProps.className,
    propKeys: Object.keys(mergedProps).filter(k => k !== 'className' && k !== 'children'),
  });

  return (
    <Comp {...mergedProps}>
      {children}
    </Comp>
  );
}

function KanbanColumnContent({
  value,
  className,
  children
}) {
  const { columns, getItemId } = React.useContext(KanbanContext);

  const itemIds = React.useMemo(() => (columns[value].items || []).map(getItemId), [columns, getItemId, value]);

  ('🚀 [KANBAN DEBUG] KanbanColumnContent for column:', value);
  ('🚀 [KANBAN DEBUG] Column items:', columns[value].items);
  ('🚀 [KANBAN DEBUG] Item IDs for sorting:', itemIds);
  ('🚀 [KANBAN DEBUG] SortableContext items:', itemIds);

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div
        data-slot="kanban-column-content"
        className={cn('flex flex-col gap-2', className)}>
        {children}
      </div>
    </SortableContext>
  );
}

function KanbanOverlay({
  children,
  className
}) {
  const { activeId, isColumn } = React.useContext(KanbanContext);
  const [dimensions, setDimensions] = React.useState(null);

  ('🚀 [KANBAN DEBUG] KanbanOverlay:', {
    activeId,
    isColumn: isColumn?.(activeId),
    hasDimensions: !!dimensions
  });

  React.useEffect(() => {
    if (activeId) {
      const element = document.querySelector(
        `[data-slot="kanban-${isColumn(activeId) ? 'column' : 'item'}"][data-value="${activeId}"]`
      );
      if (element) {
        const rect = element.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
        ('🚀 [KANBAN DEBUG] Overlay dimensions updated:', {
          width: rect.width,
          height: rect.height,
          element: element,
          selector: `[data-slot="kanban-${isColumn(activeId) ? 'column' : 'item'}"][data-value="${activeId}"]`
        });
      } else {
        ('🚀 [KANBAN DEBUG] Overlay element not found for selector:', `[data-slot="kanban-${isColumn(activeId) ? 'column' : 'item'}"][data-value="${activeId}"]`);
      }
    } else {
      setDimensions(null);
    }
  }, [activeId]);

  const style = {
    width: dimensions?.width,
    height: dimensions?.height
  };

  const content = React.useMemo(() => {
    if (!activeId) return null;
    if (typeof children === 'function') {
      return children({
        value: activeId,
        variant: isColumn(activeId) ? 'column' : 'item',
      });
    }
    return children;
  }, [activeId, children, isColumn]);

  ('🚀 [KANBAN DEBUG] KanbanOverlay render:', {
    activeId,
    hasContent: !!content,
    style,
    className
  });

  return (
    <DragOverlay dropAnimation={dropAnimationConfig}>
      <div
        data-slot="kanban-overlay"
        data-dragging={true}
        style={style}
        className={cn('pointer-events-none', className, activeId ? '!cursor-grabbing' : '')}>
        {content}
      </div>
    </DragOverlay>
  );
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanColumnContent,
  KanbanOverlay,
};
