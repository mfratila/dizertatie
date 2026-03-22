import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { RiskStatus, Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import CreateRiskInline from './_components/CreateRiskInline';
import RiskRowActions from './_components/RiskRowActions';

export default async function ProjectRisksPage({
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

  const canManage = role === Role.ADMIN || projectMembership?.roleInProject === Role.PM;

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

  const risks = await prisma.risk.findMany({
    where: {
      projectId,
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      probability: true,
      impact: true,
      status: true,
      ownerUserId: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const openCount = risks.filter((r) => r.status === RiskStatus.OPEN).length;
  const closedCount = risks.filter((r) => r.status === RiskStatus.CLOSED).length;

  return (
    <div style={{ padding: 24 }}>
      <h1>Risks</h1>
      <p style={{ color: '#666' }}>Project: {project.name}</p>

      {canManage && (
        <CreateRiskInline
          projectId={projectId}
          members={members.map((member) => ({
            userId: member.userId,
            name: member.user.name ?? 'Fără nume',
            email: member.user.email ?? '-',
          }))}
        />
      )}

      <p style={{ color: '#666', marginTop: 8 }}>
        Total riscuri: {risks.length} · Open: {openCount} · Closed: {closedCount}
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
              Titlu
            </th>
            <th style={{ textAlign: 'center', borderBottom: '1px solid #ddd', padding: 8 }}>
              P
            </th>
            <th style={{ textAlign: 'center', borderBottom: '1px solid #ddd', padding: 8 }}>
              I
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Status
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Owner
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Notă
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Acțiuni
            </th>
          </tr>
        </thead>

        <tbody>
          {risks.map((risk) => (
            <tr key={risk.id}>
              <td style={{ padding: 8 }}>{risk.title}</td>
              <td style={{ padding: 8, textAlign: 'center' }}>{risk.probability}</td>
              <td style={{ padding: 8, textAlign: 'center' }}>{risk.impact}</td>
              <td style={{ padding: 8 }}>{risk.status}</td>
              <td style={{ padding: 8 }}>
                {risk.owner ? `${risk.owner.name} (${risk.owner.email})` : '-'}
              </td>
              <td style={{ padding: 8 }}>{risk.note ?? '-'}</td>
              <td style={{ padding: 8, verticalAlign: 'top' }}>
                <RiskRowActions
                  risk={{
                    id: risk.id,
                    title: risk.title,
                    probability: risk.probability,
                    impact: risk.impact,
                    status: risk.status,
                    ownerUserId: risk.ownerUserId,
                    note: risk.note,
                  }}
                  canManage={!!canManage}
                  members={members.map((member) => ({
                    userId: member.userId,
                    name: member.user.name ?? 'Fără nume',
                    email: member.user.email ?? '-',
                  }))}
                />
              </td>
            </tr>
          ))}

          {risks.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 12, color: '#666' }}>
                Nu există riscuri pentru acest proiect.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}