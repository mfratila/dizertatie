import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/page-guards';

export default async function DashboardPage() {
  await requireAuth();
  redirect('/dashboard/portfolio');
}