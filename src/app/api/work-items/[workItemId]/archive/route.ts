import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import { Role } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const auth = await requireSession();

  if (!auth.ok) {
    return auth.response;
  }

  const session = auth.session;
  const actorUserId = Number(session.user.id);
  const actorRole = session.user.role;

  const { id } = await context.params;
  const workItemId = Number(id);

  if (!Number.isInteger(workItemId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'ID-ul activității este invalid.' },
      { status: 400 },
    );
  }

  const current = await prisma.workItem.findUnique({
    where: { id: workItemId },
    select: {
      id: true,
      archivedAt: true,
      projectId: true,
      project: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Activitatea nu a fost găsită.' },
      { status: 404 },
    );
  }

  if (current.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Activitatea este deja arhivată.' },
      { status: 409 },
    );
  }

  if (current.project.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Nu poți arhiva activități dintr-un proiect deja arhivat.' },
      { status: 409 },
    );
  }

  const isAdmin = actorRole === Role.ADMIN;
  let isProjectPm = false;

  if (!isAdmin) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: actorUserId,
        },
      },
      select: { roleInProject: true },
    });

    isProjectPm = membership?.roleInProject === Role.PM;
  }

  if (!isAdmin && !isProjectPm) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Doar PM-ul proiectului sau un administrator poate arhiva activități.',
      },
      { status: 403 },
    );
  }

  const archived = await prisma.workItem.update({
    where: { id: workItemId },
    data: {
      archivedAt: new Date(),
    },
    select: {
      id: true,
      projectId: true,
      archivedAt: true,
    },
  });

  return NextResponse.json(archived);
}