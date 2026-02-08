import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireSession, requireRole } from '@/lib/authz';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const authz = requireRole(auth.session, [Role.PM]);
  if (!authz.ok) return authz.response;

  return NextResponse.json({
    ok: true,
    message: 'You are PM.',
  });
}
