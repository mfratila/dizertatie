'use client';

import { useState } from 'react';
import { updateProjectAction } from '../_actions/actions';

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
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-lg bg-slate-700 text-white"
      >
        {open ? 'Anulează' : 'Editează proiectul'}
      </button>

      {open && (
        <form
          action={onSubmit}
          style={{
            marginTop: 12,
            maxWidth: 720,
            display: 'grid',
            gap: 12,
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 16,
            background: 'rgba(255, 255, 255, 0.035)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              Nume proiect
              <input name="name" defaultValue={initial.name} required className="input" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Data de început
              <input
                name="startDate"
                type="date"
                defaultValue={initial.startDate}
                required
                className="input"
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Data de final
              <input
                name="endDate"
                type="date"
                defaultValue={initial.endDate}
                required
                className="input"
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Buget planificat (BAC)
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

            <label style={{ display: 'grid', gap: 6 }}>
              Stare
              <select name="status" defaultValue={initial.status} required className="input">
                <option value="PLANNED">Planificat</option>
                <option value="ACTIVE">Activ</option>
                <option value="ON_HOLD">În așteptare</option>
                <option value="COMPLETED">Finalizat</option>
                <option value="CANCELLED">Anulat</option>
              </select>
            </label>
          </div>

          {error && <div style={{ color: 'crimson' }}>{error}</div>}

          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
            Salvează modificările
          </button>
        </form>
      )}
    </div>
  );
}
