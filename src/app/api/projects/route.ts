import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/authz';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { session } = auth;

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: 'Invalid session user id' }, { status: 500 });
  }

  const role = session.user.role; // ADMIN | PM | MEMBER | VIEWER

  const select = {
    id: true,
    name: true,
    status: true,
    startDate: true,
    endDate: true,
    plannedBudget: true,
  };

  const projects =
    role === 'ADMIN'
      ? await prisma.project.findMany({
          orderBy: { createdAt: 'desc' },
          select,
        })
      : await prisma.project.findMany({
          where: {
            members: {
              some: { userId },
            },
          },
          select,
        });

  return NextResponse.json({ data: projects });
}
