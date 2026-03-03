import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import CreateProjectInline from './CreateProjectInline';

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('ro-RO').format(d);
}

function formatMoney(v: any) {
  // Prisma Decimal -> string/number in functie de config; tratam robust
  const n = typeof v === 'number' ? v : Number(v?.toString?.() ?? v);
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(n);
}

export default async function ProjectsPage() {
  const session = await requireAuth();

  const userId = Number(session.user.id);
  const role = session.user.role;

  const canCreate = role === Role.ADMIN || role === Role.PM;

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
            members: { some: { userId } },
          },
          orderBy: { createdAt: 'desc' },
          select,
        });

  return (
    <div style={{ padding: 24 }}>
      <h1>Projects</h1>

      {/* dor Admin/PM vede create */}
      {canCreate && <CreateProjectInline />}

      <table
        className="card"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: 12,
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Nume</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Status
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Interval
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Buget (BAC)
            </th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td style={{ padding: 8 }}>{p.name}</td>
              <td style={{ padding: 8 }}>{String(p.status)}</td>
              <td style={{ padding: 8 }}>
                {formatDate(p.startDate)} - {formatDate(p.endDate)}
              </td>
              <td style={{ padding: 8, textAlign: 'right' }}>{formatMoney(p.plannedBudget)}</td>
            </tr>
          ))}

          {projects.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 12, color: '#666' }}>
                Nu există proiecte disponibile pentru acest utilizator.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
