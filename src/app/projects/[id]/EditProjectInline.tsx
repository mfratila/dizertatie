'use client';

import { useState } from 'react';
import { updateProjectAction } from './actions';

export default function EditProjectInline({
  projectId,
  initial,
}: {
  projectId: number;
  initial: {
    name: string;
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
    plannedBudget: number;
    status: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const res = await updateProjectAction(projectId, formData);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    setOpen(false);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-lg bg-slate-700 text-white"
      >
        {open ? 'Cancel' : 'Edit project'}
      </button>

      {open && (
        <form action={onSubmit} style={{ marginTop: 12, maxWidth: 520 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              Name
              <input name="name" defaultValue={initial.name} required className="input" />
            </label>

            <label>
              Start date
              <input
                name="startDate"
                type="date"
                defaultValue={initial.startDate}
                required
                className="input"
              />
            </label>

            <label>
              End date
              <input
                name="endDate"
                type="date"
                defaultValue={initial.endDate}
                required
                className="input"
              />
            </label>

            <label>
              Planned budget (BAC)
              <input
                name="plannedBudget"
                type="number"
                min="0"
                step="0.01"
                defaultValue={String(initial.plannedBudget)}
                required
                className="input"
              />
            </label>

            <label>
              Status
              <input name="status" defaultValue={initial.status} required className="input" />
            </label>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
