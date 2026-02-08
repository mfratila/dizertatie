import { describe, it, expect } from 'vitest';
import { calculatePVLinear, InvalidProjectIntervalError, InvalidBudgetError } from '../engine/pv';

const d = (iso: string) => new Date(iso);

describe('calculatePVLinear (PV baseline linear)', () => {
  it('PV is 0 before startDate', () => {
    const r = calculatePVLinear({
      bac: 1000,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'),
      asOfDate: d('2025-12-31T00:00:00Z'),
    });
    expect(r.pv).toBe(0);
    expect(r.elapsedRatioClamped).toBe(0);
  });

  it('PV is 0 at startDate', () => {
    const r = calculatePVLinear({
      bac: 1000,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'),
      asOfDate: d('2026-01-01T00:00:00Z'),
    });
    expect(r.pv).toBe(0);
  });

  it('PV is linear in the middle', () => {
    const r = calculatePVLinear({
      bac: 1000,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'), // 10 days duration
      asOfDate: d('2026-01-06T00:00:00Z'), // elapsed 5 days => 0.5
    });
    expect(r.elapsedRatioClamped).toBe(0.5);
    expect(r.pv).toBe(500);
  });

  it('PV is BAC at endDate', () => {
    const r = calculatePVLinear({
      bac: 1000,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'),
      asOfDate: d('2026-01-11T00:00:00Z'),
    });
    expect(r.pv).toBe(1000);
    expect(r.elapsedRatioClamped).toBe(1);
  });

  it('PV is BAC after endDate', () => {
    const r = calculatePVLinear({
      bac: 1000,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'),
      asOfDate: d('2026-01-12T00:00:00Z'),
    });
    expect(r.pv).toBe(1000);
  });

  it('BAC=0 => PV is always 0', () => {
    const r = calculatePVLinear({
      bac: 0,
      startDate: d('2026-01-01T00:00:00Z'),
      endDate: d('2026-01-11T00:00:00Z'),
      asOfDate: d('2026-01-10T00:00:00Z'),
    });
    expect(r.pv).toBe(0);
  });

  it('throws if BAC is negative', () => {
    expect(() =>
      calculatePVLinear({
        bac: -1,
        startDate: d('2026-01-01T00:00:00Z'),
        endDate: d('2026-01-11T00:00:00Z'),
        asOfDate: d('2026-01-10T00:00:00Z'),
      }),
    ).toThrow(InvalidBudgetError);
  });

  it('throws if endDate <= startDate', () => {
    expect(() =>
      calculatePVLinear({
        bac: 1000,
        startDate: d('2026-01-01T00:00:00Z'),
        endDate: d('2026-01-01T00:00:00Z'),
        asOfDate: d('2026-01-01T00:00:00Z'),
      }),
    ).toThrow(InvalidProjectIntervalError);
  });
});
