'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';

export async function archiveProjectAction(projectId: number) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const userId = Number(session.user.id);
  const role = session.user.role;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, archivedAt: true },
  });

  if (!project) {
    return { ok: false as const, message: 'Project not found.' };
  }

  if (project.archivedAt) {
    return { ok: false as const, message: 'Project is already archived.' };
  }

  if (role === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { roleInProject: true },
    });

    if (!membership || membership.roleInProject !== 'PM') {
      return { ok: false as const, message: 'Forbidden.' };
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { archivedAt: new Date() },
  });

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);

  return { ok: true as const };
}
