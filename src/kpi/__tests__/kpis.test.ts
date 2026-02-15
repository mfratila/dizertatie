import { describe, it, expect } from 'vitest';
import { calculateCPI, calculateSPI, calculateBurnRate } from '../engine/kpis';

const d = (iso: string) => new Date(iso);

describe('KPI calculations (CPI, SPI, Burn Rate) - MVP', () => {
  it('CPI = EV/AC when AC > 0', () => {
    const r = calculateCPI(200, 100);
    expect(r.status).toBe('OK');
    expect(r.value).toBe(2);
  });

  it('CPI is N/A when AC = 0', () => {
    const r = calculateCPI(0, 0);
    expect(r.status).toBe('N/A');
    expect(r.value).toBeNull();
  });

  it('SPI = EV/PV when PV > 0', () => {
    const r = calculateSPI(150, 100);
    expect(r.status).toBe('OK');
    expect(r.value).toBe(1.5);
  });

  it('SPI is N/A when PV = 0', () => {
    const r = calculateSPI(0, 0);
    expect(r.status).toBe('N/A');
    expect(r.value).toBeNull();
  });

  it('Burn Rate = AC / elapsedDays (unit currency/day)', () => {
    const r = calculateBurnRate(
      1000,
      d('2026-01-01T00:00:00Z'),
      d('2026-01-11T00:00:00Z'), // 10 days difference => ceil(10)=10
    );
    expect(r.status).toBe('OK');
    expect(r.unit).toBe('currency/day');
    expect(r.elapsedDays).toBe(10);
    expect(r.value).toBe(100);
  });

  it('Burn Rate uses minimum 1 day (asOf == start)', () => {
    const r = calculateBurnRate(100, d('2026-01-01T00:00:00Z'), d('2026-01-01T00:00:00Z'));
    expect(r.elapsedDays).toBe(1);
    expect(r.value).toBe(100);
  });

  it('Burn Rate works when AC=0', () => {
    const r = calculateBurnRate(0, d('2026-01-01T00:00:00Z'), d('2026-01-05T00:00:00Z'));
    expect(r.value).toBe(0);
  });
});
