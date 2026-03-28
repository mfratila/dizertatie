import Link from 'next/link';
import { requireAuth } from '@/lib/page-guards';
import { getPortfolioDashboardData } from '@/lib/dashboard/portofolio';

type RagStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NA';

function formatKpiValue(value: number | null) {
  if (value === null) return 'N/A';
  return value.toFixed(2);
}

function getRagBadgeStyle(status: RagStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  };

  switch (status) {
    case 'GREEN':
      return { ...base, background: 'rgba(34, 197, 94, 0.14)', color: '#22c55e' };
    case 'YELLOW':
      return { ...base, background: 'rgba(234, 179, 8, 0.14)', color: '#eab308' };
    case 'RED':
      return { ...base, background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444' };
    case 'NA':
    default:
      return { ...base, background: 'rgba(148, 163, 184, 0.14)', color: '#94a3b8' };
  }
}

function RagBadge({ status }: { status: RagStatus }) {
  return (
    <span style={getRagBadgeStyle(status)}>
      <span aria-hidden="true">●</span>
      <span>{status}</span>
    </span>
  );
}

function KpiCell({
  label,
  item,
}: {
  label: 'CPI' | 'SPI' | 'BURN_RATE';
  item: { value: number | null; status: RagStatus } | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>{label}</span>
      <strong>{item ? formatKpiValue(item.value) : 'N/A'}</strong>
      <RagBadge status={item?.status ?? 'NA'} />
    </div>
  );
}

export default async function PortfolioDashboardPage() {
  const session = await requireAuth();

  const data = await getPortfolioDashboardData({
    userId: Number(session.user.id),
    role: session.user.role,
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Portfolio Dashboard</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Vedere de ansamblu a proiectelor pentru identificarea rapidă a proiectelor problematice.
        </p>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Project name</th>
              <th style={{ textAlign: 'left' }}>Project status</th>
              <th style={{ textAlign: 'left' }}>CPI</th>
              <th style={{ textAlign: 'left' }}>SPI</th>
              <th style={{ textAlign: 'left' }}>Burn Rate</th>
              <th style={{ textAlign: 'left' }}>Overall status</th>
              <th style={{ textAlign: 'left' }}>Open</th>
            </tr>
          </thead>

          <tbody>
            {data.items.map((project) => (
              <tr key={project.projectId}>
                <td>
                  <Link href={`/projects/${project.projectId}/dashboard`}>{project.name}</Link>
                </td>
                <td>{project.status}</td>
                <td>
                  <KpiCell label="CPI" item={project.latestKpis.CPI} />
                </td>
                <td>
                  <KpiCell label="SPI" item={project.latestKpis.SPI} />
                </td>
                <td>
                  <KpiCell label="BURN_RATE" item={project.latestKpis.BURN_RATE} />
                </td>
                <td>
                  <RagBadge status={project.overallHealth} />
                </td>
                <td>
                  <Link href={`/projects/${project.projectId}/dashboard`}>View</Link>
                </td>
              </tr>
            ))}

            {data.items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: '#666' }}>
                  Nu există proiecte disponibile pentru acest utilizator.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}