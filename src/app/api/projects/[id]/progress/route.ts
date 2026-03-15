import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, canViewProject } from '@/lib/authz';
import { computeProjectProgressHelper } from '@/lib/work-items/progress';

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

  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'ID-ul proiectului este invalid.' },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Proiectul nu a fost găsit.' },
      { status: 404 },
    );
  }

  const allowed = await canViewProject(auth.session, projectId);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Nu ai acces la acest proiect.' },
      { status: 403 },
    );
  }

  const result = await computeProjectProgressHelper(projectId);

  return NextResponse.json(result);
}