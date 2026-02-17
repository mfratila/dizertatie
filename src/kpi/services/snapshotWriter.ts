import { prisma } from '@/lib/prisma';
import { Prisma, KpiType, KpiStatus } from '@prisma/client';
import { computeKpis } from './kpiEngine';
import { getKpiTresholds } from './kpiTresholds';
import { mapToRagStatus } from '../engine/rag';

export class InvalidSnapshotError extends Error {}

function toDecimalOrNull(x: number | null): Prisma.Decimal | null {
  if (x === null) return null;
  if (!Number.isFinite(x)) throw new InvalidSnapshotError('Non-finite KPI value.');
  return new Prisma.Decimal(x);
}

export async function persistKpiSnapshots(projectId: number, asOfDate: Date) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidSnapshotError('projectId must be a positive integer.');
  }
  if (!(asOfDate instanceof Date) || Number.isNaN(asOfDate.getTime())) {
    throw new InvalidSnapshotError('asOfDate must be a valid Date.');
  }

  // 1) Compute inputs + raw KPI values
  const res = await computeKpis(projectId, asOfDate);

  // Helper to persist one KPI row
  async function buildSnapshotRow(type: KpiType, value: number | null) {
    const def = await prisma.kPIDefinition.findUnique({
      where: { projectId_type: { projectId, type } },
      select: { id: true },
    });
    if (!def) throw new InvalidSnapshotError(`Missing KPIDefinition for ${type}.`);

    const tresholds = await getKpiTresholds(projectId, type);
    const rag = mapToRagStatus(value, tresholds); // GREEN/YELLOW/RED/NA

    const status: KpiStatus = rag as KpiStatus; // safe if you added NA to enum

    return {
      projectId,
      kpiDefinitionId: def.id,
      computedAt: asOfDate,

      value: toDecimalOrNull(value),
      status,

      // audit inputs
      ev: toDecimalOrNull(res.ev),
      pv: toDecimalOrNull(res.pv),
      ac: toDecimalOrNull(res.ac),
    };
  }

  // 2) Prepare all rows
  const rows = await Promise.all([
    buildSnapshotRow('CPI', res.cpi.value),
    buildSnapshotRow('SPI', res.spi.value),
    buildSnapshotRow('BURN_RATE', res.burnRate.value), // burnRate.value is number (0 ok)
  ]);

  // 3) Insert atomically (new rows each time, no overwrite)
  const created = await prisma.$transaction(
    rows.map((data) => prisma.kPISnapshot.create({ data, include: { kpiDefinition: true } })),
  );

  return created;
}
