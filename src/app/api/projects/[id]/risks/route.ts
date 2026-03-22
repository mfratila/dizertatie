import { NextResponse } from 'next/server';
import { Prisma, RiskStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';

type CreateRiskInput = {
  title: string;
  probability: number;
  impact: number;
  status?: RiskStatus;
  ownerUserId?: number | null;
  note?: string;
};

function validateProbabilityImpact(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return `${fieldName} must be an integer between 1 and 5.`;
  }

  return null;
}

function validateCreate(input: CreateRiskInput) {
  const title = input.title?.trim();
  if (!title) {
    return { ok: false as const, message: 'title is required.' };
  }

  const probabilityError = validateProbabilityImpact(input.probability, 'probability');
  if (probabilityError) {
    return { ok: false as const, message: probabilityError };
  }

  const impactError = validateProbabilityImpact(input.impact, 'impact');
  if (impactError) {
    return { ok: false as const, message: impactError };
  }

  const status = input.status ?? RiskStatus.OPEN;
  if (!Object.values(RiskStatus).includes(status)) {
    return { ok: false as const, message: 'Invalid status.' };
  }

  if (
    input.ownerUserId !== undefined &&
    input.ownerUserId !== null &&
    (!Number.isInteger(input.ownerUserId) || input.ownerUserId <= 0)
  ) {
    return { ok: false as const, message: 'ownerUserId must be a positive integer.' };
  }

  const note = input.note?.trim() ?? '';
  if (note.length > 1000) {
    return { ok: false as const, message: 'note must be at most 1000 characters.' };
  }

  return {
    ok: true as const,
    title,
    status,
    ownerUserId: input.ownerUserId ?? null,
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
      { error: 'Bad Request', message: `Invalid projectId. id: ${projectIdParam}. projectId: ${projectId}` },
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
  const statusRaw = searchParams.get('status')?.trim() ?? '';

  let statusFilter: RiskStatus | null = null;
  if (statusRaw) {
    if (!Object.values(RiskStatus).includes(statusRaw as RiskStatus)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid status filter.' },
        { status: 400 },
      );
    }

    statusFilter = statusRaw as RiskStatus;
  }

  const where: Prisma.RiskWhereInput = {
    projectId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const risks = await prisma.risk.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ data: risks });
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
      { error: 'Bad Request', message: `Invalid projectId. id: ${projectIdParam}. projectId: ${projectId}` },
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
        { error: 'Forbidden', message: 'Only project PM/Admin can create risks.' },
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
      { error: 'Conflict', message: 'Cannot add risks to an archived project.' },
      { status: 409 },
    );
  }

  const body = (await request.json()) as CreateRiskInput;

  const validatedBody = validateCreate(body);
  if (!validatedBody.ok) {
    return NextResponse.json(
      { error: 'Bad Request', message: validatedBody.message },
      { status: 400 },
    );
  }

  if (validatedBody.ownerUserId) {
    const ownerMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: validatedBody.ownerUserId,
        },
      },
      select: { userId: true },
    });

    if (!ownerMembership) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'The selected owner must be a member of the project.' },
        { status: 400 },
      );
    }
  }

  const created = await prisma.risk.create({
    data: {
      projectId,
      title: validatedBody.title,
      probability: body.probability,
      impact: body.impact,
      status: validatedBody.status,
      ownerUserId: validatedBody.ownerUserId,
      note: validatedBody.note,
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
      owner: {
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