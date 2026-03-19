import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Prisma, Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import CreateTimesheetInline from './_components/CreateTimesheetInline';
import TimesheetFilters from './_components/TimesheetFilters';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ro-RO').format(date);
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

export default async function ProjectTimesheetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    userId?: string;
  }>;
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

  const resolvedSearchParams = await searchParams;

  const fromRaw = resolvedSearchParams.from?.trim() ?? '';
  const toRaw = resolvedSearchParams.to?.trim() ?? '';
  const userIdRaw = resolvedSearchParams.userId?.trim() ?? '';

  let from: Date | null = null;
  let to: Date | null = null;
  let filterUserId: number | null = null;

  if (fromRaw) {
    const parsedFrom = new Date(fromRaw);
    if (isValidDate(parsedFrom)) {
      from = parsedFrom;
    }
  }

  if (toRaw) {
    const parsedTo = new Date(toRaw);
    if (isValidDate(parsedTo)) {
      parsedTo.setHours(23, 59, 59, 999);
      to = parsedTo;
    }
  }

  if (userIdRaw) {
    const parsedUserId = Number(userIdRaw);
    if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
      filterUserId = parsedUserId;
    }
  }

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

  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
    },
    orderBy: {
      user: {
        name: 'asc',
      },
    },
    select: {
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const where: Prisma.TimesheetWhereInput = {
    workItem: {
      projectId,
    },
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(filterUserId ? { userId: filterUserId } : {}),
  };

  const timesheets = await prisma.timesheet.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      date: true,
      hours: true,
      note: true,
      createdAt: true,
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

  const totalHours = timesheets.reduce((sum, t) => sum + Number(t.hours), 0);

  return (
    <div style={{ padding: 24 }}>
      <h1>Timesheets</h1>
      <p style={{ color: '#666' }}>Project: {project.name}</p>

      {canCreate && <CreateTimesheetInline projectId={projectId} workItems={workItems} />}

      <TimesheetFilters
        members={members.map((member) => ({
          userId: member.userId,
          name: member.user.name ?? 'Fără nume',
          email: member.user.email ?? '-',
        }))}
      />

      <p style={{ color: '#666', marginTop: 8 }}>
        {timesheets.length} înregistrări · Total ore: {totalHours}
      </p>

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
                Nu există timesheet-uri pentru filtrele selectate.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}