import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import { getProjectAccess } from '@/lib/project-authz';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id, userId } = await params;
  const projectId = Number(id);
  const targetUserId = Number(userId);
  if (!Number.isInteger(projectId) || !Number.isInteger(targetUserId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project id or user id.' },
      { status: 400 },
    );
  }

  const actorRole = auth.session.user.role;
  const actorUserId = Number(auth.session.user.id);

  if (actorRole !== 'ADMIN') {
    const access = await getProjectAccess(projectId, actorUserId);
    if (!access.isPmInProject) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only project PMs can add members.' },
        { status: 403 },
      );
    }
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
    select: { id: true, roleInProject: true },
  });
  if (!membership) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Membership not found.' },
      { status: 404 },
    );
  }

  if (membership.roleInProject === 'PM') {
    const pmCount = await prisma.projectMember.count({
      where: { projectId, roleInProject: 'PM' },
    });

    if (pmCount <= 1) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cannot remove the last PM from the project.' },
        { status: 409 },
      );
    }
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });

  return NextResponse.json({ ok: true });
}
