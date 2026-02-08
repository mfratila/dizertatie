import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';

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
