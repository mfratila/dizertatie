import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import { Role, WorkItemStatus } from '@prisma/client';

type RouteContext = {
  params: Promise<{ workItemId: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireSession();

  if (!auth.ok) {
    return auth.response;
  }

  const session = auth.session;
  const actorUserId = Number(session.user.id);
  const actorRole = session.user.role;

  const { workItemId } = await context.params;
  const parsedWorkItemId = Number(workItemId);

  if (!Number.isInteger(parsedWorkItemId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'ID-ul activității este invalid.' },
      { status: 400 },
    );
  }

  const current = await prisma.workItem.findUnique({
    where: { id: parsedWorkItemId },
    select: {
      id: true,
      projectId: true,
      assignedUserId: true,
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

  if (current.project.archivedAt) {
    return NextResponse.json(
      {
        error: 'Conflict',
        message: 'Activitățile dintr-un proiect arhivat nu mai pot fi modificate.',
      },
      { status: 409 },
    );
  }

  const isAdmin = actorRole === Role.ADMIN;
  let isProjectPm = false;
  let isAssignedMember = false;

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

    if (membership?.roleInProject === Role.PM) {
      isProjectPm = true;
    }

    if (
      membership?.roleInProject === Role.MEMBER &&
      current.assignedUserId === actorUserId
    ) {
      isAssignedMember = true;
    }
  }

  if (!isAdmin && !isProjectPm && !isAssignedMember) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message:
          'Nu ai permisiunea de a actualiza progresul acestei activități.',
      },
      { status: 403 },
    );
  }

  let body: { progressPercent?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Payload JSON invalid.' },
      { status: 400 },
    );
  }

  const progressPercent = Number(body.progressPercent);

  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Progresul trebuie să fie un număr întreg între 0 și 100.',
      },
      { status: 400 },
    );
  }

  let status: WorkItemStatus;

  if (progressPercent === 0) {
    status = WorkItemStatus.TODO;
  } else if (progressPercent === 100) {
    status = WorkItemStatus.DONE;
  } else {
    status = WorkItemStatus.IN_PROGRESS;
  }

  const updated = await prisma.workItem.update({
    where: { id: parsedWorkItemId },
    data: {
      progressPercent,
      status,
    },
    select: {
      id: true,
      projectId: true,
      title: true,
      status: true,
      progressPercent: true,
      plannedEndDate: true,
      assignedUserId: true,
      updatedAt: true,
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}
