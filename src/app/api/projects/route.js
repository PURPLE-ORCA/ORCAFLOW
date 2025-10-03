import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma/client';

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Get the user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    console.log('Creating project for user:', user.id);

    // Ensure user exists in our profiles table (auto-sync with Supabase Auth)
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

    const project = await prisma.project.create({
      data: {
        title,
        description,
        createdBy: user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    // Handle specific Prisma prepared statement errors
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.log('Prepared statement conflict detected during creation, retrying...');

      // Wait a moment and retry once
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // First, ensure the user exists in our database
        let dbUser = await prisma.user.findUnique({
          where: { id: user.id }
        });
    
        if (!dbUser) {
          // Create the user in our database if they don't exist
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || null,
              avatar: user.user_metadata?.avatar_url || null,
            }
          });
          console.log('Created new user in database:', dbUser.id);
        }
    
        const project = await prisma.project.create({
          data: {
            title,
            description,
            createdBy: user.id,
          },
        });
        return NextResponse.json(project, { status: 201 });
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return NextResponse.json({ error: 'Failed to create project after retry' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Use a simpler query approach to avoid prepared statement conflicts
    const projects = await prisma.$queryRaw`
      SELECT id, title, description, "createdAt", "updatedAt", "createdBy"
      FROM projects
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);

    // Handle specific Prisma prepared statement errors
    if (error.code === '42P05' || error.message?.includes('prepared statement')) {
      console.log('Prepared statement conflict detected, retrying with raw query...');

      // Wait a moment and retry once with raw query
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const projects = await prisma.$queryRaw`
          SELECT id, title, description, "createdAt", "updatedAt", "createdBy"
          FROM projects
          ORDER BY "createdAt" DESC
        `;
        return NextResponse.json(projects, { status: 200 });
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return NextResponse.json({ error: 'Failed to fetch projects after retry' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}