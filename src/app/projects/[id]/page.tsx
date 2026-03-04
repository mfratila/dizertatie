import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatMoney } from '../utils';

export default async function ProjectDetailsPage( { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const userId = Number(session.user.id);
  const role = session.user.role;
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) {
    notFound();
  }

  if (role !== Role.ADMIN) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { projectId: true },
    });

    if (!membership) notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      plannedBudget: true,
      members: {
        select: {
          roleInProject: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: [{ roleInProject: 'asc' }, { userId: 'asc' }],
      },
    },
  });

  if (!project) notFound();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>{project.name}</h1>
        <div style={{ color: '#666' }}>Project ID: {project.id}</div>
      </div>

      {/* Overview */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Overview</h2>
        <div style={{ display: 'grid', gap: 6 }}>
          <div>
            <strong>Status:</strong> {String(project.status)}
          </div>
          <div>
            <strong>Perioadă:</strong> {formatDate(project.startDate)} –{' '}
            {formatDate(project.endDate)}
          </div>
          <div>
            <strong>Buget planificat (BAC):</strong> {formatMoney(project.plannedBudget)}
          </div>
        </div>
      </section>

      {/* Members */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Members</h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                Name
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                Email
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                Role in Project
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
                Global Role
              </th>
            </tr>
          </thead>
          <tbody>
            {project.members.map((m) => (
              <tr key={m.user.id}>
                <td style={{ padding: 8 }}>{m.user.name ?? '(no name)'}</td>
                <td style={{ padding: 8 }}>{m.user.email}</td>
                <td style={{ padding: 8 }}>{String(m.roleInProject)}</td>
                <td style={{ padding: 8 }}>{String(m.user.role)}</td>
              </tr>
            ))}
            {project.members.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 12, color: '#666' }}>
                  Nu există membri în proiect.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Links */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Modules</h2>
        <ul style={{ display: 'grid', gap: 6, paddingLeft: 18 }}>
          <li>
            <Link href={`/projects/${project.id}/tasks`}>Tasks</Link>
          </li>
          <li>
            <Link href={`/projects/${project.id}/execution`}>Execution</Link>
          </li>
          <li>
            <Link href={`/projects/${project.id}/kpi`}>KPI</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
