'use client';

import { useState } from 'react';
import { closeRiskAction, updateRiskAction } from '../_actions/actions';

export default function RiskRowActions({
  risk,
  canManage,
  members,
}: {
  risk: {
    id: number;
    title: string;
    probability: number;
    impact: number;
    status: 'OPEN' | 'CLOSED';
    ownerUserId: number | null;
    note: string | null;
  };
  canManage: boolean;
  members: {
    userId: number;
    name: string;
    email: string;
  }[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setError(null);

    const res = await updateRiskAction(risk.id, formData);
    if (!res.ok) {
      setError(res.message);
      return;
    }

    setEditing(false);
  }

  async function onClose() {
    setError(null);

    const res = await closeRiskAction(risk.id);
    if (!res.ok) {
      setError(res.message);
      return;
    }
  }

  if (!canManage) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {!editing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white"
          >
            Editează
          </button>

          {risk.status === 'OPEN' && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white"
            >
              Închide
            </button>
          )}
        </div>
      ) : (
        <form
          action={onUpdate}
          style={{
            display: 'grid',
            gap: 8,
            padding: 12,
            border: '1px solid #374151',
            borderRadius: 8,
            background: '#111827',
            minWidth: 320,
          }}
        >
          <label style={{ display: 'grid', gap: 6 }}>
            Titlu
            <input name="title" defaultValue={risk.title} required className="input" />
          </label>

          <div
            style={{
              display: 'grid',
              gap: 8,
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              Probabilitate
              <select name="probability" defaultValue={String(risk.probability)} className="input">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Impact
              <select name="impact" defaultValue={String(risk.impact)} className="input">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Status
              <select name="status" defaultValue={risk.status} className="input">
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            Owner
            <select
              name="ownerUserId"
              defaultValue={risk.ownerUserId ? String(risk.ownerUserId) : ''}
              className="input"
            >
              <option value="">Nealocat</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Notă
            <textarea name="note" rows={3} defaultValue={risk.note ?? ''} className="input" />
          </label>

          {error && <div style={{ color: 'crimson' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="px-3 py-1 rounded-lg bg-blue-600 text-white">
              Salvează
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="px-3 py-1 rounded-lg bg-gray-600 text-white"
            >
              Anulează
            </button>
          </div>
        </form>
      )}

      {error && !editing && <div style={{ color: 'crimson' }}>{error}</div>}
    </div>
  );
}