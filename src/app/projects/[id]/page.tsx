import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { formatDate, formatMoney } from '../utils';
import EditProjectInline from './EditProjectInline';
import MembersSection from './members/MembersSection';
import ArchiveProjectButton from './ArchiveProjectButton';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();

  const userId = Number(session.user.id);
  const role = session.user.role;

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  // 1) Access rule (read details):
  // Admin OR member of project
  let actorMembership: { roleInProject: string } | null = null;

  if (role !== Role.ADMIN) {
    actorMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { roleInProject: true },
    });

    if (!actorMembership) notFound();
  }

  // 2) Load project (includes members)
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
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: [{ roleInProject: 'asc' }, { userId: 'asc' }],
      },
    },
  });

  if (!project) notFound();

  // 3) Permissions for edit/manage
  // Admin: can edit + can manage members for any project
  // PM: only if PM in this project
  const isPmInProject = role === Role.ADMIN ? true : actorMembership?.roleInProject === 'PM';

  const canEditProject = role === Role.ADMIN || (role === Role.PM && isPmInProject);
  const canManageMembers = role === Role.ADMIN || (role === Role.PM && isPmInProject);
  const canArchive = role === Role.ADMIN || (role === Role.PM && isPmInProject);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>{project.name}</h1>
        <div style={{ color: '#666' }}>Project ID: {project.id}</div>

        {canArchive && !project.archivedAt && <ArchiveProjectButton projectId={project.id} />}
        {/* ✅ Edit project: Admin OR PM-in-project */}
        {canEditProject && (
          <EditProjectInline
            projectId={project.id}
            initial={{
              name: project.name,
              startDate: project.startDate.toISOString().split('T')[0],
              endDate: project.endDate.toISOString().split('T')[0],
              plannedBudget: Number(project.plannedBudget),
              status: String(project.status),
            }}
          />
        )}
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

      {/* Members (Manage + List) */}
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

      {/* Links */}
      <section style={{ marginTop: 20 }}>
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
