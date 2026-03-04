import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import { Role } from '@prisma/client';

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
