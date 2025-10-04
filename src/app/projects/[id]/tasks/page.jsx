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
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreHorizontal, Calendar, User, AlertCircle } from 'lucide-react';
import TaskForm from '@/components/forms/TaskForm';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Task card component
function TaskCard({ task }) {
  
  
  return (
    <Card
      className="bg-card group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none"
    >
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <CardTitle className="text-md font-medium leading-tight">
            {task.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
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
            {task.assignee && task.assignee !== "Unassigned" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assignee}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {task.labels &&
              task.labels.map((label, index) => (
                <Badge
                  key={index}
                  variant="primary"
                  className="text-xs px-1 py-0"
                >
                  {label}
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

export default function TasksPage({ params: initialParams }) {
  const [columns, setColumns] = React.useState({
    todo: { title: 'Todo', items: [] },
    doing: { title: 'Doing', items: [] },
    done: { title: 'Done', items: [] }
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [projectId, setProjectId] = React.useState(null);

  // Resolve params and set project ID
  React.useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await initialParams;
      setProjectId(resolvedParams.id);
    }
    resolveParams();
  }, [initialParams]);

  // Fetch tasks from API
  const fetchTasks = React.useCallback(async () => {
    if (!projectId) {
      console.log('🚀 [DEBUG] No projectId yet, skipping fetch');
      return;
    }

    try {
      console.log('🚀 [DEBUG] Starting fetchTasks for project:', projectId);
      setLoading(true);
      setError(null);

      // Get authentication token from Supabase
      console.log('🚀 [DEBUG] Getting Supabase session...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.log('🚨 [DEBUG] No authentication token found');
        throw new Error('No authentication token found');
      }
      console.log('🚀 [DEBUG] Got session for user:', session.user.email);

      console.log('🚀 [DEBUG] Making API request to:', `/api/projects/${projectId}/tasks`);
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🚀 [DEBUG] API response status:', response.status);

      if (!response.ok) {
        console.log('🚨 [DEBUG] API response not ok, parsing error...');
        const errorData = await response.json();
        console.log('🚨 [DEBUG] Error data:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch tasks');
      }

      console.log('🚀 [DEBUG] Parsing API response...');
      const { data: tasks } = await response.json();
      console.log('🚀 [DEBUG] Successfully parsed tasks:', tasks?.length || 0, 'tasks');

      // Transform tasks data for Kanban board
      const transformedColumns = {
        todo: { title: 'Todo', items: [] },
        doing: { title: 'Doing', items: [] },
        done: { title: 'Done', items: [] }
      };

      tasks.forEach(task => {
        const taskData = {
          id: task.id,
          title: task.title,
          description: task.description,
          assignee: 'Unassigned', // TODO: Add when assignee relation is implemented
          dueDate: task.dueDate,
          labels: task.labels || [],
          status: task.status.toLowerCase(),
          priority: 'medium',
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };

        const columnKey = task.status.toLowerCase();
        if (transformedColumns[columnKey]) {
          transformedColumns[columnKey].items.push(taskData);
        }
      });

      setColumns(transformedColumns);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load tasks on component mount
  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getItemValue = React.useCallback((item) => item.id, []);

  // Handle new task creation
  const handleTaskCreated = async (newTask) => {
    console.log('Task created:', newTask);

    // Refresh tasks from API to get the latest data
    await fetchTasks();
  };

  // Handle drag and drop status updates with proper persistence
  const handleMove = async (event) => {

    const { active, over } = event;

    if (!over) {
      console.log('🚨 [KANBAN DEBUG] No over element - user not hovering over a valid drop zone');
      return;
    }

    if (!active) {
      console.log('🚨 [KANBAN DEBUG] No active element - no item being dragged');
      return;
    }

    const activeTaskId = active.id;
    const overId = over.id;

    // Find the task being moved and its current column
    let sourceColumnId = null;
    let movedTask = null;
    let originalTask = null;

    for (const [columnId, column] of Object.entries(columns)) {
      const task = column.items.find(task => task.id === activeTaskId);
      if (task) {
        sourceColumnId = columnId;
        originalTask = task; // Keep original task for status comparison
        movedTask = { ...task, status: overId }; // Update status for optimistic update
        break;
      }
    }

    if (!movedTask || !sourceColumnId || !originalTask) {
      console.log('🚨 [KANBAN DEBUG] Moved task, source column, or original task not found!');
      return;
    }

    if (originalTask.status === overId) {
      console.log('🚨 [KANBAN DEBUG] Task already has this status, no update needed');
      return;
    }

    // console.log('🚀 [KANBAN DEBUG] ========== UPDATING TASK ==========');
    // console.log('🚀 [KANBAN DEBUG] Task:', movedTask.title, 'from', movedTask.status, 'to', overId);

    // Optimistic UI update - move task to new column immediately
    const updatedColumns = { ...columns };

    // Remove from source column
    updatedColumns[sourceColumnId] = {
      ...updatedColumns[sourceColumnId],
      items: updatedColumns[sourceColumnId].items.filter(task => task.id !== activeTaskId)
    };

    // Add to target column
    if (!updatedColumns[overId]) {
      updatedColumns[overId] = { title: overId.charAt(0).toUpperCase() + overId.slice(1), items: [] };
    }
    updatedColumns[overId] = {
      ...updatedColumns[overId],
      items: [...updatedColumns[overId].items, movedTask]
    };

    // Update local state immediately for smooth UX
    setColumns(updatedColumns);
    // console.log('🚀 [KANBAN DEBUG] Optimistic UI update applied');

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // console.log('🚀 [KANBAN DEBUG] Got session for user:', session.user.email);

      // Call API to update task status
      const apiUrl = `/api/tasks/${activeTaskId}`;
      // console.log('🚀 [KANBAN DEBUG] Making API call to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: overId.toUpperCase(),
        }),
      });

      // console.log('🚀 [KANBAN DEBUG] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        // console.log('🚨 [KANBAN DEBUG] API error response:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(errorData.error?.message || errorData.message || 'Failed to update task status');
      }

      const responseData = await response.json();
      // console.log('🚀 [KANBAN DEBUG] API success response:', responseData);
      // console.log('🚀 [KANBAN DEBUG] ========== UPDATE SUCCESSFUL ==========');

    } catch (err) {
      // console.error('🚨 [KANBAN DEBUG] ========== UPDATE FAILED ==========');
      // console.error('🚨 [KANBAN DEBUG] Error details:', err);

      // On error, revert the optimistic update by refreshing from API
      // console.log('🚨 [KANBAN DEBUG] Reverting optimistic update by refreshing from API');
      await fetchTasks();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-muted/30 rounded-lg min-h-[500px]">
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tasks</h1>
            </div>
            <TaskForm
              projectId={projectId}
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

        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load tasks</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchTasks} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
          </div>
          <TaskForm
            projectId={projectId}
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
        onMove={handleMove}
        getItemValue={getItemValue}
        className="h-[calc(100vh-12rem)]"
      >
        <KanbanBoard>
          {Object.entries(columns).map(([columnId, column]) => (
            <KanbanColumn key={columnId} value={columnId}>
              <div className="p-4 bg-muted/30 rounded-lg min-h-[500px]">
                <ColumnHeader title={column.title} count={column.items?.length || 0} />
                <KanbanColumnContent value={columnId}>
                  {column.items?.map((task) => (
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

            const allItems = Object.values(columns).flatMap(col => col.items || []);
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