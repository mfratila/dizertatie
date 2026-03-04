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
    <section style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Members</h2>

      {canManage && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Add member</h3>

          <form action={onAdd} className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1">
              <span>User ID</span>
              <input name="userId" className="input" type="number" min="1" required />
            </label>

            <label className="flex flex-col gap-1">
              <span>Role in project</span>
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
              Add
            </button>
          </form>

          {error && <div style={{ marginTop: 10, color: 'crimson' }}>{error}</div>}
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>Email</th>
              <th style={{ textAlign: 'left' }}>Role in project</th>
              <th style={{ textAlign: 'left' }}>Global role</th>
              {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {members.map((m) => {
              const disableRemove = m.roleInProject === 'PM' && pmCount <= 1;

              return (
                <tr key={m.userId}>
                  <td>{m.user.name ?? '(no name)'}</td>
                  <td>{m.user.email}</td>
                  <td>{m.roleInProject}</td>
                  <td>{m.user.role}</td>

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
                        title={disableRemove ? 'Cannot remove last PM' : 'Remove member'}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {members.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} style={{ padding: 12, color: '#666' }}>
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
