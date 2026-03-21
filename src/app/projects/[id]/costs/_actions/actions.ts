'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { isValidDate } from '../../../_utils/utils';

export async function createCostEntryAction(projectId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return {
      ok: false as const,
      message: 'ID-ul utilizatorului din sesiune este invalid.',
    };
  }

  if (session.user.role === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: actorUserId,
        },
      },
      select: {
        roleInProject: true,
      },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return {
        ok: false as const,
        message: 'Doar PM-ul proiectului sau Admin-ul poate introduce costuri.',
      };
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      archivedAt: true,
    },
  });

  if (!project) {
    return {
      ok: false as const,
      message: 'Proiectul nu a fost găsit.',
    };
  }

  if (project.archivedAt) {
    return {
      ok: false as const,
      message: 'Nu se pot introduce costuri într-un proiect arhivat.',
    };
  }

  const dateRaw = String(formData.get('date') ?? '').trim();
  const amountRaw = String(formData.get('amount') ?? '').trim();
  const categoryRaw = String(formData.get('category') ?? '').trim();
  const noteRaw = String(formData.get('note') ?? '').trim();

  const date = new Date(dateRaw);
  const amount = Number(amountRaw);

  if (!dateRaw || !isValidDate(date)) {
    return {
      ok: false as const,
      message: 'Data introdusă este invalidă.',
    };
  }

  if (!Number.isFinite(amount)) {
    return {
      ok: false as const,
      message: 'Valoarea costului este invalidă.',
    };
  }

  if (amount <= 0) {
    return {
      ok: false as const,
      message: 'Valoarea costului trebuie să fie mai mare decât 0.',
    };
  }

  if (categoryRaw && !['Labor', 'Tools', 'Other'].includes(categoryRaw)) {
    return {
      ok: false as const,
      message: 'Categoria selectată este invalidă.',
    };
  }

  if (noteRaw.length > 500) {
    return {
      ok: false as const,
      message: 'Nota nu poate depăși 500 de caractere.',
    };
  }

  await prisma.costEntry.create({
    data: {
      projectId,
      date,
      amount: new Prisma.Decimal(amount),
      category: categoryRaw || null,
      note: noteRaw || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/costs`);

  return { ok: true as const };
}