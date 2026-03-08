export function formatDate(d: Date) {
  return new Intl.DateTimeFormat('ro-RO').format(d);
}

export function isValidDate(d: Date) {
  return Number.isFinite(d.getTime());
}

export function formatMoney(v: any) {
  // Prisma Decimal -> string/number in functie de config; tratam robust
  const n = typeof v === 'number' ? v : Number(v?.toString?.() ?? v);
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(n);
}

export function formatWorkItemDate(value: string | Date | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}