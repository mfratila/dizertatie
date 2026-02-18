import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Role, KpiType } from '@prisma/client';
import { getKpiHistoryFiltered } from '@/kpi/services/snapshotQueries';
import { isAnyRole, parseProjectId, parseKpiType, parseDateParam } from '@/app/api/utils/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;

  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAnyRole(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const projectId = parseProjectId(id);
  if (!projectId) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const url = new URL(req.url);
  const type = parseKpiType(url.searchParams.get('type'));
  if (!type) {
    return NextResponse.json(
      { error: 'Missing/invalid query param: type=CPI|SPI|BURN_RATE' },
      { status: 400 },
    );
  }

  const from = parseDateParam(url.searchParams.get('from'));
  const to = parseDateParam(url.searchParams.get('to'));

  const rows = await getKpiHistoryFiltered({ projectId, type, from, to });

  return NextResponse.json(
    {
      projectId,
      type,
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
      items: rows.map((s) => ({
        id: s.id,
        computedAt: s.computedAt.toISOString(),
        value: s.value ? s.value.toString() : null,
        status: s.status,
        ev: s.ev ? s.ev.toString() : null,
        pv: s.pv ? s.pv.toString() : null,
        ac: s.ac ? s.ac.toString() : null,
      })),
    },
    { status: 200 },
  );
}
