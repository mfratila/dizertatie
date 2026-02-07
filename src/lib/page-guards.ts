import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { authOptions } from '@/lib/authOptions';

export async function requireAuth(allowedRoles?: Role[]) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const role = session.user.role;
        if (!allowedRoles.includes(role)) {
            redirect('/access-denied');
        }
    }

    return session;
}