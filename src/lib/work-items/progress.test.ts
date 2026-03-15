import { describe, expect, it } from 'vitest';
import { computeProjectProgressFromValues } from './progress';

describe('computeProjectProgressFromValues', () => {
  it('returns 0 progress when there are no work items', () => {
    const result = computeProjectProgressFromValues([]);

    expect(result).toEqual({
      workItemCount: 0,
      progressRatio: 0,
      progressPercent: 0,
    });
  });

  it('computes average progress for mixed values', () => {
    const result = computeProjectProgressFromValues([0, 50, 100]);

    expect(result.workItemCount).toBe(3);
    expect(result.progressPercent).toBe(50);
    expect(result.progressRatio).toBe(0.5);
  });

  it('computes average progress for non-trivial mixed values', () => {
    const result = computeProjectProgressFromValues([60, 20, 100]);

    expect(result.workItemCount).toBe(3);
    expect(result.progressPercent).toBe(60);
    expect(result.progressRatio).toBe(0.6);
  });

  it('throws on invalid negative progress', () => {
    expect(() => computeProjectProgressFromValues([10, -1, 50])).toThrow(
      'Invalid progressPercent value: -1',
    );
  });

  it('throws on invalid progress above 100', () => {
    expect(() => computeProjectProgressFromValues([10, 101, 50])).toThrow(
      'Invalid progressPercent value: 101',
    );
  });
});
