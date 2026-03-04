import { prisma } from '@/lib/prisma';

export type ProjectAccess = {
  isMember: boolean;
  isPmInProject: boolean;
};

export async function getProjectAccess(projectId: number, userId: number): Promise<ProjectAccess> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { roleInProject: true },
  });

  return {
    isMember: Boolean(membership),
    isPmInProject: membership?.roleInProject === 'PM',
  };
}
