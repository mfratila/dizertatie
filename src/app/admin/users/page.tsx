import { Role } from '@prisma/client';
import { requireAuth } from '@/lib/page-guards';

export default async function AdminUsersPage() {
  const session = await requireAuth([Role.ADMIN]);

  return (
    <main style={{ padding: 16 }}>
      <h1>Admin - Users</h1>
      <p>Logged in as: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>(MVP placeholder pentru management utilizatori)</p>
    </main>
  );
}
