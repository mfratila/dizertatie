import { describe, it, expect } from 'vitest';
import { calculatePVLinear } from '../engine/pv';
import { computeProgressEqualWeighted, calculateEV } from '../engine/ev';
import { sumActualCost } from '../engine/ac';
import { calculateCPI, calculateSPI, calculateBurnRate } from '../engine/kpis';

const d = (iso: string) => new Date(iso);

describe('KPI engine golden case (deterministic exact scenario)', () => {
  it('computes EV, PV, AC, CPI, SPI and Burn Rate for a known scenario', () => {
    const bac = 1000;

    const pv = calculatePVLinear({
      bac,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'),
      asOfDate: d('2026-01-06T00:00:00Z'),
    });

    expect(pv.elapsedRatioClamped).toBe(0.5);
    expect(pv.pv).toBe(500);

    const progress = computeProgressEqualWeighted([
      { progressPercent: 0 },
      { progressPercent: 50 },
      { progressPercent: 100 },
    ]);

    expect(progress.progressPercent).toBeCloseTo(50, 10);
    expect(progress.progressRatio).toBeCloseTo(0.5, 10);

    const ev = calculateEV(bac, progress.progressRatio);
    expect(ev).toBe(500);

    const ac = sumActualCost([100, 150, 50]);
    expect(ac).toBe(300);

    const cpi = calculateCPI(ev, ac);
    expect(cpi.status).toBe('OK');
    expect(cpi.value).toBeCloseTo(500 / 300, 10);

    const spi = calculateSPI(ev, pv.pv);
    expect(spi.status).toBe('OK');
    expect(spi.value).toBe(1);

    const burnRate = calculateBurnRate(
      ac,
      d('2026-01-01T00:00:00Z'),
      d('2026-01-06T00:00:00Z'),
    );

    expect(burnRate.status).toBe('OK');
    expect(burnRate.elapsedDays).toBe(5);
    expect(burnRate.value).toBe(60);
  });
});