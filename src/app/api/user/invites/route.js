import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import prisma from '@/lib/prisma/client';

// GET /api/user/invites - Fetch all pending invitations for the current user
export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('API /api/user/invites: No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('API /api/user/invites: No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Get the user from the JWT token
    // First, let's log the token structure for debugging
    console.log('API /api/user/invites: Token analysis:', {
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...',
      hasToken: !!token
    });
    
    // Try to get the user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('API /api/user/invites: Auth check:', {
      hasAuthError: !!authError,
      authErrorMessage: authError?.message,
      authErrorDetails: authError,
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id
    });

    if (authError || !user) {
      console.log('API /api/user/invites: Authentication failed');
      console.log('API /api/user/invites: Auth error details:', authError);
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message || 'No user found' },
        { status: 401 }
      );
    }

    console.log('API /api/user/invites: Authenticated user:', user.id, user.email);

    // Ensure user exists in our database (auto-sync with Supabase Auth)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      // Create the user profile in our database
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
          avatar: user.user_metadata?.avatar_url || null,
        }
      });
      console.log('Created new user profile in database:', dbUser.id);
    }

    // Check if projectInvitation table exists
    console.log('API /api/user/invites: Checking database connection...');
    
    // Test database connection with a simple query
    const testConnection = await prisma.$queryRaw`SELECT 1`;
    console.log('API /api/user/invites: Database connection test:', testConnection);
    
    // Check if projectInvitation table exists by trying to query it
    try {
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
      
      console.log('API /api/user/invites: Found invitations:', invitations.length);
      
      // Transform the data to include projectId at the top level for easier access
      const transformedInvitations = invitations.map(invitation => ({
        ...invitation,
        projectId: invitation.project.id, // Add projectId at the top level
      }));

      return NextResponse.json({ invitations: transformedInvitations });
      
    } catch (dbError) {
      console.error('API /api/user/invites: Database error:', dbError);
      console.error('API /api/user/invites: Error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      
      // Check if the table doesn't exist
      if (dbError.code === 'P2002' || dbError.message?.includes('relation') || dbError.message?.includes('table')) {
        console.log('API /api/user/invites: Table likely does not exist or has wrong name');
        return NextResponse.json(
          { error: 'Database table not found. Please run migrations.' },
          { status: 500 }
        );
      }
      
      // Re-throw other database errors
      throw dbError;
    }

  } catch (error) {
    console.error('Error fetching user invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}