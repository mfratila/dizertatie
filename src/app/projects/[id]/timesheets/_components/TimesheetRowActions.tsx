'use client';

import { useState } from 'react';
import { deleteTimesheetAction, updateTimesheetAction } from '../_actions/actions';

type Props = {
  timesheet: {
    id: number;
    date: Date;
    hours: string | number;
    note: string | null;
  };
  canManage: boolean;
};

function toInputDate(value: Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TimesheetRowActions({ timesheet, canManage }: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setError(null);

    const res = await updateTimesheetAction(timesheet.id, formData);

    if (!res.ok) {
      setError(res.message);
      return;
    }

    setEditing(false);
  }

  async function onDelete() {
    setError(null);

    const confirmed = window.confirm('Sigur vrei să ștergi această înregistrare?');
    if (!confirmed) return;

    const res = await deleteTimesheetAction(timesheet.id);

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

          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1 rounded-lg bg-red-600 text-white"
          >
            Șterge
          </button>
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
            Data
            <input
              name="date"
              type="date"
              defaultValue={toInputDate(timesheet.date)}
              required
              className="input"
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Ore
            <input
              name="hours"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              defaultValue={String(timesheet.hours)}
              required
              className="input"
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            Notă
            <textarea
              name="note"
              rows={3}
              defaultValue={timesheet.note ?? ''}
              maxLength={500}
              className="input"
            />
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