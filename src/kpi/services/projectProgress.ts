import { prisma } from '@/lib/prisma';
import { computeProgressEqualWeighted } from '../engine/ev';

export class InvalidProjectDataError extends Error {}

export async function computeProjectProgress(projectId: number) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidProjectDataError('projectId must be a positive integer.');
  }

  const items = await prisma.workItem.findMany({
    where: { projectId },
    select: { progressPercent: true },
    orderBy: { id: 'asc' }, // determinis (desi average nu depinde de order)
  });

  // progressPercent e Int NOT NULL => safe
  return computeProgressEqualWeighted(items);
}
