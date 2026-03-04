'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role, ProjectStatus } from '@prisma/client';
import { isValidDate } from './utils';

export async function createProjectAction(formData: FormData) {
  // RBAC: doar Admin/PM pot crea
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return { ok: false as const, message: 'Invalid session user id.' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const startDateStr = String(formData.get('startDate') ?? '');
  const endDateStr = String(formData.get('endDate') ?? '');
  const plannedBudget = Number(formData.get('plannedBudget') ?? 0);

  if (!name) return { ok: false as const, message: 'Name is required.' };
  if (!Number.isFinite(plannedBudget) || plannedBudget < 0) {
    return { ok: false as const, message: 'plannedBudget must be >= 0.' };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return { ok: false as const, message: 'Invalid startDate/endDate.' };
  }
  if (endDate.getTime() < startDate.getTime()) {
    return { ok: false as const, message: 'endDate must be >= startDate.' };
  }

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        startDate,
        endDate,
        plannedBudget,
        status: ProjectStatus.PLANNED, // default "Plannificat"
      },
      select: { id: true },
    });

    // creator devine PM in proiect
    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        roleInProject: Role.PM,
      },
    });
  });

  revalidatePath('/projects');
  return { ok: true as const };
}
