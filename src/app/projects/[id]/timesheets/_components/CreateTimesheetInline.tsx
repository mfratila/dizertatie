'use client';

import { useState } from 'react';
import { createTimesheetAction } from '../_actions/actions';

export default function CreateTimesheetInline({
  projectId,
  workItems,
}: {
  projectId: number;
  workItems: {
    id: number;
    title: string;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);

    const res = await createTimesheetAction(projectId, formData);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setOpen(false);
  }

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white"
      >
        {open ? 'Anulează' : 'Adaugă timesheet'}
      </button>

      {open && (
        <form
          action={onSubmit}
          style={{
            marginTop: 12,
            padding: 16,
            border: '1px solid #374151',
            borderRadius: 8,
            background: '#111827',
            maxWidth: 720,
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              Task
              <select name="workItemId" required className="input" defaultValue="">
                <option value="">Selectează task</option>
                {workItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                Data
                <input name="date" type="date" required className="input" />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                Ore
                <input
                  name="hours"
                  type="number"
                  min="0.25"
                  max="24"
                  step="0.25"
                  required
                  className="input"
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              Notă
              <textarea name="note" rows={3} className="input" maxLength={500} />
            </label>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Salvează timesheet
            </button>
          </div>
        </form>
      )}
    </div>
  );
}