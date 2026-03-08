import { NextResponse } from 'next/server';
import { requireSession, canViewProject } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { WorkItemStatus } from '@prisma/client';

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
    include: {
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ data: workItems });
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const session = auth.session;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project ID.' },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, startDate: true, endDate: true, archivedAt: true },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  if (project.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot add work items to an archived project.' },
      { status: 409 },
    );
  }

  const actorRole = session.user.role;
  const userId = Number(session.user.id);

  let canCreate = false;

  if (actorRole === 'ADMIN') {
    canCreate = true;
  } else if (actorRole === 'PM') {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { roleInProject: true },
    });
    canCreate = membership?.roleInProject === 'PM';
  }

  if (!canCreate) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'You do not have permission to add work items to this project.',
      },
      { status: 403 },
    );
  }

  let body: {
    title?: unknown;
    description?: unknown;
    plannedStartDate?: unknown;
    plannedEndDate?: unknown;
    assignedUserId?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string' && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  const plannedStartDate =
    typeof body.plannedStartDate === 'string' && body.plannedStartDate.trim().length > 0
      ? new Date(body.plannedStartDate)
      : null;

  const plannedEndDate =
    typeof body.plannedEndDate === 'string' && body.plannedEndDate.trim().length > 0
      ? new Date(body.plannedEndDate)
      : null;

  const assignedUserId =
    body.assignedUserId === null || body.assignedUserId === undefined || body.assignedUserId === ''
      ? null
      : Number(body.assignedUserId);

  if (!title) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Titlul activității este obligatoriu.' },
      { status: 400 },
    );
  }

  if (!plannedEndDate || Number.isNaN(plannedEndDate.getTime())) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Data finală planificată este obligatorie și trebuie să fie validă.',
      },
      { status: 400 },
    );
  }

  if (plannedStartDate && Number.isNaN(plannedStartDate.getTime())) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Data de început planificată este invalidă.' },
      { status: 400 },
    );
  }

  if (plannedStartDate && plannedEndDate < plannedStartDate) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Data finală planificată nu poate fi mai mică decât data de început.',
      },
      { status: 400 },
    );
  }

  // regulă recomandată: plannedEndDate în intervalul proiectului
  if (plannedEndDate < project.startDate || plannedEndDate > project.endDate) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Data finală planificată trebuie să fie în intervalul proiectului.',
      },
      { status: 400 },
    );
  }

  if (plannedStartDate && plannedStartDate < project.startDate) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Data de început planificată nu poate fi înainte de începutul proiectului.',
      },
      { status: 400 },
    );
  }

  if (plannedStartDate && plannedStartDate > project.endDate) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Data de început planificată nu poate fi după finalul proiectului.',
      },
      { status: 400 },
    );
  }

  if (assignedUserId !== null) {
    if (!Number.isInteger(assignedUserId)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Utilizatorul alocat este invalid.' },
        { status: 400 },
      );
    }

    const assignedMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assignedUserId,
        },
      },
      select: { userId: true },
    });

    if (!assignedMembership) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Utilizatorul alocat trebuie să fie membru al proiectului.',
        },
        { status: 400 },
      );
    }
  }

  const created = await prisma.workItem.create({
    data: {
      projectId,
      title,
      description,
      plannedStartDate,
      plannedEndDate,
      assignedUserId,
      progressPercent: 0,
      status: WorkItemStatus.TODO,
    },
    include: {
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
