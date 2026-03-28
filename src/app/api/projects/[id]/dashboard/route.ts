import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Role } from '@prisma/client';

import { authOptions } from '@/lib/authOptions';
import { parseProjectId, isAnyRole } from '@/app/api/utils/utils';
import {
  getProjectDashboardData,
  InvalidProjectDashboardInputError,
  ProjectAccessDeniedError,
  ProjectNotFoundError,
} from '@/lib/project-dashboard/project-dashboard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAnyRole(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const projectId = parseProjectId(id);
  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }

  try {
    const data = await getProjectDashboardData(projectId, {
      userId: Number(session.user.id),
      role: role!,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidProjectDashboardInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ProjectAccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error('GET /api/projects/[id]/dashboard failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}