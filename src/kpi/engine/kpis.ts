export class InvalidKpiInputError extends Error {}

export type KpiValueResult = {
  value: number | null;
  status: 'OK' | 'N/A';
};

export function calculateCPI(ev: number, ac: number): KpiValueResult {
  if (!Number.isFinite(ev) || ev < 0)
    throw new InvalidKpiInputError(`EV must be a finite number >= 0. Received: ${ev}`);
  if (!Number.isFinite(ac) || ac < 0)
    throw new InvalidKpiInputError(`AC must be a finite number >= 0. Received: ${ac}`);

  if (ac === 0) return { value: null, status: 'N/A' };
  return { value: ev / ac, status: 'OK' };
}

export function calculateSPI(ev: number, pv: number): KpiValueResult {
  if (!Number.isFinite(ev) || ev < 0)
    throw new InvalidKpiInputError('EV must be a finite number >= 0.');
  if (!Number.isFinite(pv) || pv < 0)
    throw new InvalidKpiInputError('PV must be a finite number >= 0.');

  if (pv === 0) return { value: null, status: 'N/A' };
  return { value: ev / pv, status: 'OK' };
}

export type BurnRateResult = {
  value: number | null;
  unit: 'currency/day';
  elapsedDays: number;
  status: 'OK' | 'N/A';
};

export function calculateBurnRate(ac: number, startDate: Date, asOfDate: Date): BurnRateResult {
  if (!Number.isFinite(ac) || ac < 0)
    throw new InvalidKpiInputError('AC must be a finite number >= 0.');
  const start = startDate?.getTime?.();
  const asOf = asOfDate?.getTime?.();
  if (![start, asOf].every(Number.isFinite))
    throw new InvalidKpiInputError('Dates must be valid Date objects.');

  const msPerDay = 24 * 60 * 60 * 1000;
  const rawDays = Math.ceil((asOf - start) / msPerDay);

  // MVP: minimum 1 day to avoid division by zero and keep unit meaningful
  const elapsedDays = Math.max(1, rawDays);

  // Burn Rate can be computed even if AC == 0 ( it becomes 0).
  const value = ac / elapsedDays;

  return { value, unit: 'currency/day', elapsedDays, status: 'OK' };
}
