import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import prisma from '@/lib/prisma/client';

// DELETE /api/projects/[projectId]/members/[userId] - Remove a member from a project
export async function DELETE(request, { params }) {
  try {
    const { projectId, userId } = await params;

    // Verify user is authenticated
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an admin of the project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
        role: 'ADMIN',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied. Only project admins can remove members.' },
        { status: 403 }
      );
    }

    // Prevent removing the project creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project.createdBy === userId) {
      return NextResponse.json(
        { error: 'Cannot remove the project creator from the project.' },
        { status: 400 }
      );
    }

    // Remove member from project
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId,
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}