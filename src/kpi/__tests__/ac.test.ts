import { describe, it, expect } from 'vitest';
import { sumActualCost } from '../engine/ac';

describe('AC (MVP) - sumActualCost', () => {
  it('empty amounts => AC = 0', () => {
    expect(sumActualCost([])).toBe(0);
  });

  it('sums amounts correctly', () => {
    expect(sumActualCost([10, 20.5, 0, 3.25])).toBeCloseTo(33.75, 10);
  });
});
