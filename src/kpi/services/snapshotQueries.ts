import { prisma } from '@/lib/prisma';
import { KpiType } from '@prisma/client';

export class InvalidProjectDataError extends Error {}

export async function getKpiHistory(projectId: number, type: KpiType) {
  const def = await prisma.kPIDefinition.findUnique({
    where: { projectId_type: { projectId, type } },
    select: { id: true },
  });
  if (!def) return [];

  return prisma.kPISnapshot.findMany({
    where: { projectId, kpiDefinitionId: def.id },
    orderBy: { computedAt: 'asc' },
  });
}

export async function getLatestKpiSnapshots(projectId: number) {
  const latest = await prisma.kPISnapshot.findFirst({
    where: { projectId },
    orderBy: { computedAt: 'desc' },
    select: { computedAt: true },
  });
  if (!latest) return [];

  return prisma.kPISnapshot.findMany({
    where: { projectId, computedAt: latest.computedAt },
    include: { kpiDefinition: true },
  });
}

export async function getLatestPerKpiType(projectId: number) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidProjectDataError('projectId must be a positive integer.');
  }

  const defs = await prisma.kPIDefinition.findMany({
    where: { projectId },
    select: { id: true, type: true },
    orderBy: { type: 'asc' },
  });

  if (defs.length === 0) return [];

  const latestRows = await Promise.all(
    defs.map(async (def) => {
      const snapshot = await prisma.kPISnapshot.findFirst({
        where: { projectId, kpiDefinitionId: def.id },
        orderBy: { computedAt: 'desc' },
      });
      return { def, snapshot };
    }),
  );

  // Include only those KPI defs that have at least 1 snapshot
  return latestRows
    .filter((x) => x.snapshot !== null)
    .map((x) => ({
      type: x.def.type,
      snapshot: x.snapshot!,
    }));
}

export type HistoryFilters = {
  projectId: number;
  type: KpiType;
  from?: Date;
  to?: Date;
};

export async function getKpiHistoryFiltered(input: HistoryFilters) {
  const { projectId, type, from, to } = input;

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidProjectDataError('projectId must be a positive integer.');
  }

  const def = await prisma.kPIDefinition.findUnique({
    where: { projectId_type: { projectId, type } },
    select: { id: true, type: true },
  });

  if (!def) return [];

  return prisma.kPISnapshot.findMany({
    where: {
      projectId,
      kpiDefinitionId: def.id,
      ...(from || to
        ? {
            computedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { computedAt: 'asc' },
  });
}
