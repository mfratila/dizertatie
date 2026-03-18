import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { formatDate, formatMoney } from '../_utils/utils';
import EditProjectInline from './_components/EditProjectInline';
import CreateWorkItemInline from './_components/CreateWorkItemInline';
import EditWorkItemInline from './_components/EditWorkItemInline';
import UpdateWorkItemProgressInline from './_components/UpdateWorkItemProgressInline';
import ArchiveWorkItemButton from './_components/ArchiveWorkItemButton';
import MembersSection from './members/MembersSection';
import ArchiveProjectButton from './_components/ArchiveProjectButton';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();

  const userId = Number(session.user.id);
  const role = session.user.role;

  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId)) notFound();

  let actorMembership: { roleInProject: string } | null = null;

  if (role !== Role.ADMIN) {
    actorMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { roleInProject: true },
    });

    if (!actorMembership) notFound();
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
      archivedAt: true,
      members: {
        select: {
          userId: true,
          roleInProject: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [{ roleInProject: 'asc' }, { userId: 'asc' }],
      },
    },
  });

  if (!project) notFound();

  const workItems = await prisma.workItem.findMany({
    where: {
      projectId: project.id,
      archivedAt: null,
    },
    orderBy: [{ plannedEndDate: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      progressPercent: true,
      plannedEndDate: true,
      assignedUserId: true,
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const isPmInProject = actorMembership?.roleInProject === 'PM';

  const canEditProject = role === Role.ADMIN || isPmInProject;
  const canManageMembers = role === Role.ADMIN || isPmInProject;
  const canArchive = role === Role.ADMIN || isPmInProject;
  const canCreateWorkItems = role === Role.ADMIN || isPmInProject;
  const canEditWorkItems = role === Role.ADMIN || isPmInProject;

  const projectMembersForSelect = project.members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
  }));

  const projectStartDateStr = project.startDate.toISOString().split('T')[0];
  const projectEndDateStr = project.endDate.toISOString().split('T')[0];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>{project.name}</h1>
        <div style={{ color: '#9ca3af' }}>ID proiect: {project.id}</div>

        {canArchive && !project.archivedAt && <ArchiveProjectButton projectId={project.id} />}

        {canEditProject && (
          <EditProjectInline
            projectId={project.id}
            initial={{
              name: project.name,
              startDate: projectStartDateStr,
              endDate: projectEndDateStr,
              plannedBudget: Number(project.plannedBudget),
              status: String(project.status),
            }}
          />
        )}
      </div>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Prezentare generală</h2>
        <div style={{ display: 'grid', gap: 6 }}>
          <div>
            <strong>Stare:</strong> {String(project.status)}
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

      <MembersSection
        projectId={project.id}
        canManage={canManageMembers}
        members={project.members.map((m) => ({
          userId: m.userId,
          roleInProject: String(m.roleInProject) as 'PM' | 'MEMBER' | 'VIEWER',
          user: {
            name: m.user.name,
            email: m.user.email,
            role: String(m.user.role),
          },
        }))}
      />

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Activități</h2>

        {canCreateWorkItems && !project.archivedAt && (
          <CreateWorkItemInline
            projectId={project.id}
            initial={{
              plannedStartDateMin: projectStartDateStr,
              plannedEndDateMax: projectEndDateStr,
            }}
            members={projectMembersForSelect}
          />
        )}

        {workItems.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>
            Nu există activități definite pentru acest proiect.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid #374151',
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#0f172a' }}>
                <tr>
                  <th style={thStyle}>Titlu</th>
                  <th style={thStyle}>Stare</th>
                  <th style={thStyle}>Progres</th>
                  <th style={thStyle}>Data finală planificată</th>
                  <th style={thStyle}>Responsabil</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Progres</th>
                  <th style={thStyle}>Arhivare</th>
                </tr>
              </thead>
              <tbody>
                {workItems.map((item) => {
                  const canUpdateProgress =
                    !project.archivedAt &&
                    (role === Role.ADMIN ||
                      isPmInProject ||
                      (actorMembership?.roleInProject === 'MEMBER' &&
                        item.assignedUserId === userId));

                  return (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{item.title}</div>
                        {item.description ? (
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                            {item.description}
                          </div>
                        ) : null}
                      </td>
                      <td style={tdStyle}>{formatWorkItemStatus(String(item.status))}</td>
                      <td style={tdStyle}>{item.progressPercent}%</td>
                      <td style={tdStyle}>{formatDate(item.plannedEndDate)}</td>
                      <td style={tdStyle}>{item.assignedUser?.name ?? 'Nealocat'}</td>
                      <td style={tdStyle}>
                        {canEditWorkItems && !project.archivedAt ? (
                          <EditWorkItemInline
                            workItem={{
                              id: item.id,
                              title: item.title,
                              plannedEndDate: item.plannedEndDate.toISOString().split('T')[0],
                              status: String(item.status) as 'TODO' | 'IN_PROGRESS' | 'DONE',
                              assignedUserId: item.assignedUserId,
                            }}
                            members={projectMembersForSelect}
                            projectStartDate={projectStartDateStr}
                            projectEndDate={projectEndDateStr}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={tdStyle}>
                        {canUpdateProgress ? (
                          <UpdateWorkItemProgressInline
                            workItem={{
                              id: item.id,
                              title: item.title,
                              progressPercent: item.progressPercent,
                            }}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={tdStyle}>
                        {canEditWorkItems && !project.archivedAt ? (
                          <ArchiveWorkItemButton workItemId={item.id} title={item.title} />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Module</h2>
        <ul style={{ display: 'grid', gap: 6, paddingLeft: 18 }}>
          <li>
            <Link href={`/projects/${project.id}/tasks`}>Activități</Link>
          </li>
          <li>
            <Link href={`/projects/${project.id}/execution`}>Execuție</Link>
          </li>
          <li>
            <Link href={`/projects/${project.id}/kpi`}>Indicatori KPI</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

function formatWorkItemStatus(status: string) {
  switch (status) {
    case 'TODO':
      return 'De făcut';
    case 'IN_PROGRESS':
      return 'În progres';
    case 'DONE':
      return 'Finalizat';
    default:
      return status;
  }
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #374151',
  backgroundColor: '#0f172a',
  color: '#e5e7eb',
  fontWeight: 600,
};

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #1f2937',
  verticalAlign: 'top',
};
