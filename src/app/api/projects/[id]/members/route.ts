import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';
import { getProjectAccess } from '@/lib/project-authz';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project id.' },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json(
      { error: 'Not Found', message: 'Project not found.' },
      { status: 404 },
    );
  }

  const role = auth.session.user.role;
  const userId = Number(auth.session.user.id);

  if (role !== 'ADMIN') {
    const access = await getProjectAccess(projectId, userId);
    if (!access.isMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You are not a member of this project.' },
        { status: 403 },
      );
    }
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    orderBy: [{ roleInProject: 'asc' }, { createdAt: 'asc' }],
    select: {
      userId: true,
      roleInProject: true,
      user: { select: { email: true, name: true, role: true } }, // role global (optional util)
    },
  });

  return NextResponse.json({ data: members });
}

type AddMemberBody = {
  userId: number;
  roleInProject: 'PM' | 'MEMBER' | 'VIEWER';
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid project id.' },
      { status: 400 },
    );
  }

  const role = auth.session.user.role;
  const actorUserId = Number(auth.session.user.id);

  // RBAC: doar ADMIN sau PM (global) pot incerca
  if (role !== 'ADMIN') {
    const access = await getProjectAccess(projectId, actorUserId);
    if (!access.isPmInProject) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only project managers can add members.' },
        { status: 403 },
      );
    }
  }

  const body = (await req.json()) as AddMemberBody;
  if (!body)
    return NextResponse.json(
      { error: 'Bad Request', message: 'Request body is required.' },
      { status: 400 },
    );

  const userId = Number(body.userId);
  const roleInProject = body.roleInProject;

  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }
  if (!['PM', 'MEMBER', 'VIEWER'].includes(roleInProject)) {
    return NextResponse.json({ error: 'Invalid roleInProject' }, { status: 400 });
  }

  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Duplicate check (inainte de create ca sa returnez 409 "curat")
  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Conflict', message: 'User is already a member of this project.' },
      { status: 409 },
    );
  }

  const created = await prisma.projectMember.create({
    data: { projectId, userId, roleInProject },
    select: {
      userId: true,
      roleInProject: true,
      user: { select: { email: true, name: true } },
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
