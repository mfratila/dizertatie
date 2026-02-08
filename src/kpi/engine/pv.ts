export type PVInput = {
  bac: number;
  startDate: Date;
  endDate: Date;
  asOfDate: Date;
};

export type PVResult = {
  pv: number;
  elapsedRatio: number;
  elapsedRatioClamped: number;
};

export class InvalidProjectIntervalError extends Error {}
export class InvalidBudgetError extends Error {}
export class InvalidDateError extends Error {}

export function calculatePVLinear(input: PVInput): PVResult {
  const { bac, startDate, endDate, asOfDate } = input;

  if (!Number.isFinite(bac)) throw new InvalidBudgetError('BAC must be a finite number.');
  if (bac < 0) throw new InvalidBudgetError('BAC must be >= 0.');

  const start = startDate?.getTime?.();
  const end = endDate?.getTime?.();
  const asOf = asOfDate?.getTime?.();

  if (![start, end, asOf].every(Number.isFinite)) {
    throw new InvalidDateError('startDate/endDate/asOfDate must be valid Date objects.');
  }

  if (bac === 0) {
    return { pv: 0, elapsedRatio: 0, elapsedRatioClamped: 0 };
  }

  const duration = end - start;
  if (duration <= 0) {
    throw new InvalidProjectIntervalError(
      'Invalid project interval: endDate must be after startDate.',
    );
  }

  const elapsed = asOf - start;
  const elapsedRatio = elapsed / duration;

  const elapsedRatioClamped = Math.min(1, Math.max(0, elapsedRatio));
  const pv = bac * elapsedRatioClamped;

  return { pv, elapsedRatio, elapsedRatioClamped };
}
