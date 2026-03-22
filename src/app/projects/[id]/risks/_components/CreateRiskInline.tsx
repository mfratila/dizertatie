'use client';

import { useState } from 'react';
import { createRiskAction } from '../_actions/actions';

export default function CreateRiskInline({
  projectId,
  members,
}: {
  projectId: number;
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

    const res = await createRiskAction(projectId, formData);

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
        {open ? 'Anulează' : 'Adaugă risc'}
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

            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                Probabilitate
                <select name="probability" defaultValue="3" className="input">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                Impact
                <select name="impact" defaultValue="3" className="input">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                Owner
                <select name="ownerUserId" defaultValue="" className="input">
                  <option value="">Nealocat</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              Notă
              <textarea name="note" rows={3} maxLength={1000} className="input" />
            </label>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Salvează riscul
            </button>
          </div>
        </form>
      )}
    </div>
  );
}