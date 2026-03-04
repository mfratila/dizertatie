export function formatDate(d: Date) {
  return new Intl.DateTimeFormat('ro-RO').format(d);
}

export function formatMoney(v: any) {
  // Prisma Decimal -> string/number in functie de config; tratam robust
  const n = typeof v === 'number' ? v : Number(v?.toString?.() ?? v);
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(n);
}
