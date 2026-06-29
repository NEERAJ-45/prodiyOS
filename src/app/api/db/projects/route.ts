import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Project from '@/lib/models/Project';
import { logActivity } from '@/lib/activity-logger';

function computeProgress(features?: { done?: boolean }[]): number {
  if (!features?.length) return 0;
  const done = features.filter((f) => f.done).length;
  return Math.round((done / features.length) * 100);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || request.headers.get('x-user-email') || '';

    if (!userEmail) {
      return NextResponse.json({ projects: [] });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ projects: [] });
    }

    const projects = await Project.find({ userEmail }).sort({ id: -1 }).lean();
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, ...projectData } = body;

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const project = await Project.create({
      ...projectData,
      id: projectData.id || `p-${Date.now()}`,
      userEmail,
      progress: computeProgress(projectData.features),
    });

    logActivity(userEmail, `Created project "${projectData.name}"`);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Project.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = await Project.findOneAndUpdate(
      { id },
      { $set: { ...body, progress: computeProgress(body.features) } },
      { new: true, runValidators: true }
    ).lean();

    logActivity(existing.userEmail, `Updated project "${project.name}"`);

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const customUri = request.headers.get('x-mongodb-url') || undefined;
    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const existing = await Project.findOne({ id });
    if (existing) {
      logActivity(existing.userEmail, `Deleted project "${existing.name}"`);
    }

    await Project.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
