import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/authz';
import { ProjectStatus, Role } from '@prisma/client';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project id.' },
      { status: 400 },
    );
  }

  const session = auth.session;
  const userId = Number(session.user.id);
  const role = session.user.role;

  // Admin: direct fetch
  if (role === Role.ADMIN) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        plannedBudget: true,
        createdAt: true,
        members: {
          select: {
            roleInProject: true,
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: [{ roleInProject: 'asc' }, { userId: 'asc' }],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: project });
  }

  // Non-admin: enforce membership
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { projectId: true },
  });

  // RECOMMENDED: 404 for non-members (resource hiding)
  if (!membership) {
    return NextResponse.json(
      { error: 'Not found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      plannedBudget: true,
      createdAt: true,
      members: {
        select: {
          roleInProject: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: [{ roleInProject: 'asc' }, { userId: 'asc' }],
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: project });
}

type PatchProjectInput = Partial<{
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  plannedBudget: number;
  status: ProjectStatus;
}>;

function isValidDate(d: Date) {
  return Number.isFinite(d.getTime());
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  // RBAC global: doar ADMIN/PM au drept de update
  const authz = requireRole(auth.session, [Role.ADMIN, Role.PM]);
  if (!authz.ok) return authz.response;

  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project id.' },
      { status: 400 },
    );
  }

  const session = auth.session;
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid user id in session.' },
      { status: 500 },
    );
  }

  const body = (await req.json()) as PatchProjectInput;

  // Load current project (needed for cross-field validation)
  const currentProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      plannedBudget: true,
      status: true,
    },
  });

  if (!currentProject) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  // RBAC object-level: PM poate update doar dacă e membru
  if (session.user.role === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { roleInProject: true },
    });

    if (!membership || String(membership.roleInProject) !== Role.PM) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to update this project.' },
        { status: 403 },
      );
    }
  }

  // Build update data with validation
  const data: any = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Project name cannot be empty.' },
        { status: 400 },
      );
    }
    data.name = name;
  }

  if (body.plannedBudget !== undefined) {
    if (typeof body.plannedBudget !== 'number' || Number.isNaN(body.plannedBudget)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Planned budget must be a valid number.' },
        { status: 400 },
      );
    }
  }
    data.plannedBudget = body.plannedBudget;

    // Dates: parse if provided; validate end >= start using current + new values
    const nextStartDate = body.startDate !== undefined ? new Date(body.startDate) : currentProject.startDate;
    const nextEndDate = body.endDate !== undefined ? new Date(body.endDate) : currentProject.endDate;

    if (body.startDate !== undefined) {
      if (!isValidDate(nextStartDate)) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Invalid start date.' },
          { status: 400 },
        );
      }
    }
    data.startDate = nextStartDate;

    if (body.endDate !== undefined) {
      if (!isValidDate(nextEndDate)) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Invalid end date.' },
          { status: 400 },
        );
      }
    }
    data.endDate = nextEndDate;

    if (nextStartDate.getTime() > nextEndDate.getTime()) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'End date cannot be before start date.' },
        { status: 400 },
      );
    }

    if (body.status !== undefined) {
      const s = String(body.status).trim();
      if (!s) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'Status cannot be empty.' },
          { status: 400 },
        );
      }
      data.status = s;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'No valid fields provided for update.' },
        { status: 400 },
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        plannedBudget: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
}
