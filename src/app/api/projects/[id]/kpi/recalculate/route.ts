import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Role } from '@prisma/client';
import { persistKpiSnapshots } from '@/kpi/services/snapshotWriter';

// ---- helpers ----
function isAdminOrPm(role: Role | undefined) {
  return role === Role.ADMIN || role === Role.PM;
}

function parseProjectId(param: string): number | null {
  const n = Number(param);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseAsOf(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// ---- handler ----
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // unwrap params
  const { id } = await params;

  // 1) Session + RBAC
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrPm(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2) Params
  const projectId = parseProjectId(id);
  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }

  // 3) Body: { asOf?: string }
  let body: any = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const asOf = parseAsOf(body?.asOf) ?? new Date();

  // 4) Persist snapshots (creates new ros, no overwrite)
  const created = await persistKpiSnapshots(projectId, asOf);

  // 5) Response shapre: id, type, value, status
  const response = created.map((s: any) => ({
    id: s.id,
    type: s.kpiDefinition?.type, // if create() doesn't include, we will handle below
    value: s.value ? s.value.toString() : null,
    status: s.status,
  }));

  // If persistKpiSnapshots currently returns plain snapshots without include,
  // we can still return id/value/status; to return type, we should include kpiDefinition in writer.
  // We'll fix that in step 2 below.

  return NextResponse.json(
    {
      projectId,
      computedAt: asOf.toISOString(),
      snapshots: response,
    },
    { status: 200 },
  );
}
