'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { isValidDate } from '../../../_utils/utils';

export async function createTimesheetAction(projectId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM, Role.MEMBER]);

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return {
      ok: false as const,
      message: 'ID-ul utilizatorului din sesiune este invalid.',
    };
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
      message: 'Nu se pot introduce timesheet-uri într-un proiect arhivat.',
    };
  }

  if (session.user.role !== Role.ADMIN) {
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

    if (!membership) {
      return {
        ok: false as const,
        message: 'Nu ai acces la acest proiect.',
      };
    }

    if (
      membership.roleInProject !== Role.PM &&
      membership.roleInProject !== Role.MEMBER
    ) {
      return {
        ok: false as const,
        message: 'Nu ai permisiunea de a introduce ore în acest proiect.',
      };
    }
  }

  const workItemIdRaw = String(formData.get('workItemId') ?? '').trim();
  const dateRaw = String(formData.get('date') ?? '').trim();
  const hoursRaw = String(formData.get('hours') ?? '').trim();
  const noteRaw = String(formData.get('note') ?? '').trim();

  const workItemId = Number(workItemIdRaw);
  const hours = Number(hoursRaw);

  if (!Number.isInteger(workItemId) || workItemId <= 0) {
    return {
      ok: false as const,
      message: 'Task-ul selectat este invalid.',
    };
  }

  const date = new Date(dateRaw);
  if (!dateRaw || !isValidDate(date)) {
    return {
      ok: false as const,
      message: 'Data introdusă este invalidă.',
    };
  }

  if (!Number.isFinite(hours)) {
    return {
      ok: false as const,
      message: 'Numărul de ore este invalid.',
    };
  }

  if (hours <= 0) {
    return {
      ok: false as const,
      message: 'Numărul de ore trebuie să fie mai mare decât 0.',
    };
  }

  if (hours > 24) {
    return {
      ok: false as const,
      message: 'Nu poți introduce mai mult de 24 de ore pentru o singură zi.',
    };
  }

  if (noteRaw.length > 500) {
    return {
      ok: false as const,
      message: 'Nota nu poate depăși 500 de caractere.',
    };
  }

  const workItem = await prisma.workItem.findUnique({
    where: { id: workItemId },
    select: {
      id: true,
      projectId: true,
      archivedAt: true,
    },
  });

  if (!workItem) {
    return {
      ok: false as const,
      message: 'Activitatea selectată nu a fost găsită.',
    };
  }

  if (workItem.projectId !== projectId) {
    return {
      ok: false as const,
      message: 'Nu poți introduce ore pe un task din alt proiect.',
    };
  }

  if (workItem.archivedAt) {
    return {
      ok: false as const,
      message: 'Nu poți introduce ore pe o activitate arhivată.',
    };
  }

  await prisma.timesheet.create({
    data: {
      userId: actorUserId,
      workItemId,
      date,
      hours: new Prisma.Decimal(hours),
      note: noteRaw || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/execution`);

  return { ok: true as const };
}