import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sumActualCost } from '../engine/ac';

export class InvalidProjectDataError extends Error { }

export async function computeAC(projectId: number, asOfDate: Date): Promise<number> {
    if (!Number.isInteger(projectId) || projectId <= 0) {
        throw new InvalidProjectDataError('projectId must be a positive integer.');
    }
    if (!(asOfDate instanceof Date) || Number.isNaN(asOfDate.getTime())) {
        throw new InvalidProjectDataError('asOfDate must be a valid Date.');
    }

    const entries = await prisma.costEntry.findMany({
        where: {
            projectId,
            date: { lte: asOfDate }, // inclusiv
        },
        select: { amount: true },
        orderBy: { date: 'asc' }, // optional: audit-friendly
    });

    if (entries.length === 0) return 0;

    const amounts = entries.map(entry => entry.amount instanceof Prisma.Decimal ? entry.amount.toNumber() : Number(entry.amount));

    // sum + validation in engine
    return sumActualCost(amounts);
}