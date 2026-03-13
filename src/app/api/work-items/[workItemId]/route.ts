import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import { Role, WorkItemStatus } from '@prisma/client';

type RouteContext = {
  params: Promise<{ workItemId: string }>;
};

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

export async function PATCH(req: Request, context: RouteContext) {
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
      progressPercent: true,
      project: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
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
      { error: 'Conflict', message: 'Activitățile dintr-un proiect arhivat nu mai pot fi modificate.' },
      { status: 409 },
    );
  }

  let canEdit = false;

  if (actorRole === Role.ADMIN) {
    canEdit = true;
  } else if (actorRole === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: actorUserId,
        },
      },
      select: { roleInProject: true },
    });

    canEdit = membership?.roleInProject === Role.PM;
  }

  if (!canEdit) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Doar PM-ul proiectului sau un administrator poate modifica detaliile activității.',
      },
      { status: 403 },
    );
  }

  let body: {
    title?: unknown;
    plannedEndDate?: unknown;
    assignedUserId?: unknown;
    status?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Payload JSON invalid.' },
      { status: 400 },
    );
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const plannedEndDate =
    typeof body.plannedEndDate === 'string' && body.plannedEndDate.trim().length > 0
      ? new Date(body.plannedEndDate)
      : null;

  const assignedUserId =
    body.assignedUserId === null ||
    body.assignedUserId === undefined ||
    body.assignedUserId === ''
      ? null
      : Number(body.assignedUserId);

  if (!title) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Titlul activității este obligatoriu.' },
      { status: 400 },
    );
  }

  if (!plannedEndDate || !isValidDate(plannedEndDate)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Data finală planificată este obligatorie și trebuie să fie validă.' },
      { status: 400 },
    );
  }

  if (plannedEndDate.getTime() < current.project.startDate.getTime() ||
      plannedEndDate.getTime() > current.project.endDate.getTime()) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Data finală planificată trebuie să fie în intervalul proiectului.',
      },
      { status: 400 },
    );
  }

  const allowedStatuses = Object.values(WorkItemStatus);
  if (!allowedStatuses.includes(status as WorkItemStatus)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Status invalid.' },
      { status: 400 },
    );
  }

  // Coerență status <-> progress
  if (status === WorkItemStatus.TODO && current.progressPercent !== 0) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'O activitate cu status "TODO" trebuie să aibă progres 0%.',
      },
      { status: 400 },
    );
  }

  if (status === WorkItemStatus.DONE && current.progressPercent !== 100) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'O activitate cu status "DONE" trebuie să aibă progres 100%.',
      },
      { status: 400 },
    );
  }

  if (
    status === WorkItemStatus.IN_PROGRESS &&
    (current.progressPercent <= 0 || current.progressPercent >= 100)
  ) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'O activitate "IN_PROGRESS" trebuie să aibă progres între 1% și 99%.',
      },
      { status: 400 },
    );
  }

  if (assignedUserId !== null) {
    if (!Number.isInteger(assignedUserId)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Responsabil invalid.' },
        { status: 400 },
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: assignedUserId,
        },
      },
      select: { userId: true },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Responsabilul trebuie să fie membru al proiectului.',
        },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.workItem.update({
    where: { id: parsedWorkItemId },
    data: {
      title,
      plannedEndDate,
      assignedUserId,
      status: status as WorkItemStatus,
    },
    select: {
      id: true,
      projectId: true,
      title: true,
      description: true,
      plannedStartDate: true,
      plannedEndDate: true,
      status: true,
      progressPercent: true,
      assignedUserId: true,
      createdAt: true,
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
