import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { requireSession, requireRole } from '@/lib/authz';

type CreateTimesheetInput = {
  workItemId: number;
  date: string; // ISO date
  hours: number;
  note?: string;
};

function validate(input: CreateTimesheetInput) {
  if (!Number.isInteger(input.workItemId) || input.workItemId <= 0) {
    return { ok: false as const, message: 'workItemId must be a positive integer.' };
  }

  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, message: 'Invalid date.' };
  }

  if (typeof input.hours !== 'number' || Number.isNaN(input.hours)) {
    return { ok: false as const, message: 'hours must be a number.' };
  }

  if (input.hours <= 0) {
    return { ok: false as const, message: 'hours must be > 0.' };
  }

  if (input.hours > 24) {
    return { ok: false as const, message: 'hours must be <= 24.' };
  }

  const note = input.note?.trim();
  if (note && note.length > 500) {
    return { ok: false as const, message: 'note must be at most 500 characters.' };
  }

  return {
    ok: true as const,
    date,
    note: note || null,
  };
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM, Role.MEMBER, Role.VIEWER]);
  if (!authz.ok) return authz.response;

  const session = auth.session;
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Invalid session user id' }, { status: 500 });
  }

  const { id: projectIdParam } = await params;
  const projectId = Number(projectIdParam);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid projectId.' },
      { status: 400 },
    );
  }

  if (session.user.role !== Role.ADMIN) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this project.' },
        { status: 403 },
      );
    }
  }

  const { searchParams } = new URL(request.url);

  const fromRaw = searchParams.get('from')?.trim() ?? '';
  const toRaw = searchParams.get('to')?.trim() ?? '';
  const userIdRaw = searchParams.get('userId')?.trim() ?? '';

  let from: Date | null = null;
  let to: Date | null = null;
  let filterUserId: number | null = null;

  if (fromRaw) {
    from = new Date(fromRaw);
    if (!isValidDate(from)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid from date.' },
        { status: 400 },
      );
    }
  }

  if (toRaw) {
    to = new Date(toRaw);
    if (!isValidDate(to)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid to date.' },
        { status: 400 },
      );
    }

    // include to-day fully
    to.setHours(23, 59, 59, 999);
  }

  if (from && to && to.getTime() < from.getTime()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'to must be >= from.' },
      { status: 400 },
    );
  }

  if (userIdRaw) {
    filterUserId = Number(userIdRaw);

    if (!Number.isInteger(filterUserId) || filterUserId <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'userId must be a positive integer.' },
        { status: 400 },
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: filterUserId,
        },
      },
      select: { userId: true },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'The selected user is not a member of this project.',
        },
        { status: 400 },
      );
    }
  }

  const where: Prisma.TimesheetWhereInput = {
    workItem: {
      projectId,
    },
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(filterUserId ? { userId: filterUserId } : {}),
  };

  const timesheets = await prisma.timesheet.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      date: true,
      hours: true,
      note: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      workItem: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return NextResponse.json({ data: timesheets });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM, Role.MEMBER]);
  if (!authz.ok) return authz.response;

  const session = auth.session;
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Invalid session user id' }, { status: 500 });
  }

  const { id: projectIdParam } = await params;
  const projectId = Number(projectIdParam);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: `Invalid projectId.` },
      { status: 400 },
    );
  }

  const role = session.user.role;

  if (role !== Role.ADMIN) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this project.' },
        { status: 403 },
      );
    }
  }

  const body = (await request.json()) as CreateTimesheetInput;

  const validatedBody = validate(body);
  if (!validatedBody.ok) {
    return NextResponse.json(
      { error: 'Bad Request', message: validatedBody.message },
      { status: 400 },
    );
  }

  const workItem = await prisma.workItem.findUnique({
    where: { id: body.workItemId },
    select: {
      id: true,
      projectId: true,
      archivedAt: true,
    },
  });

  if (!workItem) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Work item not found.' },
      { status: 404 },
    );
  }

  if (workItem.projectId !== projectId) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'The selected work item does not belong to this project.',
      },
      { status: 400 },
    );
  }

  if (workItem.archivedAt) {
    return NextResponse.json(
      {
        error: 'Conflict',
        message: 'Cannot log time on an archived work item.',
      },
      { status: 409 },
    );
  }

  const created = await prisma.timesheet.create({
    data: {
      userId,
      workItemId: body.workItemId,
      date: validatedBody.date,
      hours: new Prisma.Decimal(body.hours),
      note: validatedBody.note,
    },
    select: {
      id: true,
      date: true,
      hours: true,
      note: true,
      createdAt: true,
      workItem: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
      user: {
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