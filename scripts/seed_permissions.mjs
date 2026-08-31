import { neon } from '@neondatabase/serverless';
import { v4 as uuid } from 'uuid';

const sql = neon(process.env.DATABASE_URL);

const permMap = {
  users: ['create', 'read', 'update', 'delete'],
  roles: ['create', 'read', 'update', 'delete'],
  cashflow: ['create', 'read', 'update', 'delete'],
  contribution: ['create', 'read', 'update', 'delete'],
  target: ['create', 'read', 'update', 'delete'],
  purchase: ['create', 'read', 'update', 'delete'],
  evidence: ['create', 'read', 'update', 'delete'],
  reports: ['read', 'export'],
  audit: ['read'],
  settings: ['read', 'update'],
};

async function seedPermissions() {
  console.log('Seeding permissions table...');
  const existing = await sql`SELECT count(*) FROM permissions`;
  console.log('Existing permissions:', existing[0].count);

  if (Number(existing[0].count) === 0) {
    for (const [resource, actions] of Object.entries(permMap)) {
      for (const action of actions) {
        const id = uuid();
        await sql`
          INSERT INTO permissions (id, resource, action, description, created_at)
          VALUES (${id}, ${resource}, ${action}, ${`Can ${action} ${resource}`}, NOW())
          ON CONFLICT DO NOTHING
        `;
      }
    }
    console.log('✅ Successfully seeded permissions table!');
  } else {
    console.log('Permissions table already has entries.');
  }

  const all = await sql`SELECT resource, action, id FROM permissions`;
  console.log(`Total permissions in DB now: ${all.length}`);
}

seedPermissions()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
