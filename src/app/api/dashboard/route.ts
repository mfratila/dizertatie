import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Role } from '@prisma/client';

import { authOptions } from '@/lib/authOptions';
import { getPortfolioDashboardData } from '@/lib/dashboard/portofolio';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const role = session.user.role as Role | undefined;

  if (!Number.isInteger(userId) || !role) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const result = await getPortfolioDashboardData({ userId, role });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET /api/dashboard/portfolio failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}