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

function parseOptionalDate(raw: string | null): Date | null | 'invalid' {
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'invalid';

  return parsed;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, archivedAt: true },
  });

  if (!project || project.archivedAt) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const isAdmin = user.role === Role.ADMIN;

  if (!isAdmin) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const from = parseOptionalDate(searchParams.get('from'));
  const to = parseOptionalDate(searchParams.get('to'));

  if (from === 'invalid' || to === 'invalid') {
    return NextResponse.json(
      { error: 'Invalid date filter. Expected ISO-compatible values for from/to.' },
      { status: 400 },
    );
  }

  if (from && to && from > to) {
    return NextResponse.json(
      { error: 'Invalid interval. "from" must be earlier than or equal to "to".' },
      { status: 400 },
    );
  }

  const snapshots = await prisma.kPISnapshot.findMany({
    where: {
      projectId,
      ...(from || to
        ? {
            computedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ computedAt: 'asc' }, { id: 'asc' }],
    select: {
      computedAt: true,
      value: true,
      status: true,
      ev: true,
      pv: true,
      ac: true,
      kpiDefinition: {
        select: {
          type: true,
        },
      },
    },
  });

  const header = ['computedAt', 'kpiType', 'value', 'status', 'ev', 'pv', 'ac'];

  const rows = snapshots.map((snapshot) => [
    snapshot.computedAt.toISOString(),
    snapshot.kpiDefinition.type,
    snapshot.value?.toString() ?? '',
    snapshot.status,
    snapshot.ev?.toString() ?? '',
    snapshot.pv?.toString() ?? '',
    snapshot.ac?.toString() ?? '',
  ]);

  const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(',')).join('\n');

  const filename = `project-${projectId}-kpi-snapshots.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}