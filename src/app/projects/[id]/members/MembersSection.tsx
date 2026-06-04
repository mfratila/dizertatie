'use client';

import { useMemo, useState } from 'react';
import { addProjectMemberAction, removeProjectMemberAction } from './actions';

type MemberRow = {
  userId: number;
  roleInProject: 'PM' | 'MEMBER' | 'VIEWER';
  user: { name: string | null; email: string; role: string };
};

export default function MembersSection({
  projectId,
  canManage,
  members,
}: {
  projectId: number;
  canManage: boolean;
  members: MemberRow[];
}) {
  const [error, setError] = useState<string | null>(null);

  const pmCount = useMemo(() => members.filter((m) => m.roleInProject === 'PM').length, [members]);

  async function onAdd(formData: FormData) {
    setError(null);
    const res = await addProjectMemberAction(projectId, formData);
    if (!res.ok) setError(res.message);
  }

  async function onRemove(targetUserId: number) {
    setError(null);
    const res = await removeProjectMemberAction(projectId, targetUserId);
    if (!res.ok) setError(res.message);
  }

  return (
    <section className="card" style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Echipa proiectului</h2>
        <p style={{ margin: '6px 0 0', opacity: 0.72, lineHeight: 1.6 }}>
          Membrii proiectului determină vizibilitatea datelor și drepturile operaționale în aplicație.
        </p>
      </div>

      {canManage && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            border: '1px solid var(--border)',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.035)',
          }}
        >
          <h3 style={{ fontWeight: 700, margin: '0 0 10px' }}>Adaugă membru</h3>

          <form action={onAdd} className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span>ID utilizator</span>
              <input name="userId" className="input" type="number" min="1" required />
            </label>

            <label className="flex flex-col gap-1">
              <span>Rol în proiect</span>
              <select name="roleInProject" className="input" defaultValue="MEMBER">
                <option value="PM">PM</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Adaugă
            </button>
          </form>

          {error && <div style={{ marginTop: 10, color: 'crimson' }}>{error}</div>}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 14 }}>
        <table className="table">
          <thead style={{ background: 'rgba(15, 23, 42, 0.88)' }}>
            <tr>
              <th style={{ textAlign: 'left' }}>Nume</th>
              <th style={{ textAlign: 'left' }}>Email</th>
              <th style={{ textAlign: 'left' }}>Rol în proiect</th>
              <th style={{ textAlign: 'left' }}>Rol global</th>
              {canManage && <th style={{ textAlign: 'right' }}>Acțiuni</th>}
            </tr>
          </thead>

          <tbody>
            {members.map((m) => {
              const disableRemove = m.roleInProject === 'PM' && pmCount <= 1;

              return (
                <tr key={m.userId}>
                  <td>{m.user.name ?? '(fără nume)'}</td>
                  <td>{m.user.email}</td>
                  <td>{formatRole(m.roleInProject)}</td>
                  <td>{formatRole(m.user.role)}</td>

                  {canManage && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => onRemove(m.userId)}
                        disabled={disableRemove}
                        className={
                          disableRemove
                            ? 'px-3 py-1.5 rounded-lg bg-slate-500 text-white opacity-50 cursor-not-allowed'
                            : 'px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors'
                        }
                        title={
                          disableRemove
                            ? 'Nu poți elimina ultimul PM al proiectului'
                            : 'Elimină membrul din proiect'
                        }
                      >
                        Elimină
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {members.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} style={{ padding: 12, color: '#9ca3af' }}>
                  Nu există membri în proiect.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!canManage && error && <div style={{ marginTop: 10, color: 'crimson' }}>{error}</div>}
      </div>
    </section>
  );
}

function formatRole(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'ADMIN';
    case 'PM':
      return 'PM';
    case 'MEMBER':
      return 'MEMBER';
    case 'VIEWER':
      return 'VIEWER';
    default:
      return role;
  }
}
