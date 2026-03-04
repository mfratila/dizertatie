'use client';

import { useState } from 'react';
import { createProjectAction } from './actions';

export default function CreateProjectInline() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<String | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);

    const res = await createProjectAction(formData);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    // succes: inchidem form-ul; lista isi da refresh automat prin revalidatePath
    setOpen(false);
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-sm"
      >
        {open ? 'Anulează' : 'Creează proiect'}
      </button>

      {open && (
        <form className="card" action={onSubmit} style={{ marginTop: 12, maxWidth: 520 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              Nume
              <input name="name" required style={{ width: '100%' }} />
            </label>

            <label>
              Data de start a proiectului
              <input name="startDate" type="date" required style={{ width: '100%' }} />
            </label>

            <label>
              Data de sfârșit a proiectului
              <input name="endDate" type="date" style={{ width: '100%' }} />
            </label>

            <label>
              Buget planificat (BAC)
              <input
                name="plannedBudget"
                type="number"
                min="0"
                step="0.01"
                required
                style={{ width: '100%' }}
              />
            </label>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <button
              type="submit"
              className="
flex items-center justify-center
    px-4 py-2
    rounded-lg
    bg-blue-600 text-white
    hover:bg-blue-700
    active:bg-blue-800
    transition-colors
    font-medium
    shadow-sm
  "
            >
              Creează proiect
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
