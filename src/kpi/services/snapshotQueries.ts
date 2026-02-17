import { prisma } from '@/lib/prisma';
import { KpiType } from '@prisma/client';

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
