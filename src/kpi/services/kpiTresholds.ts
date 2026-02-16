import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export class NotFoundError extends Error {}
export class InvalidProjectDataError extends Error {}

export async function getKpiTresholds(projectId: number, type: 'CPI' | 'SPI' | 'BURN_RATE') {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidProjectDataError('projectId must be a positive integer.');
  }

  const def = await prisma.kPIDefinition.findUnique({
    where: { projectId_type: { projectId, type } }, // deoarece am @@unique([projectId, type])
    select: {
      thresholdGreen: true,
      thresholdYellow: true,
    },
  });

  if (!def)
    throw new NotFoundError(`KPIDefinition not found for projectId=${projectId}, type=${type}`);

  const greenMin =
    def.thresholdGreen instanceof Prisma.Decimal
      ? def.thresholdGreen.toNumber()
      : Number(def.thresholdGreen);
  const yellowMin =
    def.thresholdYellow instanceof Prisma.Decimal
      ? def.thresholdYellow.toNumber()
      : Number(def.thresholdYellow);

  if (!Number.isFinite(greenMin) || !Number.isFinite(yellowMin)) {
    throw new InvalidProjectDataError('Invalid KPI tresholds (non-finite).');
  }

  return { greenMin, yellowMin };
}
