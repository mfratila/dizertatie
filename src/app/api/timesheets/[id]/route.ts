import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';

type UpdateTimesheetInput = {
  date: string;
  hours: number;
  note?: string;
};

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function validateUpdate(input: UpdateTimesheetInput) {
  const date = new Date(input.date);

  if (!isValidDate(date)) {
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

  const note = input.note?.trim() ?? '';
  if (note.length > 500) {
    return { ok: false as const, message: 'note must be at most 500 characters.' };
  }

  return {
    ok: true as const,
    date,
    note: note || null,
  };
}

async function canManageTimesheet(
  session: { user: { id: string; role: Role } },
  timesheet: {
    userId: number;
    workItem: {
      projectId: number;
      archivedAt: Date | null;
      project: { archivedAt: Date | null };
    };
  },
) {
  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return {
      ok: false as const,
      status: 500,
      message: 'Invalid session user id.',
    };
  }

  if (session.user.role === Role.ADMIN) {
    return { ok: true as const, actorUserId };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: timesheet.workItem.projectId,
        userId: actorUserId,
      },
    },
    select: {
      roleInProject: true,
    },
  });

  if (!membership) {
    return {
      ok: false as const,
      status: 403,
      message: 'Forbidden. You do not have access to this project.',
    };
  }

  if (membership.roleInProject === Role.PM) {
    return { ok: true as const, actorUserId };
  }

  if (membership.roleInProject === Role.MEMBER && timesheet.userId === actorUserId) {
    return { ok: true as const, actorUserId };
  }

  return {
    ok: false as const,
    status: 403,
    message: 'Forbidden. You cannot modify this timesheet entry.',
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM, Role.MEMBER]);
  if (!authz.ok) return authz.response;

  const { id: idParam } = await params;
  const timesheetId = Number(idParam);

  if (!Number.isInteger(timesheetId) || timesheetId <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid timesheet id.' },
      { status: 400 },
    );
  }

  const current = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    select: {
      id: true,
      userId: true,
      workItem: {
        select: {
          id: true,
          projectId: true,
          archivedAt: true,
          project: {
            select: {
              archivedAt: true,
            },
          },
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Timesheet entry not found.' },
      { status: 404 },
    );
  }

  if (current.workItem.project.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot modify timesheets from an archived project.' },
      { status: 409 },
    );
  }

  if (current.workItem.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot modify timesheets for an archived work item.' },
      { status: 409 },
    );
  }

  const access = await canManageTimesheet(auth.session, current);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 500 ? 'Internal Server Error' : 'Forbidden', message: access.message },
      { status: access.status },
    );
  }

  const body = (await request.json()) as UpdateTimesheetInput;

  const validatedBody = validateUpdate(body);
  if (!validatedBody.ok) {
    return NextResponse.json(
      { error: 'Bad Request', message: validatedBody.message },
      { status: 400 },
    );
  }

  const updated = await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
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
          projectId: true,
        },
      },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM, Role.MEMBER]);
  if (!authz.ok) return authz.response;

  const { id: idParam } = await params;
  const timesheetId = Number(idParam);

  if (!Number.isInteger(timesheetId) || timesheetId <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid timesheet id.' },
      { status: 400 },
    );
  }

  const current = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    select: {
      id: true,
      userId: true,
      workItem: {
        select: {
          id: true,
          projectId: true,
          archivedAt: true,
          project: {
            select: {
              archivedAt: true,
            },
          },
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Timesheet entry not found.' },
      { status: 404 },
    );
  }

  if (current.workItem.project.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot delete timesheets from an archived project.' },
      { status: 409 },
    );
  }

  if (current.workItem.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot delete timesheets for an archived work item.' },
      { status: 409 },
    );
  }

  const access = await canManageTimesheet(auth.session, current);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 500 ? 'Internal Server Error' : 'Forbidden', message: access.message },
      { status: access.status },
    );
  }

  await prisma.timesheet.delete({
    where: { id: timesheetId },
  });

  return NextResponse.json({ ok: true as const });
}