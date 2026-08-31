import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const p = await sql`SELECT count(*) FROM permissions`;
  console.log('Permissions count:', p);
  const u = await sql`SELECT count(*) FROM user_permission_overrides`;
  console.log('Overrides count:', u);
  const sample = await sql`SELECT * FROM permissions LIMIT 10`;
  console.log('Sample permissions:', sample);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
