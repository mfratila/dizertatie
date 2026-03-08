import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export type AuthzResult = { ok: true; session: Session } | { ok: false; response: NextResponse };

export async function requireSession(): Promise<AuthzResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid session.' },
        { status: 401 },
      ),
    };
  }

  return { ok: true, session };
}

export function requireRole(session: Session, allowedRoles: Role[]): AuthzResult {
  const role = session.user.role;

  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Insufficient permissions.',
          required: allowedRoles,
          current: role,
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session };
}

export async function canViewProject(session: Session, projectId: number): Promise<boolean> {
  if (session.user.role === 'ADMIN') {
    return true;
  }

  const userId = typeof session.user.id === 'string' ? Number(session.user.id) : session.user.id;

  if (!userId || Number.isNaN(userId)) {
    return false;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: { userId: true },
  });

  return Boolean(membership);
}
