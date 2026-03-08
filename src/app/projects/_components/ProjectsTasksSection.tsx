import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/authOptions';
import { canViewProject } from '@/lib/authz';
import { ProjectTasksTable } from './ProjectTasksTable';

export async function ProjectTasksSection({
  projectId,
}: {
  projectId: number;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canViewProject(session, projectId);

  if (!allowed) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        You do not have access to this project.
      </div>
    );
  }

  const items = await prisma.workItem.findMany({
    where: { projectId },
    orderBy: [{ plannedEndDate: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      projectId: true,
      title: true,
      description: true,
      plannedStartDate: true,
      plannedEndDate: true,
      status: true,
      progressPercent: true,
      assignedUserId: true,
      createdAt: true,
      updatedAt: true,
      assignedUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tasks</h2>
        <p className="text-sm text-gray-600">
          Project work items ordered by planned end date.
        </p>
      </div>

      <ProjectTasksTable items={items} />
    </section>
  );
}