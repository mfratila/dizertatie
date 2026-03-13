'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role, WorkItemStatus } from '@prisma/client';
import { isValidDate } from '../../_utils/utils';

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

export async function createWorkItemAction(projectId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return { ok: false as const, message: 'ID-ul utilizatorului din sesiune este invalid.' };
  }

  if (session.user.role === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: actorUserId,
        },
      },
      select: { roleInProject: true },
    });

    if (!membership || String(membership.roleInProject) !== Role.PM) {
      return {
        ok: false as const,
        message: 'Nu ai permisiunea de a crea activități în acest proiect.',
      };
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      archivedAt: true,
    },
  });

  if (!project) {
    return { ok: false as const, message: 'Proiectul nu a fost găsit.' };
  }

  if (project.archivedAt) {
    return {
      ok: false as const,
      message: 'Nu se pot crea activități într-un proiect arhivat.',
    };
  }

  const title = String(formData.get('title') ?? '').trim();
  const descriptionRaw = String(formData.get('description') ?? '').trim();
  const plannedStartDateStr = String(formData.get('plannedStartDate') ?? '').trim();
  const plannedEndDateStr = String(formData.get('plannedEndDate') ?? '').trim();
  const assignedUserIdRaw = String(formData.get('assignedUserId') ?? '').trim();

  if (!title) {
    return {
      ok: false as const,
      message: 'Titlul activității este obligatoriu.',
    };
  }

  if (!plannedEndDateStr) {
    return {
      ok: false as const,
      message: 'Data finală planificată este obligatorie.',
    };
  }

  const plannedEndDate = new Date(plannedEndDateStr);
  if (!isValidDate(plannedEndDate)) {
    return {
      ok: false as const,
      message: 'Data finală planificată este invalidă.',
    };
  }

  const plannedStartDate = plannedStartDateStr ? new Date(plannedStartDateStr) : null;
  if (plannedStartDateStr && (!plannedStartDate || !isValidDate(plannedStartDate))) {
    return {
      ok: false as const,
      message: 'Data de început planificată este invalidă.',
    };
  }

  if (plannedStartDate && plannedEndDate.getTime() < plannedStartDate.getTime()) {
    return {
      ok: false as const,
      message: 'Data finală planificată nu poate fi mai mică decât data de început.',
    };
  }

  // regulă adoptată în MVP: datele task-ului trebuie să fie în intervalul proiectului
  if (
    plannedEndDate.getTime() < project.startDate.getTime() ||
    plannedEndDate.getTime() > project.endDate.getTime()
  ) {
    return {
      ok: false as const,
      message: 'Data finală planificată trebuie să fie în intervalul proiectului.',
    };
  }

  if (plannedStartDate) {
    if (plannedStartDate.getTime() < project.startDate.getTime()) {
      return {
        ok: false as const,
        message: 'Data de început planificată nu poate fi înainte de începutul proiectului.',
      };
    }

    if (plannedStartDate.getTime() > project.endDate.getTime()) {
      return {
        ok: false as const,
        message: 'Data de început planificată nu poate fi după finalul proiectului.',
      };
    }
  }

  let assignedUserId: number | null = null;

  if (assignedUserIdRaw) {
    assignedUserId = Number(assignedUserIdRaw);

    if (!Number.isInteger(assignedUserId)) {
      return {
        ok: false as const,
        message: 'Responsabilul selectat este invalid.',
      };
    }

    const assignedMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assignedUserId,
        },
      },
      select: { userId: true },
    });

    if (!assignedMembership) {
      return {
        ok: false as const,
        message: 'Responsabilul trebuie să fie membru al proiectului.',
      };
    }
  }

  await prisma.workItem.create({
    data: {
      projectId,
      title,
      description: descriptionRaw || null,
      plannedStartDate,
      plannedEndDate,
      assignedUserId,
      progressPercent: 0,
      status: WorkItemStatus.TODO,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);

  return { ok: true as const };
}

export async function updateWorkItemAction(workItemId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return { ok: false as const, message: 'ID-ul utilizatorului din sesiune este invalid.' };
  }

  const current = await prisma.workItem.findUnique({
    where: { id: workItemId },
    select: {
      id: true,
      projectId: true,
      progressPercent: true,
      project: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          archivedAt: true,
        },
      },
    },
  });

  if (!current) {
    return { ok: false as const, message: 'Activitatea nu a fost găsită.' };
  }

  if (current.project.archivedAt) {
    return {
      ok: false as const,
      message: 'Activitățile dintr-un proiect arhivat nu mai pot fi modificate.',
    };
  }

  if (session.user.role === Role.PM) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: actorUserId,
        },
      },
      select: { roleInProject: true },
    });

    if (!membership || String(membership.roleInProject) !== Role.PM) {
      return {
        ok: false as const,
        message: 'Nu ai permisiunea de a modifica această activitate.',
      };
    }
  }

  const title = String(formData.get('title') ?? '').trim();
  const plannedEndDateStr = String(formData.get('plannedEndDate') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  const assignedUserIdRaw = String(formData.get('assignedUserId') ?? '').trim();

  if (!title) {
    return { ok: false as const, message: 'Titlul activității este obligatoriu.' };
  }

  if (!plannedEndDateStr) {
    return {
      ok: false as const,
      message: 'Data finală planificată este obligatorie.',
    };
  }

  const plannedEndDate = new Date(plannedEndDateStr);
  if (!isValidDate(plannedEndDate)) {
    return {
      ok: false as const,
      message: 'Data finală planificată este invalidă.',
    };
  }

  if (
    plannedEndDate.getTime() < current.project.startDate.getTime() ||
    plannedEndDate.getTime() > current.project.endDate.getTime()
  ) {
    return {
      ok: false as const,
      message: 'Data finală planificată trebuie să fie în intervalul proiectului.',
    };
  }

  if (!Object.values(WorkItemStatus).includes(status as WorkItemStatus)) {
    return { ok: false as const, message: 'Status invalid.' };
  }

  if (status === WorkItemStatus.TODO && current.progressPercent !== 0) {
    return {
      ok: false as const,
      message: 'O activitate cu starea „De făcut” trebuie să aibă progres 0%.',
    };
  }

  if (status === WorkItemStatus.DONE && current.progressPercent !== 100) {
    return {
      ok: false as const,
      message: 'O activitate cu starea „Finalizat” trebuie să aibă progres 100%.',
    };
  }

  if (
    status === WorkItemStatus.IN_PROGRESS &&
    (current.progressPercent <= 0 || current.progressPercent >= 100)
  ) {
    return {
      ok: false as const,
      message: 'O activitate „În progres” trebuie să aibă progres între 1% și 99%.',
    };
  }

  let assignedUserId: number | null = null;

  if (assignedUserIdRaw) {
    assignedUserId = Number(assignedUserIdRaw);

    if (!Number.isInteger(assignedUserId)) {
      return {
        ok: false as const,
        message: 'Responsabilul selectat este invalid.',
      };
    }

    const assignedMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: assignedUserId,
        },
      },
      select: { userId: true },
    });

    if (!assignedMembership) {
      return {
        ok: false as const,
        message: 'Responsabilul trebuie să fie membru al proiectului.',
      };
    }
  }

  await prisma.workItem.update({
    where: { id: workItemId },
    data: {
      title,
      plannedEndDate,
      assignedUserId,
      status: status as WorkItemStatus,
    },
  });

  revalidatePath(`/projects/${current.projectId}`);
  revalidatePath(`/projects/${current.projectId}/tasks`);

  return { ok: true as const };
}

export async function updateWorkItemProgressAction(workItemId: number, formData: FormData) {
  const session = await requireAuth();

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return {
      ok: false as const,
      message: 'ID-ul utilizatorului din sesiune este invalid.',
    };
  }

  const current = await prisma.workItem.findUnique({
    where: { id: workItemId },
    select: {
      id: true,
      projectId: true,
      assignedUserId: true,
      project: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!current) {
    return { ok: false as const, message: 'Activitatea nu a fost găsită.' };
  }

  if (current.project.archivedAt) {
    return {
      ok: false as const,
      message: 'Activitățile dintr-un proiect arhivat nu mai pot fi modificate.',
    };
  }

  const isAdmin = session.user.role === Role.ADMIN;
  let isProjectPm = false;
  let isAssignedMember = false;

  if (!isAdmin) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: actorUserId,
        },
      },
      select: { roleInProject: true },
    });

    if (membership?.roleInProject === Role.PM) {
      isProjectPm = true;
    }

    if (
      membership?.roleInProject === Role.MEMBER &&
      current.assignedUserId === actorUserId
    ) {
      isAssignedMember = true;
    }
  }

  if (!isAdmin && !isProjectPm && !isAssignedMember) {
    return {
      ok: false as const,
      message: 'Nu ai permisiunea de a actualiza progresul acestei activități.',
    };
  }

  const progressRaw = String(formData.get('progressPercent') ?? '').trim();
  const progressPercent = Number(progressRaw);

  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    return {
      ok: false as const,
      message: 'Progresul trebuie să fie un număr întreg între 0 și 100.',
    };
  }

  let status: WorkItemStatus;

  if (progressPercent === 0) {
    status = WorkItemStatus.TODO;
  } else if (progressPercent === 100) {
    status = WorkItemStatus.DONE;
  } else {
    status = WorkItemStatus.IN_PROGRESS;
  }

  await prisma.workItem.update({
    where: { id: workItemId },
    data: {
      progressPercent,
      status,
    },
  });

  revalidatePath(`/projects/${current.projectId}`);
  revalidatePath(`/projects/${current.projectId}/tasks`);

  return { ok: true as const };
}
