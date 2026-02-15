import { describe, it, expect } from 'vitest';
import { computeProgressEqualWeighted, calculateEV, InvalidProgressError } from '../engine/ev';

describe('EV (MVP)', () => {
  it('0 work items => progress = 0', () => {
    const p = computeProgressEqualWeighted([]);
    expect(p.itemCount).toBe(0);
    expect(p.progressRatio).toBe(0);
    expect(p.progressPercent).toBe(0);
  });

  it('average progress (equal-weighted)', () => {
    const p = computeProgressEqualWeighted([
      { progressPercent: 0 },
      { progressPercent: 50 },
      { progressPercent: 100 },
    ]);
    expect(p.progressPercent).toBeCloseTo(50, 10);
    expect(p.progressRatio).toBeCloseTo(0.5, 10);
  });

  it('EV = BAC * progressRatio', () => {
    const ev = calculateEV(1000, 0.25);
    expect(ev).toBe(250);
  });

  it('throws if progressPercent out of range', () => {
    expect(() => computeProgressEqualWeighted([{ progressPercent: 101 }])).toThrow(
      InvalidProgressError,
    );
  });
});
