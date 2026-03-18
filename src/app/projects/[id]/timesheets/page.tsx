import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import CreateTimesheetInline from './_components/CreateTimesheetInline';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ro-RO').format(date);
}

export default async function ProjectExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();

  const userId = Number(session.user.id);
  const role = session.user.role;

  const { id: projectIdParam } = await params;
  const projectId = Number(projectIdParam);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  const project =
    role === Role.ADMIN
      ? await prisma.project.findFirst({
          where: {
            id: projectId,
            archivedAt: null,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : await prisma.project.findFirst({
          where: {
            id: projectId,
            archivedAt: null,
            members: {
              some: { userId },
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

  if (!project) {
    notFound();
  }

  const canCreate = role === Role.ADMIN || role === Role.PM || role === Role.MEMBER;

  const workItems = await prisma.workItem.findMany({
    where: {
      projectId,
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
    },
  });

  const timesheets = await prisma.timesheet.findMany({
    where: {
      workItem: {
        projectId,
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      date: true,
      hours: true,
      note: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      workItem: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>Execution</h1>
      <p style={{ color: '#666' }}>Project: {project.name}</p>

      <h2>Timesheets</h2>

      {canCreate && <CreateTimesheetInline projectId={projectId} workItems={workItems} />}

      <table
        className="card"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 12,
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Utilizator
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Task
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Data
            </th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>
              Ore
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Notă
            </th>
          </tr>
        </thead>
        <tbody>
          {timesheets.map((t) => (
            <tr key={t.id}>
              <td style={{ padding: 8 }}>
                {t.user.name} ({t.user.email})
              </td>
              <td style={{ padding: 8 }}>{t.workItem.title}</td>
              <td style={{ padding: 8 }}>{formatDate(t.date)}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{String(t.hours)}</td>
              <td style={{ padding: 8 }}>{t.note ?? '-'}</td>
            </tr>
          ))}

          {timesheets.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 12, color: '#666' }}>
                Nu există timesheet-uri pentru acest proiect.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}