import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/authOptions';
import { LogoutButton } from '@/components/LogoutButton';

export async function AppHeader() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const userLabel = session?.user?.name ?? session?.user?.email ?? 'utilizator';

  const protectedLinkStyle: React.CSSProperties = {
    color: 'inherit',
    opacity: isAuthenticated ? 0.86 : 0.48,
    textDecoration: 'none',
    pointerEvents: isAuthenticated ? 'auto' : 'none',
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(11, 18, 32, 0.86)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 900 }}>
          KPI Tracker
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={protectedLinkStyle} aria-disabled={!isAuthenticated}>
            Dashboard
          </Link>
          <Link href="/projects" style={protectedLinkStyle} aria-disabled={!isAuthenticated}>
            Proiecte
          </Link>
          <Link href="/api/health" style={{ color: 'inherit', opacity: 0.78, textDecoration: 'none' }}>
            Health
          </Link>

          {isAuthenticated ? (
            <>
              <span style={{ opacity: 0.72, fontSize: 14 }}>{userLabel}</span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              style={{
                color: '#020617',
                background: '#e5e7eb',
                padding: '8px 12px',
                borderRadius: 999,
                textDecoration: 'none',
                fontWeight: 800,
              }}
            >
              Autentificare
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
