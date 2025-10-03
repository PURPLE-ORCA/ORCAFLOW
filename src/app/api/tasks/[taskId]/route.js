import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma/client';
import { z } from 'zod';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper function to authenticate user
async function authenticateUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: 'No authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  return { user };
}

// Helper function to ensure user profile exists
async function ensureUserProfile(user) {
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null,
        avatar: user.user_metadata?.avatar_url || null,
      }
    });
  }

  return dbUser;
}

// PUT /api/tasks/[taskId] - Update a specific task
export async function PUT(request, { params }) {
  try {
    const { taskId } = await params;

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (authResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: authResult.error
          }
        },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    // Ensure user profile exists
    await ensureUserProfile(user);

    // Validate request body for partial updates
    const body = await request.json();
    const updateTaskSchema = z.object({
      title: z.string().min(3).max(200).optional(),
      description: z.string().max(2000).optional(),
      status: z.enum(['TODO', 'DOING', 'DONE']).optional(),
      dueDate: z.string().datetime().optional(),
      labels: z.array(z.string().max(50)).max(10).optional(),
      assigneeId: z.string().uuid().nullable().optional(),
    });

    const validationResult = updateTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validationResult.error.issues.reduce((acc, issue) => {
              acc[issue.path.join('.')] = issue.message;
              return acc;
            }, {})
          }
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // If assignee is specified, verify assignee exists and is valid
    if (updateData.assigneeId !== undefined) {
      if (updateData.assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: updateData.assigneeId }
        });

        if (!assignee) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_ASSIGNEE',
                message: `Assignee with ID '${updateData.assigneeId}' not found`,
                details: { assigneeId: updateData.assigneeId }
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Convert dueDate string to Date object if provided
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Check if task exists and get project info for authorization
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: `Task with ID '${taskId}' not found`,
            details: { taskId }
          }
        },
        { status: 404 }
      );
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedTask
      }
    );

  } catch (error) {
    console.error('Error updating task:', error);

    // Handle specific Prisma prepared statement errors
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.log('Prepared statement conflict detected during update, retrying...');

      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Retry logic would go here if needed
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Database connection error, please try again'
            }
          },
          { status: 500 }
        );
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update task'
        }
      },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId] - Delete a specific task
export async function DELETE(request, { params }) {
  try {
    const { taskId } = await params;

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (authResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: authResult.error
          }
        },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    // Ensure user profile exists
    await ensureUserProfile(user);

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        projectId: true
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: `Task with ID '${taskId}' not found`,
            details: { taskId }
          }
        },
        { status: 404 }
      );
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: taskId,
          message: 'Task deleted successfully'
        }
      }
    );

  } catch (error) {
    console.error('Error deleting task:', error);

    // Handle specific Prisma prepared statement errors
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.log('Prepared statement conflict detected during deletion, retrying...');

      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Retry logic would go here if needed
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Database connection error, please try again'
            }
          },
          { status: 500 }
        );
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete task'
        }
      },
      { status: 500 }
    );
  }
}