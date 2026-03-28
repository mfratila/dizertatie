'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  projectId: number;
};

type RecalculateResponse = {
  projectId: number;
  computedAt: string;
  snapshots: Array<{
    id: number;
    type: string | null;
    value: string | null;
    status: string;
  }>;
};

export default function RecalculateKpiButton({ projectId }: Props) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRecalculate() {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/kpi/recalculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = (await res.json().catch(() => null)) as RecalculateResponse | { error?: string } | null;

      if (!res.ok) {
        const message =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'A apărut o eroare la recalcularea KPI.';
        throw new Error(message);
      }

      const computedAt =
        data && typeof data === 'object' && 'computedAt' in data && typeof data.computedAt === 'string'
          ? data.computedAt
          : null;

      setSuccessMessage(
        computedAt
          ? `KPI recalculated successfully. New timestamp: ${computedAt}`
          : 'KPI recalculated successfully.',
      );

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'A apărut o eroare neașteptată.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>KPI Actions</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Recalculează manual snapshot-urile KPI pe baza datelor curente de execuție.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleRecalculate}
          disabled={isLoading}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'inherit',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Recalculating…' : 'Recalculate KPI'}
        </button>

        {isLoading ? <span style={{ opacity: 0.8 }}>Processing latest KPI snapshot...</span> : null}
      </div>

      {successMessage ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(34, 197, 94, 0.35)',
            background: 'rgba(34, 197, 94, 0.10)',
            color: '#22c55e',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.10)',
            color: '#ef4444',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}