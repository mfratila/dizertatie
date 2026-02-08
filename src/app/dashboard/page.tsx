import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <main style={{ padding: 16 }}>
      <h1>Dashboard (Protected)</h1>
      <p>Email: {session.user.email}</p>
      <p>Name: {session.user.name ?? '-'}</p>
      <p>Role: {session.user.role}</p>
      <p>UserId: {session.user.id}</p>
    </main>
  );
}
