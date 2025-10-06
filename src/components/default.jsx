'use client';;
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from '@/components/ui/kanban';
import { GripVertical } from 'lucide-react';

const COLUMN_TITLES = {
  backlog: 'Backlog',
  inProgress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

function TaskCard({
  task,
  asHandle,
  ...props
}) {
  const cardContent = (
    <div className="rounded-md border bg-card p-3 shadow-xs">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="line-clamp-1 font-medium text-sm">{task.title}</span>
          <Badge
            variant="secondary"
            appearance="outline"
            className="pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize shrink-0">
          </Badge>
        </div>
        <div
          className="flex items-center justify-between text-muted-foreground text-xs">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <Avatar className="size-4">
                <AvatarImage src={task.assigneeAvatar} />
                <AvatarFallback>{task.assignee.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="line-clamp-1">{task.assignee}</span>
            </div>
          )}
          {task.dueDate && <time className="text-[10px] tabular-nums whitespace-nowrap">{task.dueDate}</time>}
        </div>
      </div>
    </div>
  );

  return (
    <KanbanItem value={task.id} {...props}>
      {asHandle ? <KanbanItemHandle>{cardContent}</KanbanItemHandle> : cardContent}
    </KanbanItem>
  );
}

function TaskColumn({
  value,
  tasks,
  isOverlay,
  ...props
}) {
  return (
    <KanbanColumn
      value={value}
      {...props}
      className="rounded-md border bg-card p-2.5 shadow-xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm">{COLUMN_TITLES[value]}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <KanbanColumnHandle asChild>
          <Button variant="dim" size="sm" mode="icon">
            <GripVertical />
          </Button>
        </KanbanColumnHandle>
      </div>
      <KanbanColumnContent value={value} className="flex flex-col gap-2.5 p-0.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle={!isOverlay} />
        ))}
      </KanbanColumnContent>
    </KanbanColumn>
  );
}

export default function Component() {
  const [columns, setColumns] = React.useState({
    backlog: [
      {
        id: '1',
        title: 'Add authentication',
        assignee: 'John Doe',
        assigneeAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        dueDate: 'Jan 10, 2025',
      },
      {
        id: '2',
        title: 'Create API endpoints',
        assignee: 'Jane Smith',
        assigneeAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        dueDate: 'Jan 15, 2025',
      },
      {
        id: '3',
        title: 'Write documentation',
        assignee: 'Bob Johnson',
        assigneeAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        dueDate: 'Jan 20, 2025',
      },
    ],
    inProgress: [
      {
        id: '4',
        title: 'Design system updates',
        assignee: 'Alice Brown',
        assigneeAvatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        dueDate: 'Aug 25, 2025',
      },
      {
        id: '5',
        title: 'Implement dark mode',
        assignee: 'Charlie Wilson',
        assigneeAvatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        dueDate: 'Aug 25, 2025',
      },
    ],
    done: [
      {
        id: '7',
        title: 'Setup project',
        assignee: 'Eve Davis',
        assigneeAvatar: 'https://randomuser.me/api/portraits/women/6.jpg',
        dueDate: 'Sep 25, 2025',
      },
      {
        id: '8',
        title: 'Initial commit',
        assignee: 'Frank White',
        assigneeAvatar: 'https://randomuser.me/api/portraits/men/7.jpg',
        dueDate: 'Sep 20, 2025',
      },
    ],
  });

  return (
    <Kanban
      value={columns}
      onValueChange={setColumns}
      getItemValue={(item) => item.id}>
      <KanbanBoard className="grid auto-rows-fr grid-cols-3">
        {Object.entries(columns).map(([columnValue, tasks]) => (
          <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
        ))}
      </KanbanBoard>
      <KanbanOverlay>
        <div className="rounded-md bg-muted/60 size-full" />
      </KanbanOverlay>
    </Kanban>
  );
}
