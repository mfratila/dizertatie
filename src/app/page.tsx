import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

const features = [
  {
    title: 'Monitorizare managerială',
    description:
      'Centralizează proiectele, activitățile, costurile, baseline-ul și riscurile într-un flux coerent de urmărire.',
  },
  {
    title: 'Indicatori KPI calculați server-side',
    description:
      'Transformă datele operaționale în CPI, SPI și Burn Rate, cu interpretare RAG pentru decizie rapidă.',
  },
  {
    title: 'Istoric și auditabilitate',
    description:
      'Persistă snapshot-uri KPI pentru urmărirea evoluției performanței și justificarea deciziilor manageriale.',
  },
];

const kpis = [
  {
    label: 'CPI',
    title: 'Cost Performance Index',
    description: 'Evaluează eficiența costurilor prin raportarea valorii câștigate la costul real.',
  },
  {
    label: 'SPI',
    title: 'Schedule Performance Index',
    description: 'Indică abaterea față de planificare prin comparația dintre valoarea câștigată și valoarea planificată.',
  },
  {
    label: 'Burn Rate',
    title: 'Ritm de consum bugetar',
    description: 'Arată viteza medie cu care proiectul consumă resursele financiare disponibile.',
  },
];

const roles = [
  'ADMIN: administrare și control complet',
  'PM: proiecte, baseline, KPI și recalculare',
  'MEMBER: introducere și urmărire execuție',
  'VIEWER: acces read-only la dashboard-uri',
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const userLabel = session?.user?.name ?? session?.user?.email ?? 'utilizator autentificat';

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 34%), var(--background)',
      }}
    >
      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '64px 20px 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
          alignItems: 'center',
        }}
      >
        <div>
          <p
            style={{
              display: 'inline-flex',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '6px 12px',
              margin: 0,
              opacity: 0.86,
              background: 'var(--surface)',
            }}
          >
            {isAuthenticated
              ? `Sesiune activă pentru ${userLabel}`
              : 'MVP pentru monitorizarea performanței proiectelor'}
          </p>

          <h1
            style={{
              margin: '20px 0 16px',
              fontSize: 'clamp(38px, 7vw, 72px)',
              lineHeight: 0.98,
              letterSpacing: '-0.06em',
            }}
          >
            Sistem informatic de gestiune pentru proiecte bazat pe KPI.
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.7, opacity: 0.82, maxWidth: 720 }}>
            Aplicația transformă datele despre progres, costuri, baseline și riscuri în informație
            managerială utilizabilă, prin dashboard-uri, indicatori CPI/SPI/Burn Rate și istoric de
            snapshot-uri KPI.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              style={{
                color: '#020617',
                background: '#e5e7eb',
                padding: '12px 18px',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 800,
              }}
            >
              {isAuthenticated ? 'Continuă către dashboard' : 'Autentifică-te'}
            </Link>
            <Link
              href={isAuthenticated ? '/dashboard/portfolio' : '/api/health'}
              style={{
                color: 'inherit',
                border: '1px solid var(--border)',
                padding: '12px 18px',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 700,
                background: 'var(--surface)',
              }}
            >
              {isAuthenticated ? 'Vezi portofoliul' : 'Verifică starea aplicației'}
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <p style={{ margin: 0, opacity: 0.72 }}>Exemplu de interpretare rapidă</p>
          <h2 style={{ margin: '10px 0 20px' }}>Project Alpha</h2>

          <div style={{ display: 'grid', gap: 12 }}>
            <Metric label="CPI" value="0.95" status="YELLOW" />
            <Metric label="SPI" value="1.03" status="GREEN" />
            <Metric label="Burn Rate" value="1250/zi" status="NA" />
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 12,
              border: '1px solid rgba(234, 179, 8, 0.35)',
              background: 'rgba(234, 179, 8, 0.10)',
            }}
          >
            <strong>Status managerial: monitorizare atentă</strong>
            <p style={{ margin: '8px 0 0', lineHeight: 1.55, opacity: 0.84 }}>
              Proiectul avansează bine în raport cu planul, dar costurile necesită control.
            </p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px' }}>
        <SectionTitle
          eyebrow="Funcționalități principale"
          title="De la date operaționale la suport decizional"
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {features.map((feature) => (
            <article key={feature.title} className="card">
              <h3 style={{ marginTop: 0 }}>{feature.title}</h3>
              <p style={{ lineHeight: 1.65, opacity: 0.78 }}>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 20px' }}>
        <SectionTitle eyebrow="KPI MVP" title="Indicatorii folosiți în analiza performanței" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {kpis.map((kpi) => (
            <article key={kpi.label} className="card">
              <span
                style={{
                  display: 'inline-flex',
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(59, 130, 246, 0.16)',
                  color: '#60a5fa',
                  fontWeight: 800,
                }}
              >
                {kpi.label}
              </span>
              <h3>{kpi.title}</h3>
              <p style={{ lineHeight: 1.65, opacity: 0.78 }}>{kpi.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '40px 20px 72px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <article className="card">
          <h2 style={{ marginTop: 0 }}>Flux operațional</h2>
          <ol style={{ lineHeight: 1.9, paddingLeft: 20, opacity: 0.84 }}>
            <li>Crearea proiectului și alocarea membrilor.</li>
            <li>Definirea activităților, baseline-ului și costurilor.</li>
            <li>Calculul KPI și persistarea snapshot-urilor.</li>
            <li>Analiza rezultatelor în dashboard-uri manageriale.</li>
          </ol>
        </article>

        <article className="card">
          <h2 style={{ marginTop: 0 }}>Control acces RBAC</h2>
          <ul style={{ lineHeight: 1.9, paddingLeft: 20, opacity: 0.84 }}>
            {roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ margin: 0, opacity: 0.66, fontWeight: 700, textTransform: 'uppercase' }}>{eyebrow}</p>
      <h2 style={{ margin: '8px 0 0', fontSize: 'clamp(26px, 4vw, 40px)' }}>{title}</h2>
    </div>
  );
}

function Metric({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.04)',
      }}
    >
      <div>
        <p style={{ margin: 0, opacity: 0.66 }}>{label}</p>
        <strong style={{ fontSize: 24 }}>{value}</strong>
      </div>
      <span
        style={{
          padding: '5px 10px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {status}
      </span>
    </div>
  );
}
