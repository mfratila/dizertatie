import { prisma } from '@/lib/prisma';

export type ProjectProgressResult = {
  projectId: number;
  workItemCount: number;
  progressRatio: number;
  progressPercent: number;
};

export function computeProjectProgressFromValues(progressValues: number[]): {
  workItemCount: number;
  progressRatio: number;
  progressPercent: number;
} {
  if (progressValues.length === 0) {
    return {
      workItemCount: 0,
      progressRatio: 0,
      progressPercent: 0,
    };
  }

  const normalizedValues = progressValues.map((value) => {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Invalid progressPercent value: ${value}`);
    }

    return value;
  });

  const averagePercent =
    normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length;

  return {
    workItemCount: normalizedValues.length,
    progressRatio: averagePercent / 100,
    progressPercent: averagePercent,
  };
}

export async function computeProjectProgressHelper(projectId: number): Promise<ProjectProgressResult> {
  if (!Number.isInteger(projectId)) {
    throw new Error('Invalid projectId');
  }

  const workItems = await prisma.workItem.findMany({
    where: { projectId },
    select: {
      progressPercent: true,
    },
  });

  const computed = computeProjectProgressFromValues(
    workItems.map((item) => item.progressPercent),
  );

  return {
    projectId,
    ...computed,
  };
}