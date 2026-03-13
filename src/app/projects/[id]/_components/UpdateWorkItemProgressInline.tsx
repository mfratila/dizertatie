'use client';

import { useState } from 'react';
import { updateWorkItemProgressAction } from '../_actions/actions';

export default function UpdateWorkItemProgressInline({
  workItem,
}: {
  workItem: {
    id: number;
    title: string;
    progressPercent: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);

    const res = await updateWorkItemProgressAction(workItem.id, formData);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setOpen(false);
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded-lg bg-emerald-700 text-white"
      >
        {open ? 'Anulează' : 'Actualizează progresul'}
      </button>

      {open && (
        <form
          action={onSubmit}
          style={{
            marginTop: 8,
            padding: 12,
            border: '1px solid #374151',
            borderRadius: 8,
            background: '#111827',
            display: 'grid',
            gap: 10,
            minWidth: 260,
          }}
        >
          <div style={{ fontSize: 13, color: '#9ca3af' }}>{workItem.title}</div>

          <label style={{ display: 'grid', gap: 6 }}>
            Progres (%)
            <input
              name="progressPercent"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={String(workItem.progressPercent)}
              required
              className="input"
            />
          </label>

          {error && <div style={{ color: 'crimson' }}>{error}</div>}

          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
            Salvează progresul
          </button>
        </form>
      )}
    </div>
  );
}
