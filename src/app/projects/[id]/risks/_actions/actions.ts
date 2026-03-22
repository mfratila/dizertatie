'use server';

import { revalidatePath } from 'next/cache';
import { RiskStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';

function validateProbabilityImpact(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function createRiskAction(projectId: number, formData: FormData) {
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
      select: {
        roleInProject: true,
      },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return {
        ok: false as const,
        message: 'Doar PM-ul proiectului sau Admin-ul poate crea riscuri.',
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
    return { ok: false as const, message: 'Proiectul nu a fost găsit.' };
  }

  if (project.archivedAt) {
    return {
      ok: false as const,
      message: 'Nu se pot introduce riscuri într-un proiect arhivat.',
    };
  }

  const title = String(formData.get('title') ?? '').trim();
  const probability = Number(formData.get('probability') ?? '');
  const impact = Number(formData.get('impact') ?? '');
  const ownerUserIdRaw = String(formData.get('ownerUserId') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();

  if (!title) {
    return { ok: false as const, message: 'Titlul riscului este obligatoriu.' };
  }

  if (!validateProbabilityImpact(probability)) {
    return { ok: false as const, message: 'Probabilitatea trebuie să fie între 1 și 5.' };
  }

  if (!validateProbabilityImpact(impact)) {
    return { ok: false as const, message: 'Impactul trebuie să fie între 1 și 5.' };
  }

  let ownerUserId: number | null = null;

  if (ownerUserIdRaw) {
    ownerUserId = Number(ownerUserIdRaw);

    if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
      return { ok: false as const, message: 'Owner-ul selectat este invalid.' };
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: ownerUserId,
        },
      },
      select: { userId: true },
    });

    if (!membership) {
      return {
        ok: false as const,
        message: 'Owner-ul selectat trebuie să fie membru al proiectului.',
      };
    }
  }

  if (note.length > 1000) {
    return { ok: false as const, message: 'Nota nu poate depăși 1000 de caractere.' };
  }

  await prisma.risk.create({
    data: {
      projectId,
      title,
      probability,
      impact,
      status: RiskStatus.OPEN,
      ownerUserId,
      note: note || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/risks`);

  return { ok: true as const };
}

export async function updateRiskAction(riskId: number, formData: FormData) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return { ok: false as const, message: 'ID-ul utilizatorului din sesiune este invalid.' };
  }

  const current = await prisma.risk.findUnique({
    where: { id: riskId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!current) {
    return { ok: false as const, message: 'Riscul nu a fost găsit.' };
  }

  if (current.project.archivedAt) {
    return {
      ok: false as const,
      message: 'Nu poți modifica riscuri dintr-un proiect arhivat.',
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
      select: {
        roleInProject: true,
      },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return {
        ok: false as const,
        message: 'Nu ai permisiunea de a modifica acest risc.',
      };
    }
  }

  const title = String(formData.get('title') ?? '').trim();
  const probability = Number(formData.get('probability') ?? '');
  const impact = Number(formData.get('impact') ?? '');
  const statusRaw = String(formData.get('status') ?? '').trim();
  const ownerUserIdRaw = String(formData.get('ownerUserId') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();

  if (!title) {
    return { ok: false as const, message: 'Titlul riscului este obligatoriu.' };
  }

  if (!validateProbabilityImpact(probability)) {
    return { ok: false as const, message: 'Probabilitatea trebuie să fie între 1 și 5.' };
  }

  if (!validateProbabilityImpact(impact)) {
    return { ok: false as const, message: 'Impactul trebuie să fie între 1 și 5.' };
  }

  if (!Object.values(RiskStatus).includes(statusRaw as RiskStatus)) {
    return { ok: false as const, message: 'Status invalid.' };
  }

  let ownerUserId: number | null = null;

  if (ownerUserIdRaw) {
    ownerUserId = Number(ownerUserIdRaw);

    if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
      return { ok: false as const, message: 'Owner-ul selectat este invalid.' };
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: current.projectId,
          userId: ownerUserId,
        },
      },
      select: { userId: true },
    });

    if (!membership) {
      return {
        ok: false as const,
        message: 'Owner-ul selectat trebuie să fie membru al proiectului.',
      };
    }
  }

  if (note.length > 1000) {
    return { ok: false as const, message: 'Nota nu poate depăși 1000 de caractere.' };
  }

  await prisma.risk.update({
    where: { id: riskId },
    data: {
      title,
      probability,
      impact,
      status: statusRaw as RiskStatus,
      ownerUserId,
      note: note || null,
    },
  });

  revalidatePath(`/projects/${current.projectId}`);
  revalidatePath(`/projects/${current.projectId}/risks`);

  return { ok: true as const };
}

export async function closeRiskAction(riskId: number) {
  const session = await requireAuth([Role.ADMIN, Role.PM]);

  const actorUserId = Number(session.user.id);
  if (!Number.isInteger(actorUserId)) {
    return { ok: false as const, message: 'ID-ul utilizatorului din sesiune este invalid.' };
  }

  const current = await prisma.risk.findUnique({
    where: { id: riskId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          archivedAt: true,
        },
      },
    },
  });

  if (!current) {
    return { ok: false as const, message: 'Riscul nu a fost găsit.' };
  }

  if (current.project.archivedAt) {
    return {
      ok: false as const,
      message: 'Nu poți închide riscuri dintr-un proiect arhivat.',
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
      select: {
        roleInProject: true,
      },
    });

    if (!membership || membership.roleInProject !== Role.PM) {
      return {
        ok: false as const,
        message: 'Nu ai permisiunea de a închide acest risc.',
      };
    }
  }

  await prisma.risk.update({
    where: { id: riskId },
    data: {
      status: RiskStatus.CLOSED,
    },
  });

  revalidatePath(`/projects/${current.projectId}`);
  revalidatePath(`/projects/${current.projectId}/risks`);

  return { ok: true as const };
}