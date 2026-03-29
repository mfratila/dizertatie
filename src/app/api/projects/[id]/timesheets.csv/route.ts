import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function toCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return escapeCsv(String(value));
}

async function authorizeProjectExport(projectId: number, email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user) {
    return { ok: false as const, status: 401, error: 'Unauthorized' };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, archivedAt: true },
  });

  if (!project || project.archivedAt) {
    return { ok: false as const, status: 404, error: 'Project not found.' };
  }

  if (user.role === Role.ADMIN) {
    return { ok: true as const, user };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
    select: {
      id: true,
      roleInProject: true,
    },
  });

  if (!membership) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }

  return { ok: true as const, user, membership };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  const authz = await authorizeProjectExport(projectId, session.user.email);

  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const timesheets = await prisma.timesheet.findMany({
    where: {
      workItem: {
        projectId,
      },
    },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
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

  const header = [
    'projectId',
    'date',
    'hours',
    'userId',
    'userName',
    'userEmail',
    'workItemId',
    'workItemTitle',
    'note',
    'createdAt',
  ];

  const rows = timesheets.map((timesheet) => [
    timesheet.workItem.projectId,
    timesheet.date.toISOString(),
    timesheet.hours.toString(),
    timesheet.user.id,
    timesheet.user.name ?? '',
    timesheet.user.email,
    timesheet.workItem.id,
    timesheet.workItem.title,
    timesheet.note ?? '',
    timesheet.createdAt.toISOString(),
  ]);

  const bom = '\uFEFF';
  const csv = bom + [header, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="project-${projectId}-timesheets.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}