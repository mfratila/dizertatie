'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';

function parseIntStrict(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export async function addProjectMemberAction(projectId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  const actorRole = session.user.role;

  // PM global -> trebuie să fie PM în proiect
  if (actorRole === Role.PM) {
    const actorMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: actorUserId } },
      select: { roleInProject: true },
    });

    if (!actorMembership || actorMembership.roleInProject !== 'PM') {
      return { ok: false as const, message: 'Forbidden.' };
    }
  }

  const userId = parseIntStrict(formData.get('userId'));
  const roleInProject = String(formData.get('roleInProject') ?? '').trim();

  if (!userId) return { ok: false as const, message: 'Invalid userId.' };
  if (!['PM', 'MEMBER', 'VIEWER'].includes(roleInProject))
    return { ok: false as const, message: 'Invalid roleInProject.' };

  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);

  if (!project) return { ok: false as const, message: 'Project not found.' };
  if (!user) return { ok: false as const, message: 'User not found.' };

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { id: true },
  });
  if (existing) return { ok: false as const, message: 'User already in project.' };

  await prisma.projectMember.create({
    data: { projectId, userId, roleInProject: roleInProject as any },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true as const };
}

export async function removeProjectMemberAction(projectId: number, targetUserId: number) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  const actorRole = session.user.role;

  // PM global -> trebuie să fie PM în proiect
  if (actorRole === Role.PM) {
    const actorMembership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: actorUserId } },
      select: { roleInProject: true },
    });

    if (!actorMembership || actorMembership.roleInProject !== 'PM') {
      return { ok: false as const, message: 'Forbidden.' };
    }
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
    select: { roleInProject: true },
  });

  if (!membership) return { ok: false as const, message: 'Member not found.' };

  // Safety rule: cannot remove last PM
  if (membership.roleInProject === 'PM') {
    const pmCount = await prisma.projectMember.count({
      where: { projectId, roleInProject: 'PM' },
    });

    if (pmCount <= 1) {
      return {
        ok: false as const,
        message: 'Cannot remove last PM (MVP safety rule).',
      };
    }
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true as const };
}
