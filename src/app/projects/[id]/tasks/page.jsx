'use client';

import React from 'react';
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanColumnContent,
  KanbanOverlay,
} from '@/components/ui/kanban';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Calendar, User } from 'lucide-react';
import TaskForm from '@/components/forms/TaskForm';

// Placeholder data for the Kanban board
const initialColumns = {
  'todo': {
    title: 'Todo',
    items: [
      {
        id: 'task-1',
        title: 'Design user authentication flow',
        description: 'Create wireframes and mockups for login/signup pages',
        assignee: 'John Doe',
        dueDate: '2024-01-15',
        priority: 'high',
        tags: ['design', 'ui/ux']
      },
      {
        id: 'task-2',
        title: 'Set up project database schema',
        description: 'Define tables for projects, tasks, and users',
        assignee: 'Jane Smith',
        dueDate: '2024-01-20',
        priority: 'medium',
        tags: ['backend', 'database']
      },
      {
        id: 'task-3',
        title: 'Implement responsive navigation',
        description: 'Create mobile-friendly sidebar and header components',
        assignee: 'Mike Johnson',
        dueDate: '2024-01-25',
        priority: 'low',
        tags: ['frontend', 'responsive']
      }
    ]
  },
  'doing': {
    title: 'Doing',
    items: [
      {
        id: 'task-4',
        title: 'Build project creation form',
        description: 'Create form component with validation for new projects',
        assignee: 'Sarah Wilson',
        dueDate: '2024-01-18',
        priority: 'high',
        tags: ['frontend', 'forms']
      }
    ]
  },
  'done': {
    title: 'Done',
    items: [
      {
        id: 'task-5',
        title: 'Set up Next.js project structure',
        description: 'Initialize project with proper folder organization',
        assignee: 'Alex Brown',
        dueDate: '2024-01-10',
        priority: 'high',
        tags: ['setup', 'configuration']
      },
      {
        id: 'task-6',
        title: 'Install and configure dependencies',
        description: 'Set up Tailwind CSS, shadcn/ui, and other required packages',
        assignee: 'Chris Davis',
        dueDate: '2024-01-12',
        priority: 'medium',
        tags: ['setup', 'dependencies']
      }
    ]
  }
};

// Task card component
function TaskCard({ task }) {
  return (
    <Card className="mb-3 group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight">
            {task.title}
          </CardTitle>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {task.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assignee}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Column header component
function ColumnHeader({ title, count }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <KanbanColumnHandle>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
          <Plus className="h-4 w-4" />
        </Button>
      </KanbanColumnHandle>
    </div>
  );
}

export default function TasksPage({ params }) {
  const [columns, setColumns] = React.useState(initialColumns);

  const getItemValue = React.useCallback((item) => item.id, []);

  // Handle new task creation
  const handleTaskCreated = (newTask) => {
    console.log('Task created:', newTask);

    // For now, add the task to the appropriate column based on status
    const targetColumn = newTask.status || 'todo';

    setColumns(prevColumns => ({
      ...prevColumns,
      [targetColumn]: {
        ...prevColumns[targetColumn],
        items: [...prevColumns[targetColumn].items, newTask]
      }
    }));
  };

  return (
    <div className="h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track project tasks using the Kanban board
            </p>
          </div>
          <TaskForm
            projectId={params?.id}
            onSubmit={handleTaskCreated}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            }
          />
        </div>
      </div>

      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={getItemValue}
        className="h-[calc(100vh-12rem)]"
      >
        <KanbanBoard>
          {Object.entries(columns).map(([columnId, column]) => (
            <KanbanColumn key={columnId} value={columnId}>
              <div className="p-4 bg-muted/30 rounded-lg min-h-[500px]">
                <ColumnHeader title={column.title} count={column.items.length} />
                <KanbanColumnContent value={columnId}>
                  {column.items.map((task) => (
                    <KanbanItem key={task.id} value={task.id}>
                      <TaskCard task={task} />
                    </KanbanItem>
                  ))}
                </KanbanColumnContent>
              </div>
            </KanbanColumn>
          ))}
        </KanbanBoard>

        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const column = Object.values(columns).find(col =>
                Object.keys(columns).find(key => columns[key] === col) === value
              );
              return (
                <div className="p-4 bg-background border rounded-lg shadow-lg min-w-[250px]">
                  <h3 className="font-semibold">{column?.title}</h3>
                </div>
              );
            }

            const allItems = Object.values(columns).flatMap(col => col.items);
            const item = allItems.find(task => task.id === value);
            if (!item) return null;

            return (
              <div className="p-4 bg-background border rounded-lg shadow-lg min-w-[300px]">
                <TaskCard task={item} />
              </div>
            );
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}