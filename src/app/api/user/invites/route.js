import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { prisma } from '@/lib/prisma/client';

// GET /api/user/invites - Fetch all pending invitations for the current user
export async function GET(request) {
  try {
    // Verify user is authenticated
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all pending invitations for the current user across all projects
    const invitations = await prisma.projectInvitation.findMany({
      where: {
        email: user.email,
        status: 'PENDING',
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
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

    // Transform the data to include projectId at the top level for easier access
    const transformedInvitations = invitations.map(invitation => ({
      ...invitation,
      projectId: invitation.project.id, // Add projectId at the top level
    }));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching user invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}