'use client';

import { useState } from 'react';
import { archiveProjectAction } from '../_actions/archive-action';
import { useRouter } from 'next/navigation';

export default function ArchiveProjectButton({ projectId }: { projectId: number }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onArchive() {
    const confirmed = window.confirm('Are you sure you want to archive this project?');
    if (!confirmed) return;

    setError(null);
    setLoading(true);

    const res = await archiveProjectAction(projectId);

    setLoading(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    router.push('/projects');
    router.refresh();
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={onArchive}
        disabled={loading}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium shadow-sm"
      >
        {loading ? 'Archiving...' : 'Archive'}
      </button>

      {error && <div style={{ marginTop: 8, color: 'crimson' }}>{error}</div>}
    </div>
  );
}
