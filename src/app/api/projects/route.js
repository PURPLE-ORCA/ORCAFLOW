import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    // Hardcoded user ID for now. This will be replaced with the
    // authenticated user's ID in a future step.
    const createdBy = 'HARDCODED_USER_ID';

    const project = await prisma.project.create({
      data: {
        title,
        description,
        createdBy,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}