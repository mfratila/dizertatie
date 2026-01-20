This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Code quality

- Lint: `npm run lint` (Next.js ESLint)
- Format: `npm run format` (Prettier)

Recommended before pushing:

- `npm run lint`
- `npm run format`

## Database (PostgreSQL via Docker)

1. Copy env template:

- Create `.env` from `.env.example`

2. Start DB:

```bash
docker compose up -d
```

## Demo Seed Data (Development Only)

For demo and testing purposes, the database is seeded with:

Admin user:

- Email: admin@demo.local
- Password: admin123
- Role: ADMIN

Demo project:

- Name: Project Alpha

⚠️ Note: These credentials are for development/demo only.
Authentication is not implemented in the MVP and will be addressed in later iterations.
