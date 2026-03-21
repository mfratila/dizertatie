import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';

type CreateCostEntryInput = {
  date: string;
  amount: number;
  category?: string;
  note?: string;
};

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function validate(input: CreateCostEntryInput) {
  const date = new Date(input.date);

  if (!isValidDate(date)) {
    return { ok: false as const, message: 'Invalid date.' };
  }

  if (typeof input.amount !== 'number' || Number.isNaN(input.amount)) {
    return { ok: false as const, message: 'amount must be a number.' };
  }

  if (input.amount <= 0) {
    return { ok: false as const, message: 'amount must be > 0.' };
  }

  const category = input.category?.trim() ?? '';
  if (category && !['Labor', 'Tools', 'Other'].includes(category)) {
    return { ok: false as const, message: 'Invalid category.' };
  }

  const note = input.note?.trim() ?? '';
  if (note.length > 500) {
    return { ok: false as const, message: 'note must be at most 500 characters.' };
  }

  return {
    ok: true as const,
    date,
    category: category || null,
    note: note || null,
  };
}

export async function POST(
  request: Request,
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
          userId: actorUserId,
        },
      },
      select: {
        roleInProject: true,
      },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only project PM/Admin can add cost entries.' },
        { status: 403 },
      );
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      archivedAt: true,
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  if (project.archivedAt) {
    return NextResponse.json(
      { error: 'Conflict', message: 'Cannot add costs to an archived project.' },
      { status: 409 },
    );
  }

  const body = (await request.json()) as CreateCostEntryInput;

  const validatedBody = validate(body);
  if (!validatedBody.ok) {
    return NextResponse.json(
      { error: 'Bad Request', message: validatedBody.message },
      { status: 400 },
    );
  }

  const created = await prisma.costEntry.create({
    data: {
      projectId,
      date: validatedBody.date,
      amount: new Prisma.Decimal(body.amount),
      category: validatedBody.category,
      note: validatedBody.note,
    },
    select: {
      id: true,
      projectId: true,
      date: true,
      amount: true,
      category: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
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

  let from: Date | null = null;
  let to: Date | null = null;

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

    to.setHours(23, 59, 59, 999);
  }

  if (from && to && to.getTime() < from.getTime()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'to must be >= from.' },
      { status: 400 },
    );
  }

  const where: Prisma.CostEntryWhereInput = {
    projectId,
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const costs = await prisma.costEntry.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      projectId: true,
      date: true,
      amount: true,
      category: true,
      note: true,
      createdAt: true,
    },
  });

  const totalAmount = costs.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return NextResponse.json({
    data: costs,
    meta: {
      totalAmount,
      count: costs.length,
    },
  });
}