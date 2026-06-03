'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      style={{
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'inherit',
        padding: '8px 12px',
        borderRadius: 999,
        cursor: 'pointer',
        font: 'inherit',
        fontWeight: 700,
      }}
    >
      Deconectare
    </button>
  );
}
