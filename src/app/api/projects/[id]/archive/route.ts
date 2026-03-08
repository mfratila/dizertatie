import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';
import { Role } from '@prisma/client';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM]);
  if (!authz.ok) return authz.response;

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project id.' },
      { status: 400 },
    );
  }

  const session = auth.session;
  const userId = Number(session.user.id);
  const role = session.user.role;

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

  if (project.archivedAt) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Project is already archived.' },
      { status: 400 },
    );
  }

  if (role === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { projectId: true, roleInProject: true },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You are not the PM of this project.' },
        { status: 403 },
      );
    }
  }

  const archived = await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: new Date() },
    select: {
      id: true,
      name: true,
      archivedAt: true,
    },
  });

  return NextResponse.json({ data: archived });
}
