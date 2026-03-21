'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function CostFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo] = useState(searchParams.get('to') ?? '');

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    if (from) params.set('from', from);
    else params.delete('from');

    if (to) params.set('to', to);
    else params.delete('to');

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginTop: 16,
        marginBottom: 16,
        display: 'grid',
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0 }}>Filtre</h3>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          De la
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Până la
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={applyFilters}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white"
        >
          Aplică filtrele
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="px-4 py-2 rounded-lg bg-gray-600 text-white"
        >
          Resetează
        </button>
      </div>
    </div>
  );
}