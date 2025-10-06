import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { prisma } from '@/lib/prisma/client';

// GET /api/projects/[projectId]/invites - List pending invitations for a project
export async function GET(request, { params }) {
  try {
    const { projectId } = await params;

    // Verify user is authenticated
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a member of the project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this project.' },
        { status: 403 }
      );
    }

    // Get all pending invitations for the project
    const invitations = await prisma.projectInvitation.findMany({
      where: {
        projectId,
        status: 'PENDING',
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching project invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/invites - Create a new invitation
export async function POST(request, { params }) {
  try {
    const { projectId } = await params;

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
        { error: 'Access denied. Only project admins can send invitations.' },
        { status: 403 }
      );
    }

    const { email, role = 'MEMBER' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMembership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this project' },
          { status: 400 }
        );
      }
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.projectInvitation.findUnique({
      where: {
        projectId_email: {
          projectId,
          email,
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'There is already a pending invitation for this email' },
        { status: 400 }
      );
    }

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = await prisma.projectInvitation.create({
      data: {
        projectId,
        email,
        role,
        invitedBy: user.id,
        expiresAt,
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // TODO: Send invitation email here
    // For now, we'll just return the invitation

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error creating project invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}