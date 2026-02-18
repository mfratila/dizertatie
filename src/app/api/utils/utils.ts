import { Role, KpiType } from '@prisma/client';

export function isAnyRole(role: Role | undefined) {
  return role === Role.ADMIN || role === Role.PM || role === Role.MEMBER || role === Role.VIEWER;
}

export function isAdminOrPm(role: Role | undefined) {
  return role === Role.ADMIN || role === Role.PM;
}

export function parseProjectId(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}
export function parseDateParam(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function parseKpiType(v: string | null): KpiType | null {
  if (!v) return null;
  if (v === 'CPI' || v === 'SPI' || v === 'BURN_RATE') return v;
  return null;
}
