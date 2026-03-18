'use client';

import { useState } from 'react';
import { archiveWorkItemAction } from '../_actions/actions';

export default function ArchiveWorkItemButton({
  workItemId,
  title,
}: {
  workItemId: number;
  title: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    const confirmed = window.confirm(`Sigur vrei să arhivezi activitatea „${title}”?`);

    if (!confirmed) {
      return;
    }

    setError(null);
    setLoading(true);

    const result = await archiveWorkItemAction(workItemId);

    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <button
        type="button"
        onClick={handleArchive}
        disabled={loading}
        className="px-3 py-1 rounded-lg bg-red-700 text-white"
      >
        {loading ? 'Se arhivează...' : 'Arhivează'}
      </button>

      {error && <div style={{ color: 'crimson', fontSize: 12 }}>{error}</div>}
    </div>
  );
}
