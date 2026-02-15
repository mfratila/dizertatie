import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computeProjectProgress } from './projectProgress';
import { calculateEV } from '../engine/ev';

export class NotFoundError extends Error {}
export class InvalidProjectDataError extends Error {}

export async function computeEVForProject(projectId: number) {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new InvalidProjectDataError('projectId must be a positive integer.');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { plannedBudget: true },
  });

  if (!project) throw new NotFoundError(`Project with id ${projectId} not found.`);

  const bac =
    project.plannedBudget instanceof Prisma.Decimal
      ? project.plannedBudget.toNumber()
      : Number(project.plannedBudget);

  if (!Number.isFinite(bac))
    throw new InvalidProjectDataError('Project.plannedBudget (BAC) is invalid.');
  if (bac < 0) throw new InvalidProjectDataError('Project.plannedBudget (BAC) must be >= 0.');

  const progress = await computeProjectProgress(projectId);
  const ev = calculateEV(bac, progress.progressRatio);

  return {
    ev,
    bac,
    progress,
  };
}
