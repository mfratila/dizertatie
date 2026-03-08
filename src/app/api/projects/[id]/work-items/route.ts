import { NextResponse } from 'next/server';
import { requireSession, canViewProject } from '@/lib/authz';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project ID.' },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, archivedAt: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  const allowed = await canViewProject(auth.session, projectId);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You do not have access to this project.' },
      { status: 403 },
    );
  }

  const workItems = await prisma.workItem.findMany({
    where: { projectId },
    orderBy: [{ plannedEndDate: 'asc' }, { createdAt: 'asc' }],
  });
}
