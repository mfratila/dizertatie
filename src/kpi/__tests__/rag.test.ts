import { describe, it, expect } from 'vitest';
import { mapToRagStatus } from '../engine/rag';

describe('RAG mapping (GREEN/YELLOW/RED/NA)', () => {
  const t = { greenMin: 0.95, yellowMin: 0.85 };

  it('null => NA', () => {
    expect(mapToRagStatus(null, t)).toBe('NA');
  });

  it('value >= greenMin => GREEN (boundary)', () => {
    expect(mapToRagStatus(0.95, t)).toBe('GREEN');
    expect(mapToRagStatus(1.0, t)).toBe('GREEN');
  });

  it('yellowMin <= value < greenMin => YELLOW (boundaries)', () => {
    expect(mapToRagStatus(0.85, t)).toBe('YELLOW');
    expect(mapToRagStatus(0.949999, t)).toBe('YELLOW');
  });

  it('value < yellowMin => RED (boundary)', () => {
    expect(mapToRagStatus(0.849999, t)).toBe('RED');
    expect(mapToRagStatus(0.1, t)).toBe('RED');
  });
});
