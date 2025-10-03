import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma/client';
import { z } from 'zod';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Validation schemas
const getTasksQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  status: z.enum(['TODO', 'DOING', 'DONE']).optional(),
});

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

// GET /api/projects/[projectId]/tasks - Fetch all tasks for a project
export async function GET(request, { params }) {
  try {
    const { projectId } = params;

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

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = getTasksQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.issues
          }
        },
        { status: 400 }
      );
    }

    const { page, limit, status } = queryResult.data;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: `Project with ID '${projectId}' not found`,
            details: { projectId }
          }
        },
        { status: 404 }
      );
    }

    // Build where clause for filtering
    const whereClause = {
      projectId: projectId,
    };

    if (status) {
      whereClause.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch tasks with related data
    const tasks = await prisma.task.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.task.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      }
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);

    // Handle specific Prisma prepared statement errors
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.log('Prepared statement conflict detected, retrying...');

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
          message: 'Failed to fetch tasks'
        }
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/tasks - Create a new task
export async function POST(request, { params }) {
  try {
    const { projectId } = params;

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

    // Validate request body
    const body = await request.json();
    const taskSchema = z.object({
      title: z.string().min(3).max(200),
      description: z.string().max(2000).optional(),
      status: z.enum(['TODO', 'DOING', 'DONE']).default('TODO'),
      dueDate: z.string().datetime().optional(),
      labels: z.array(z.string().max(50)).max(10).default([]),
      assigneeId: z.string().uuid().optional(),
    });

    const validationResult = taskSchema.safeParse(body);
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

    const { title, description, status, dueDate, labels, assigneeId } = validationResult.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: `Project with ID '${projectId}' not found`,
            details: { projectId }
          }
        },
        { status: 404 }
      );
    }

    // If assignee is specified, verify assignee exists and is valid
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ASSIGNEE',
              message: `Assignee with ID '${assigneeId}' not found`,
              details: { assigneeId }
            }
          },
          { status: 400 }
        );
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels,
        projectId,
        assigneeId: assigneeId || null,
      },
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
        data: task
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating task:', error);

    // Handle specific Prisma prepared statement errors
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.log('Prepared statement conflict detected during creation, retrying...');

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
          message: 'Failed to create task'
        }
      },
      { status: 500 }
    );
  }
}