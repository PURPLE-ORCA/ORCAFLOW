import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import prisma from '@/lib/prisma/client';

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

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Get the user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', user.id, 'Project ID:', projectId);

    // Check if user is an admin of the project
    console.log('Checking membership for user:', user.id, 'in project:', projectId);
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
        role: 'ADMIN',
      },
    });

    console.log('Membership found:', membership);

    // Debug: Check if user is the project creator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, createdBy: true }
    });
    console.log('Project details:', project);

    // Debug: Check all memberships for this project
    const allMemberships = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, email: true } } }
    });
    console.log('All project memberships:', allMemberships);

    if (!membership) {
      console.error('No admin membership found for user:', user.id, 'in project:', projectId);

      // Auto-fix: Add the project creator as an admin member if they're the creator
      if (project.createdBy === user.id) {
        console.log('User is project creator but missing admin membership. Auto-fixing...');
        try {
          await prisma.projectMember.create({
            data: {
              projectId,
              userId: user.id,
              role: 'ADMIN',
            },
          });
          console.log('Successfully added project creator as admin member');

          // Now proceed with the invitation since we fixed the membership
        } catch (fixError) {
          console.error('Failed to auto-fix admin membership:', fixError);
          return NextResponse.json(
            { error: 'Access denied. Only project admins can send invitations.' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Access denied. Only project admins can send invitations.' },
          { status: 403 }
        );
      }
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