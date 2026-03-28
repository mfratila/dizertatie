import { prisma } from '@/lib/prisma';
import { KpiType, Prisma, Role } from '@prisma/client';
import { getLatestPerKpiType, getKpiHistoryFiltered } from '@/kpi/services/snapshotQueries';

export class ProjectDashboardError extends Error {}
export class ProjectAccessDeniedError extends Error {}
export class ProjectNotFoundError extends Error {}
export class InvalidProjectDashboardInputError extends Error {}

type ViewerContext = {
  userId: number;
  role: Role;
};

type SnapshotDto = {
  id: number;
  computedAt: string;
  value: string | null;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'NA';
  ev: string | null;
  pv: string | null;
  ac: string | null;
};

export type ProjectDashboardResponse = {
  projectId: number;
  lastComputedAt: string | null;
  latest: {
    CPI: SnapshotDto | null;
    SPI: SnapshotDto | null;
    BURN_RATE: SnapshotDto | null;
  };
  history: {
    CPI: SnapshotDto[];
    SPI: SnapshotDto[];
    BURN_RATE: SnapshotDto[];
  };
};

function decimalToStringOrNull(value: Prisma.Decimal | null): string | null {
  if (value === null) return null;
  return value.toString();
}

function mapSnapshot(snapshot: {
  id: number;
  computedAt: Date;
  value: Prisma.Decimal | null;
  status: string;
  ev: Prisma.Decimal | null;
  pv: Prisma.Decimal | null;
  ac: Prisma.Decimal | null;
}): SnapshotDto {
  return {
    id: snapshot.id,
    computedAt: snapshot.computedAt.toISOString(),
    value: decimalToStringOrNull(snapshot.value),
    status: snapshot.status as SnapshotDto['status'],
    ev: decimalToStringOrNull(snapshot.ev),
    pv: decimalToStringOrNull(snapshot.pv),
    ac: decimalToStringOrNull(snapshot.ac),
  };
}

async function assertCanAccessProject(projectId: number, viewer: ViewerContext) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidProjectDashboardInputError('projectId must be a positive integer.');
  }

  if (!Number.isInteger(viewer.userId) || viewer.userId <= 0) {
    throw new InvalidProjectDashboardInputError('viewer.userId must be a positive integer.');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new ProjectNotFoundError(`Project with id=${projectId} not found.`);
  }

  if (viewer.role === Role.ADMIN) return;

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: viewer.userId,
      },
    },
    select: { projectId: true },
  });

  if (!membership) {
    throw new ProjectAccessDeniedError('User does not have access to this project.');
  }
}

export async function getProjectDashboardData(
  projectId: number,
  viewer: ViewerContext,
): Promise<ProjectDashboardResponse> {
  await assertCanAccessProject(projectId, viewer);

  const latestRows = await getLatestPerKpiType(projectId);

  const [cpiHistory, spiHistory, burnRateHistory] = await Promise.all([
    getKpiHistoryFiltered({ projectId, type: KpiType.CPI }),
    getKpiHistoryFiltered({ projectId, type: KpiType.SPI }),
    getKpiHistoryFiltered({ projectId, type: KpiType.BURN_RATE }),
  ]);

  const latest: ProjectDashboardResponse['latest'] = {
    CPI: null,
    SPI: null,
    BURN_RATE: null,
  };

  for (const row of latestRows) {
    latest[row.type] = mapSnapshot(row.snapshot);
  }

  const history: ProjectDashboardResponse['history'] = {
    CPI: cpiHistory.map(mapSnapshot),
    SPI: spiHistory.map(mapSnapshot),
    BURN_RATE: burnRateHistory.map(mapSnapshot),
  };

  const allLatestComputedAt = [
    latest.CPI?.computedAt ?? null,
    latest.SPI?.computedAt ?? null,
    latest.BURN_RATE?.computedAt ?? null,
  ].filter((x): x is string => x !== null);

  const lastComputedAt =
    allLatestComputedAt.length > 0
      ? allLatestComputedAt.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

  return {
    projectId,
    lastComputedAt,
    latest,
    history,
  };
}