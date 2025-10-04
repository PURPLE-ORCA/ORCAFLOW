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
  useDroppable,
  closestCorners,
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
    // If onMove is provided, let it handle everything
    if (onMove) {
      return;
    }

    const { active, over } = event;
    if (!over) {
      return;
    }

    if (isColumn(active.id)) {
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    // Only handle moving items between different columns
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const activeItems = [...columns[activeContainer].items];
    const overItems = [...columns[overContainer].items];

    const activeIndex = activeItems.findIndex((item) => getItemValue(item) === active.id);
    let overIndex = overItems.findIndex((item) => getItemValue(item) === over.id);

    // If dropping on the column itself, not an item
    if (isColumn(over.id)) {
      overIndex = overItems.length;
    }

    const newOverItems = [...overItems];
    const [movedItem] = activeItems.splice(activeIndex, 1);
    newOverItems.splice(overIndex, 0, movedItem);

    setColumns({
      ...columns,
      [activeContainer]: { ...columns[activeContainer], items: [...activeItems] },
      [overContainer]: { ...columns[overContainer], items: newOverItems },
    });
  }, [findContainer, getItemValue, isColumn, setColumns, columns, onMove]);

  const handleDragEnd = React.useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    // Handle item move callback - pass the original event structure
    if (onMove && !isColumn(active.id)) {
      console.log('🚀 [KANBAN DEBUG] Calling onMove with event:', { active, over });
      onMove(event); // Pass the original event structure that @dnd-kit provides
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

  return (
    <KanbanContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
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

  // Define the style object for drag animations
  const style = {
    transition,
    transform: CSS.Translate.toString(transform)
  };

  return (
    <ColumnContext.Provider value={{ attributes, listeners, isDragging: isSortableDragging, disabled }}>
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


   const style = {
     transition,
     transform: CSS.Translate.toString(transform)
   };

   const Comp = asChild ? Slot : 'div';

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

   // Use @dnd-kit's useDroppable hook for proper drop zone detection
   const { setNodeRef, isOver } = useDroppable({
     id: value, // Use the column ID as the droppable ID
     data: {
       type: 'column',
       columnId: value
     }
   });

   return (
     <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
       <div
         ref={setNodeRef}
         data-slot="kanban-column-content"
         data-column-id={value}
         className={cn(
           'flex flex-col gap-2 min-h-[200px] p-2 rounded-md transition-all duration-200',
           isOver && 'bg-primary/10 border-2 border-dashed border-primary/50 ring-2 ring-primary/20',
           className
         )}
         style={{
           minHeight: '200px',
           position: 'relative'
         }}>
         {children}
         {/* Visual indicator for empty columns */}
         {itemIds.length === 0 && (
           <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/25 rounded-md">
             Drop tasks here
           </div>
         )}
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


  React.useEffect(() => {
    if (activeId) {
      const element = document.querySelector(
        `[data-slot="kanban-${isColumn(activeId) ? 'column' : 'item'}"][data-value="${activeId}"]`
      );
      if (element) {
        const rect = element.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      } else {
        console.log('🚀 [KANBAN DEBUG] Overlay element not found for selector:', `[data-slot="kanban-${isColumn(activeId) ? 'column' : 'item'}"][data-value="${activeId}"]`);
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
