import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';
import { prisma } from '@/lib/prisma/client';

// PUT /api/projects/[projectId]/invites/[invitationId] - Accept an invitation
export async function PUT(request, { params }) {
  try {
    const { projectId, invitationId } = await params;

    // Verify user is authenticated
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the invitation
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation belongs to the correct project
    if (invitation.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Invitation does not belong to this project' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation has already been processed' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      // Mark invitation as accepted but don't create duplicate membership
      await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'You are already a member of this project',
        alreadyMember: true
      });
    }

    // Create project membership
    await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.projectInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Successfully joined the project',
      project: {
        id: invitation.project.id,
        title: invitation.project.title,
      }
    });
  } catch (error) {
    console.error('Error accepting project invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/invites/[invitationId] - Cancel/decline an invitation
export async function DELETE(request, { params }) {
  try {
    const { projectId, invitationId } = await params;

    // Verify user is authenticated
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the invitation
    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation belongs to the correct project
    if (invitation.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Invitation does not belong to this project' },
        { status: 400 }
      );
    }

    // Check if user is the inviter (can cancel) or the invitee (can decline)
    const canModify = user.id === invitation.invitedBy || user.email === invitation.email;

    if (!canModify) {
      return NextResponse.json(
        { error: 'Access denied. You can only cancel invitations you sent or received.' },
        { status: 403 }
      );
    }

    // Update invitation status
    await prisma.projectInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling project invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}