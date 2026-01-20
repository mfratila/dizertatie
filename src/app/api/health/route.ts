import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    let dbStatus: 'ok' | 'down' = 'ok';

    try {
        //Query trivial, fara side-effects
        await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
        dbStatus = 'down';
        console.log(error);
    }

    return NextResponse.json({
        status: 'ok',
        db: dbStatus
    });
}