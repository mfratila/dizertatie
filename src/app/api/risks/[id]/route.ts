import { NextResponse } from 'next/server';
import { RiskStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';

type UpdateRiskInput = {
  title: string;
  probability: number;
  impact: number;
  status: RiskStatus;
  ownerUserId?: number | null;
  note?: string;
};

function validateProbabilityImpact(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return `${fieldName} must be an integer between 1 and 5.`;
  }

  return null;
}

function validateUpdate(input: UpdateRiskInput) {
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

  if (!Object.values(RiskStatus).includes(input.status)) {
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
    ownerUserId: input.ownerUserId ?? null,
    note: note || null,
  };
}

export async function PATCH(
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
      { error: 'Conflict', message: 'Cannot modify risks from an archived project.' },
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
        { error: 'Forbidden', message: 'Only project PM/Admin can edit risks.' },
        { status: 403 },
      );
    }
  }

  const body = (await request.json()) as UpdateRiskInput;

  const validatedBody = validateUpdate(body);
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
          projectId: current.projectId,
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

  const updated = await prisma.risk.update({
    where: { id: riskId },
    data: {
      title: validatedBody.title,
      probability: body.probability,
      impact: body.impact,
      status: body.status,
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

  return NextResponse.json({ data: updated });
}