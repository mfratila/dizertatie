'use client';

import { useState } from 'react';
import { createWorkItemAction } from '../_actions/actions';

export default function CreateWorkItemInline({
  projectId,
  initial,
  members,
}: {
  projectId: number;
  initial: {
    plannedStartDateMin: string;
    plannedEndDateMax: string;
  };
  members: {
    userId: number;
    name: string;
    email: string;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);

    const res = await createWorkItemAction(projectId, formData);

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
        {open ? 'Anulează' : 'Adaugă activitate'}
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
              Titlu
              <input name="title" required className="input" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Descriere
              <textarea name="description" rows={3} className="input" />
            </label>

            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                Data de început planificată
                <input
                  name="plannedStartDate"
                  type="date"
                  min={initial.plannedStartDateMin}
                  max={initial.plannedEndDateMax}
                  className="input"
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                Data finală planificată
                <input
                  name="plannedEndDate"
                  type="date"
                  min={initial.plannedStartDateMin}
                  max={initial.plannedEndDateMax}
                  required
                  className="input"
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                Responsabil
                <select name="assignedUserId" defaultValue="" className="input">
                  <option value="">Nealocat</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Salvează activitatea
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
