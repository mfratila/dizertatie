'use client';

import { useState } from 'react';
import { createCostEntryAction } from '../_actions/actions';

export default function CreateCostEntryInline({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);

    const res = await createCostEntryAction(projectId, formData);

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
        {open ? 'Anulează' : 'Adaugă cost'}
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
                Valoare
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="input"
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                Categorie
                <select name="category" defaultValue="" className="input">
                  <option value="">Fără categorie</option>
                  <option value="Labor">Labor</option>
                  <option value="Tools">Tools</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              Notă
              <textarea name="note" rows={3} maxLength={500} className="input" />
            </label>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Salvează costul
            </button>
          </div>
        </form>
      )}
    </div>
  );
}