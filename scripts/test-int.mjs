import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // strip optional quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const envTestPath = path.resolve(process.cwd(), '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error('Missing .env.test at project root.');
  process.exit(1);
}

loadEnvFile(envTestPath);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing in .env.test');
  process.exit(1);
}

// ✅ Safety check: prevent accidentally running against dev DB
if (!process.env.DATABASE_URL.includes('kpi_tracker_test')) {
  console.error('Refusing to run: DATABASE_URL does not appear to point to the test DB.');
  console.error('DATABASE_URL=', process.env.DATABASE_URL);
  process.exit(1);
}

console.log('Using test DB:', process.env.DATABASE_URL);

execSync('npx prisma migrate deploy', { stdio: 'inherit' });
execSync('npx vitest run --no-threads', { stdio: 'inherit' });
