import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PVInput } from '../engine/pv';

export class NotFoundError extends Error {}
export class InvalidProjectDataError extends Error {}

export type GetProjectBaselineInput = {
  projectId: number;
  asOfDate: Date;
};

export type ProjectBaseline = {
  projectId: number;
  bac: number;
  startDate: Date;
  endDate: Date;
  asOfDate: Date;
};

export async function getProjectBaselineForKpi(
  input: GetProjectBaselineInput,
): Promise<ProjectBaseline> {
  const { projectId, asOfDate } = input;

  if (!Number.isInteger(projectId) || projectId <= 0)
    throw new InvalidProjectDataError('projectId must be a positive integer.');
  if (!(asOfDate instanceof Date) || Number.isNaN(asOfDate.getTime())) {
    throw new InvalidProjectDataError('asOfDate must be a valid Date.');
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      plannedBudget: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!project) throw new NotFoundError(`Project with id ${projectId} not found.`);

  const bac =
    project.plannedBudget instanceof Prisma.Decimal
      ? project.plannedBudget.toNumber()
      : Number(project.plannedBudget);
  const startDate = project.startDate;
  const endDate = project.endDate;

  if (!Number.isFinite(bac)) {
    throw new InvalidProjectDataError('Project.plannedBudget (BAC) is invalid.');
  }
  if (bac < 0) {
    throw new InvalidProjectDataError('Project.plannedBudget (BAC) must be >= 0.');
  }
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    throw new InvalidProjectDataError('Project.startDate is missing or invalid');
  }
  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    throw new InvalidProjectDataError('Project.endDate is missing or invalid');
  }
  if (endDate.getTime() <= startDate.getTime()) {
    throw new InvalidProjectDataError(
      'Invalid baseline interval: endDate must be after startDate.',
    );
  }

  return {
    projectId: project.id,
    bac,
    startDate,
    endDate,
    asOfDate,
  };
}

// helper direct pt engine PV
export function toPVInput(baseline: ProjectBaseline): PVInput {
  return {
    bac: baseline.bac,
    startDate: baseline.startDate,
    endDate: baseline.endDate,
    asOfDate: baseline.asOfDate,
  };
}
