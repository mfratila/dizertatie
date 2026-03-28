import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/page-guards';
import KpiLineChart from './_components/KpiLineChart';
import RecalculateKpiButton from './_components/RecalculateKpiButton';
import { Role } from '@prisma/client';
import { getProjectDashboardData } from '@/lib/project-dashboard/project-dashboard';

type RagStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NA';

function formatKpiValue(value: string | null) {
  if (value === null) return 'N/A';

  const num = Number(value);
  if (!Number.isFinite(num)) return value;

  return num.toFixed(2);
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
      return {
        ...base,
        background: 'rgba(34, 197, 94, 0.14)',
        color: '#22c55e',
      };
    case 'YELLOW':
      return {
        ...base,
        background: 'rgba(234, 179, 8, 0.14)',
        color: '#eab308',
      };
    case 'RED':
      return {
        ...base,
        background: 'rgba(239, 68, 68, 0.14)',
        color: '#ef4444',
      };
    case 'NA':
    default:
      return {
        ...base,
        background: 'rgba(148, 163, 184, 0.14)',
        color: '#94a3b8',
      };
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

function KpiCard({
  title,
  value,
  status,
  unit,
  naMessage,
}: {
  title: string;
  value: string | null;
  status: RagStatus;
  unit?: string;
  naMessage?: string;
}) {
  const isNa = value === null || status === 'NA';

  return (
    <div
      className="card"
      style={{
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            opacity: 0.8,
            marginBottom: 12,
          }}
        >
          {title}
        </div>

        {!isNa ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
              {formatKpiValue(value)}
            </div>
            {unit ? (
              <span style={{ fontSize: 14, opacity: 0.75, fontWeight: 600 }}>{unit}</span>
            ) : null}
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>N/A</div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <RagBadge status={status} />
        </div>
      </div>

      <div style={{ fontSize: 14, opacity: 0.8 }}>
        {isNa ? naMessage ?? 'Date insuficiente pentru calculul KPI.' : 'Ultimul snapshot disponibil.'}
      </div>
    </div>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDashboardPage({ params }: PageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    notFound();
  }

  let dashboard;
  try {
    dashboard = await getProjectDashboardData(projectId, {
      userId: Number(session.user.id),
      role: session.user.role,
    });
  } catch (error) {
    notFound();
  }

  const canRecalculate = session.user.role === Role.ADMIN || session.user.role === Role.PM;

  const cpi = dashboard.latest.CPI;
  const spi = dashboard.latest.SPI;
  const burnRate = dashboard.latest.BURN_RATE;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <Link href="/dashboard/portfolio">← Înapoi la Portfolio Dashboard</Link>
        </div>

        <h1 style={{ margin: 0 }}>Project Dashboard</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Project ID: {dashboard.projectId}
          <br />
          Last computed at: {dashboard.lastComputedAt ?? 'N/A'}
        </p>
      </div>

      {canRecalculate ? <RecalculateKpiButton projectId={dashboard.projectId} /> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        <KpiCard
          title="CPI"
          value={cpi?.value ?? null}
          status={cpi?.status ?? 'NA'}
          naMessage="Nu există date suficiente pentru Cost Performance Index."
        />

        <KpiCard
          title="SPI"
          value={spi?.value ?? null}
          status={spi?.status ?? 'NA'}
          naMessage="Nu există date suficiente pentru Schedule Performance Index."
        />

        <KpiCard
          title="Burn Rate"
          value={burnRate?.value ?? null}
          status={burnRate?.status ?? 'NA'}
          unit="currency/day"
          naMessage="Nu există date suficiente pentru Burn Rate."
        />
      </div>
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 16 }}>KPI Trends</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 16,
          }}
        >
          <KpiLineChart title="CPI în timp" points={dashboard.history.CPI} />
          <KpiLineChart title="SPI în timp" points={dashboard.history.SPI} />
          <KpiLineChart
            title="Burn Rate în timp"
            points={dashboard.history.BURN_RATE}
            unitLabel="currency/day"
          />
        </div>
      </div>
    </div>
  );
}