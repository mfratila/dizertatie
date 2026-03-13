'use client';

import { useState } from 'react';
import { updateWorkItemAction } from '../_actions/actions';

type MemberOption = {
  userId: number;
  name: string;
  email: string;
};

export default function EditWorkItemInline({
  workItem,
  members,
  projectStartDate,
  projectEndDate,
}: {
  workItem: {
    id: number;
    title: string;
    plannedEndDate: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    assignedUserId: number | null;
  };
  members: MemberOption[];
  projectStartDate: string;
  projectEndDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);

    const res = await updateWorkItemAction(workItem.id, formData);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setOpen(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1 rounded-lg bg-slate-700 text-white"
      >
        {open ? 'Anulează' : 'Editează'}
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
            display: 'grid',
            gap: 12,
            minWidth: 320,
          }}
        >
          <label style={{ display: 'grid', gap: 6 }}>
            Titlu
            <input name="title" defaultValue={workItem.title} required className="input" />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Data finală planificată
            <input
              name="plannedEndDate"
              type="date"
              defaultValue={workItem.plannedEndDate}
              min={projectStartDate}
              max={projectEndDate}
              required
              className="input"
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Responsabil
            <select
              name="assignedUserId"
              defaultValue={workItem.assignedUserId ?? ''}
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
            Stare
            <select name="status" defaultValue={workItem.status} className="input">
              <option value="TODO">De făcut</option>
              <option value="IN_PROGRESS">În progres</option>
              <option value="DONE">Finalizat</option>
            </select>
          </label>

          {error && <div style={{ color: 'crimson' }}>{error}</div>}

          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">
            Salvează modificările
          </button>
        </form>
      )}
    </div>
  );
}
