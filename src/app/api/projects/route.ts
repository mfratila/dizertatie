import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role, ProjectStatus } from '@prisma/client';
import { requireSession, requireRole } from '@/lib/authz';

type CreateProjectInput = {
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  plannedBudget: number; // BAC
  status?: ProjectStatus; // optional; default to PLANNED
};

function validate(input: CreateProjectInput) {
  const name = input.name?.trim();
  if (!name) return { ok: false as const, message: 'Name is required.' };

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false as const, message: 'Invalid startDate/endDate.' };
  }
  if (end.getTime() < start.getTime()) {
    return { ok: false as const, message: 'endDate must be >= startDate.' };
  }

  if (typeof input.plannedBudget !== 'number' || Number.isNaN(input.plannedBudget)) {
    return { ok: false as const, message: 'plannedBudget must be a number.' };
  }
  if (input.plannedBudget < 0) {
    return { ok: false as const, message: 'plannedBudget must be >= 0.' };
  }

  return { ok: true as const, name, start, end };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { session } = auth;

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Invalid session user id' }, { status: 500 });
  }

  const role = session.user.role; // ADMIN | PM | MEMBER | VIEWER

  const select = {
    id: true,
    name: true,
    status: true,
    startDate: true,
    endDate: true,
    plannedBudget: true,
  };

  const projects =
    role === 'ADMIN'
      ? await prisma.project.findMany({
          orderBy: { createdAt: 'desc' },
          select,
        })
      : await prisma.project.findMany({
          where: {
            members: {
              some: { userId },
            },
          },
          select,
        });

  return NextResponse.json({ data: projects });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM]);
  if (!authz.ok) return authz.response;

  const session = auth.session;
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Invalid session user id' }, { status: 500 });
  }

  const body = (await request.json()) as CreateProjectInput;

  const validatedBody = validate(body);
  if (!validatedBody.ok) {
    return NextResponse.json(
      { error: 'Bad Request', message: validatedBody.message },
      { status: 400 },
    );
  }

  const status = body.status ?? ProjectStatus.PLANNED; // 'Planificat' implicit

  // Create project + creator membership in one transaction
  const created = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: validatedBody.name,
        startDate: validatedBody.start,
        endDate: validatedBody.end,
        plannedBudget: body.plannedBudget,
        status,
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        plannedBudget: true,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        roleInProject: Role.PM, // creator is PM in the project
      },
    });

    return project;
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
