'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import { isValidDate } from '../utils';

export async function updateProjectAction(projectId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) return { ok: false as const, message: 'Invalid session user id.' };

  // RBAC: PM doar daca e PM in proiect
  if (session.user.role === Role.PM) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { roleInProject: true },
    });
    if (!member || String(member.roleInProject) !== Role.PM) {
      return { ok: false as const, message: 'Forbidden. Not a PM in this project.' };
    }
  }

  const current = await prisma.project.findUnique({
    where: { id: projectId },
    select: { startDate: true, endDate: true },
  });
  if (!current) return { ok: false as const, message: 'Project not founnd.' };

  const name = String(formData.get('name') ?? '').trim();
  const startDateStr = String(formData.get('startDate') ?? '');
  const endDateStr = String(formData.get('endDate') ?? '');
  const plannedBudget = Number(formData.get('plannedBudget') ?? 0);
  const status = String(formData.get('status') ?? '').trim();

  if (!name) return { ok: false as const, message: 'Name is required.' };
  if (!Number.isFinite(plannedBudget) || plannedBudget < 0)
    return { ok: false as const, message: 'plannedBudget must be >= 0.' };
  if (!status) return { ok: false as const, message: 'Status is required.' };

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  if (!isValidDate(startDate) || !isValidDate(endDate))
    return { ok: false as const, message: 'Invalid dates.' };
  if (endDate.getTime() < startDate.getTime())
    return { ok: false as const, message: 'endDate must be >= startDate.' };

  await prisma.project.update({
    where: { id: projectId },
    data: { name, startDate, endDate, plannedBudget, status: status as any },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects`);
  return { ok: true as const };
}
