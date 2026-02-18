import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Role } from '@prisma/client';
import { getLatestPerKpiType } from '@/kpi/services/snapshotQueries';
import { isAnyRole, parseProjectId } from '@/app/api/utils/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAnyRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const projectId = parseProjectId(id);
  if (!projectId) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const latest = await getLatestPerKpiType(projectId);

  return NextResponse.json(
    {
      projectId,
      items: latest.map((x) => ({
        type: x.type,
        id: x.snapshot.id,
        computedAt: x.snapshot.computedAt.toISOString(),
        value: x.snapshot.value ? x.snapshot.value.toString() : null,
        status: x.snapshot.status,
        ev: x.snapshot.ev ? x.snapshot.ev.toString() : null,
        pv: x.snapshot.pv ? x.snapshot.pv.toString() : null,
        ac: x.snapshot.ac ? x.snapshot.ac.toString() : null,
      })),
    },
    { status: 200 },
  );
}
