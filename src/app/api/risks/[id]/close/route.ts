import { NextResponse } from 'next/server';
import { RiskStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM]);
  if (!authz.ok) return authz.response;

  const session = auth.session;
  const actorUserId = Number(session.user.id);

  if (!Number.isInteger(actorUserId)) {
    return NextResponse.json({ error: 'Invalid session user id' }, { status: 500 });
  }

  const { id: idParam } = await params;
  const riskId = Number(idParam);

  if (!Number.isInteger(riskId) || riskId <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid risk id.' },
      { status: 400 },
    );
  }

  const current = await prisma.risk.findUnique({
    where: { id: riskId },
    select: {
      id: true,
      projectId: true,
      status: true,
      project: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Risk not found.' },
      { status: 404 },
    );
  }

  if (current.project.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot close risks from an archived project.' },
      { status: 409 },
    );
  }

  if (session.user.role !== Role.ADMIN) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: actorUserId,
        },
      },
      select: {
        roleInProject: true,
      },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only project PM/Admin can close risks.' },
        { status: 403 },
      );
    }
  }

  const updated = await prisma.risk.update({
    where: { id: riskId },
    data: {
      status: RiskStatus.CLOSED,
    },
    select: {
      id: true,
      title: true,
      probability: true,
      impact: true,
      status: true,
      ownerUserId: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}