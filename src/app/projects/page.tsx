import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/page-guards';
import { Role } from '@prisma/client';
import CreateProjectInline from './_components/CreateProjectInline';
import { ProjectExports } from './_components/ProjectExports';
import { formatDate, formatMoney } from './_utils/utils';
import Link from 'next/link';

function getStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'ACTIVE':
      return {
        background: '#DCFCE7',
        color: '#166534',
        border: '1px solid #86EFAC',
      };
    case 'PLANNED':
      return {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #FCD34D',
      };
    case 'COMPLETED':
      return {
        background: '#DBEAFE',
        color: '#1D4ED8',
        border: '1px solid #93C5FD',
      };
    default:
      return {
        background: '#E5E7EB',
        color: '#374151',
        border: '1px solid #D1D5DB',
      };
  }
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
    role === Role.ADMIN
      ? await prisma.project.findMany({
          where: { archivedAt: null },
          orderBy: { createdAt: 'desc' },
          select,
        })
      : await prisma.project.findMany({
          where: {
            archivedAt: null,
            members: { some: { userId } },
          },
          orderBy: { createdAt: 'desc' },
          select,
        });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            Projects
          </h1>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: '#CBD5E1',
              fontSize: 15,
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            Vizualizează proiectele disponibile și exportă date relevante în format CSV pentru demo,
            validare și anexele lucrării.
          </p>
        </div>

        {canCreate && (
          <div style={{ flexShrink: 0 }}>
            <CreateProjectInline />
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #E5E7EB',
            color: '#4B5563',
          }}
        >
          Nu există proiecte disponibile pentru acest utilizator.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {projects.map((p) => (
            <section
              key={p.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            >
              <div
                style={{
                  padding: '20px 22px 18px 22px',
                  borderBottom: '1px solid #EEF2F7',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <Link
                    href={`/projects/${p.id}`}
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#111827',
                      textDecoration: 'none',
                    }}
                  >
                    {p.name}
                  </Link>

                  <span
                    style={{
                      ...getStatusStyle(String(p.status)),
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  >
                    {String(p.status)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: 22,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Interval
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    {formatDate(p.startDate)} - {formatDate(p.endDate)}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Buget (BAC)
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    {formatMoney(p.plannedBudget)}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E5E7EB',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Acțiune rapidă
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#2563EB',
                      textDecoration: 'none',
                    }}
                  >
                    Deschide proiectul →
                  </Link>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid #EEF2F7',
                  background: '#F8FAFC',
                  padding: '18px 22px 22px 22px',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Exporturi
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: '#475569',
                    marginBottom: 14,
                  }}
                >
                  Descarcă datele proiectului în format CSV.
                </div>

                <ProjectExports projectId={p.id} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}