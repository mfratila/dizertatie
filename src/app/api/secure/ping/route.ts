import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/authz';

export async function GET() {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    return NextResponse.json({
        ok: true,
        message: "You are authenticated.",
        user: {
            id: auth.session.user.id,
            email: auth.session.user.email,
            role: auth.session.user.role,
        },
    });
}