export class InvalidCostError extends Error {}

export function sumActualCost(amounts: number[]): number {
  if (!Array.isArray(amounts)) throw new InvalidCostError('Amounts must be an array of numbers');

  let sum = 0;

  for (const amount of amounts) {
    if (!Number.isFinite(amount)) throw new InvalidCostError('amount must be a finite number.');
    if (amount < 0) throw new InvalidCostError('amount must be >= 0 for MVP.');

    sum += amount;
  }

  return sum;
}
