export class InvalidProgressError extends Error {}
export class InvalidBudgetError extends Error {}

export type WorkItemProgress = {
  progressPercent: number;
};

export type ProgressResult = {
  progressPercent: number; // 0..100
  progressRatio: number; // 0..1
  itemCount: number;
};

export function computeProgressEqualWeighted(items: WorkItemProgress[]): ProgressResult {
  if (!Array.isArray(items)) {
    throw new InvalidProgressError('Items must be an array.');
  }

  // Acceptance: 0 task-uri => progress = 0
  if (items.length === 0) {
    return {
      progressPercent: 0,
      progressRatio: 0,
      itemCount: 0,
    };
  }

  let sum = 0;
  for (const item of items) {
    const progress = item?.progressPercent;

    if (!Number.isFinite(progress))
      throw new InvalidProgressError('progressPercent must be a finite number.');
    if (progress < 0 || progress > 100)
      throw new InvalidProgressError('progressPercent must be in [0, 100] range.');

    sum += progress;
  }

  const progressPercent = sum / items.length;
  const progressRatio = progressPercent / 100;

  return {
    progressPercent,
    progressRatio,
    itemCount: items.length,
  };
}

export function calculateEV(bac: number, progressRatio: number): number {
  if (!Number.isFinite(bac)) throw new InvalidBudgetError('BAC must be a finite number.');
  if (bac < 0) throw new InvalidBudgetError('BAC must be >= 0.');

  if (!Number.isFinite(progressRatio))
    throw new InvalidProgressError('progressRation must be a finite number.');
  if (progressRatio < 0 || progressRatio > 1)
    throw new InvalidProgressError('progressRatio must be in [0, 1] range.');

  return bac * progressRatio;
}
