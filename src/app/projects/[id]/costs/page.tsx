import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import CreateCostEntryInline from './_components/CreateCostEntryInline';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ro-RO').format(date);
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export default async function ProjectCostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();

  const currentUserId = Number(session.user.id);
  const role = session.user.role;

  const { id: projectIdParam } = await params;
  const projectId = Number(projectIdParam);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  const projectMembership =
    role === Role.ADMIN
      ? null
      : await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: currentUserId,
            },
          },
          select: {
            roleInProject: true,
          },
        });

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
              some: { userId: currentUserId },
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

  const canCreate = role === Role.ADMIN || projectMembership?.roleInProject === Role.PM;

  const costs = await prisma.costEntry.findMany({
    where: {
      projectId,
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      date: true,
      amount: true,
      category: true,
      note: true,
      createdAt: true,
    },
  });

  const totalCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div style={{ padding: 24 }}>
      <h1>Costs</h1>
      <p style={{ color: '#666' }}>Project: {project.name}</p>

      {canCreate && <CreateCostEntryInline projectId={projectId} />}

      <p style={{ color: '#666', marginTop: 8 }}>
        {costs.length} înregistrări · Total AC curent: {formatMoney(totalCost)}
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
              Data
            </th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>
              Valoare
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Categorie
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Notă
            </th>
          </tr>
        </thead>

        <tbody>
          {costs.map((c) => (
            <tr key={c.id}>
              <td style={{ padding: 8 }}>{formatDate(c.date)}</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{formatMoney(Number(c.amount))}</td>
              <td style={{ padding: 8 }}>{c.category ?? '-'}</td>
              <td style={{ padding: 8 }}>{c.note ?? '-'}</td>
            </tr>
          ))}

          {costs.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 12, color: '#666' }}>
                Nu există costuri pentru acest proiect.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}