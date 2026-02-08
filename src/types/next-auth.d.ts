import 'next-auth';
import 'next-auth/jwt';
import type { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      name?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: Role;
    name?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: Role;
    name?: string | null;
  }
}
