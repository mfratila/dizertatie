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

  const completedWorkItems = workItems.filter((item) => item.status === 'DONE').length;
  const averageProgress = workItems.length
    ? Math.round(workItems.reduce((sum, item) => sum + item.progressPercent, 0) / workItems.length)
    : 0;
  const pmCount = project.members.filter((member) => member.roleInProject === 'PM').length;
  const memberCount = project.members.length;
  const projectStatus = project.archivedAt ? 'ARHIVAT' : String(project.status);

  const modules = [
    {
      title: 'Dashboard KPI',
      description: 'Analizează valorile curente, trendurile CPI/SPI/Burn Rate și starea RAG.',
      href: `/projects/${project.id}/dashboard`,
      cta: 'Deschide dashboard-ul',
    },
    {
      title: 'Pontaje',
      description: 'Înregistrează și urmărește orele lucrate pe activitățile proiectului.',
      href: `/projects/${project.id}/timesheets`,
      cta: 'Gestionează pontaje',
    },
    {
      title: 'Costuri',
      description: 'Consultă și gestionează costurile reale utilizate în calculul Actual Cost.',
      href: `/projects/${project.id}/costs`,
      cta: 'Vezi costurile',
    },
    {
      title: 'Riscuri',
      description: 'Monitorizează registrul de riscuri și contextul managerial al proiectului.',
      href: `/projects/${project.id}/risks`,
      cta: 'Vezi riscurile',
    },
  ];

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 34%), var(--background)',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px 72px' }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/projects" style={subtleLinkStyle}>
            ← Înapoi la proiecte
          </Link>
        </div>

        <section className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatusBadge status={projectStatus} />
                <span style={{ opacity: 0.68 }}>ID proiect #{project.id}</span>
              </div>

              <h1
                style={{
                  margin: '14px 0 10px',
                  fontSize: 'clamp(34px, 5vw, 54px)',
                  lineHeight: 1,
                  letterSpacing: '-0.045em',
                }}
              >
                {project.name}
              </h1>

              <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.78, fontSize: 16 }}>
                Pagina centrală a proiectului reunește planificarea, echipa, activitățile și
                modulele operaționale folosite pentru monitorizarea performanței.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Link href={`/projects/${project.id}/dashboard`} style={primaryActionStyle}>
                Dashboard KPI
              </Link>
              {canArchive && !project.archivedAt && <ArchiveProjectButton projectId={project.id} />}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}
          >
            <SummaryCard label="Perioadă" value={`${formatDate(project.startDate)} – ${formatDate(project.endDate)}`} />
            <SummaryCard label="Buget planificat (BAC)" value={formatMoney(project.plannedBudget)} />
            <SummaryCard label="Progres mediu" value={`${averageProgress}%`} />
            <SummaryCard label="Activități finalizate" value={`${completedWorkItems}/${workItems.length}`} />
            <SummaryCard label="Membri proiect" value={String(memberCount)} detail={`${pmCount} PM`} />
          </div>
        </section>

        {canEditProject && (
          <section className="card" style={{ marginBottom: 20 }}>
            <SectionHeading
              title="Administrare proiect"
              description="Actualizează datele de planificare, bugetul și starea proiectului. Aceste modificări nu declanșează automat recalcularea KPI."
            />
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
          </section>
        )}

        <section style={{ marginBottom: 20 }}>
          <SectionHeading
            title="Module proiect"
            description="Navighează rapid către zonele principale de lucru și analiză ale proiectului."
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {modules.map((module) => (
              <Link key={module.href} href={module.href} style={moduleCardStyle}>
                <span style={{ fontSize: 12, opacity: 0.62, fontWeight: 700 }}>MODUL</span>
                <strong style={{ fontSize: 20 }}>{module.title}</strong>
                <span style={{ lineHeight: 1.6, opacity: 0.76 }}>{module.description}</span>
                <span style={{ marginTop: 'auto', fontWeight: 800, color: '#60a5fa' }}>{module.cta} →</span>
              </Link>
            ))}
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

        <section className="card" style={{ marginTop: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <SectionHeading
              title="Activități planificate"
              description="Urmărește execuția activităților, progresul și responsabilul alocat."
            />
            <span style={{ opacity: 0.68 }}>{workItems.length} activități active</span>
          </div>

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
            <div
              style={{
                border: '1px dashed var(--border)',
                borderRadius: 12,
                padding: 18,
                color: '#9ca3af',
              }}
            >
              Nu există activități definite pentru acest proiect.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 14 }}>
              <table className="table">
                <thead style={{ background: 'rgba(15, 23, 42, 0.88)' }}>
                  <tr>
                    <th style={thStyle}>Activitate</th>
                    <th style={thStyle}>Stare</th>
                    <th style={thStyle}>Progres</th>
                    <th style={thStyle}>Data finală planificată</th>
                    <th style={thStyle}>Responsabil</th>
                    <th style={thStyle}>Planificare</th>
                    <th style={thStyle}>Actualizare progres</th>
                    <th style={thStyle}>Arhivare</th>
                  </tr>
                </thead>
                <tbody>
                  {workItems.map((item) => {
                    const canUpdateProgress =
                      !project.archivedAt &&
                      (role === Role.ADMIN ||
                        isPmInProject ||
                        (actorMembership?.roleInProject === 'MEMBER' && item.assignedUserId === userId));

                    return (
                      <tr key={item.id}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700 }}>{item.title}</div>
                          {item.description ? (
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 1.5 }}>
                              {item.description}
                            </div>
                          ) : null}
                        </td>
                        <td style={tdStyle}>
                          <WorkItemStatusBadge status={String(item.status)} />
                        </td>
                        <td style={tdStyle}>
                          <div style={{ minWidth: 120 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.progressPercent}%</div>
                            <div
                              style={{
                                height: 8,
                                borderRadius: 999,
                                background: 'rgba(148, 163, 184, 0.18)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${item.progressPercent}%`,
                                  borderRadius: 999,
                                  background: '#60a5fa',
                                }}
                              />
                            </div>
                          </div>
                        </td>
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
      </div>
    </main>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{title}</h2>
      {description ? <p style={{ margin: '6px 0 0', opacity: 0.72, lineHeight: 1.6 }}>{description}</p> : null}
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 14,
        background: 'rgba(255, 255, 255, 0.035)',
      }}
    >
      <p style={{ margin: 0, opacity: 0.66, fontSize: 13 }}>{label}</p>
      <strong style={{ display: 'block', marginTop: 6, fontSize: 20 }}>{value}</strong>
      {detail ? <span style={{ display: 'block', marginTop: 4, opacity: 0.66 }}>{detail}</span> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span style={badgeStyle}>{formatProjectStatus(status)}</span>;
}

function WorkItemStatusBadge({ status }: { status: string }) {
  return <span style={badgeStyle}>{formatWorkItemStatus(status)}</span>;
}

function formatProjectStatus(status: string) {
  switch (status) {
    case 'PLANNED':
      return 'Planificat';
    case 'ACTIVE':
      return 'Activ';
    case 'ON_HOLD':
      return 'În așteptare';
    case 'COMPLETED':
      return 'Finalizat';
    case 'CANCELLED':
      return 'Anulat';
    case 'ARHIVAT':
      return 'Arhivat';
    default:
      return status;
  }
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

const subtleLinkStyle: CSSProperties = {
  color: 'inherit',
  opacity: 0.74,
  textDecoration: 'none',
};

const primaryActionStyle: CSSProperties = {
  color: '#020617',
  background: '#e5e7eb',
  padding: '10px 14px',
  borderRadius: 999,
  textDecoration: 'none',
  fontWeight: 800,
};

const moduleCardStyle: CSSProperties = {
  minHeight: 190,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  color: 'inherit',
  textDecoration: 'none',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 18,
  background: 'var(--surface)',
};

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '5px 10px',
  fontSize: 12,
  fontWeight: 800,
  background: 'rgba(96, 165, 250, 0.14)',
  color: '#93c5fd',
  whiteSpace: 'nowrap',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  color: '#e5e7eb',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const tdStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
};
