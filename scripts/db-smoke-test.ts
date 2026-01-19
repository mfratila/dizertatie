import { Client } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Add it to your .env file.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const res = await client.query(
    'SELECT NOW() as now, current_database() as db, current_user as user;',
  );
  console.log('DB OK:', res.rows[0]);

  await client.end();
}

main().catch((error) => {
  console.error('DB FAIL:', error);
  process.exit(1);
});
