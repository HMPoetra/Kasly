import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import * as schema from './schema';

/**
 * Seed script for KASLY development database.
 * Run: npx tsx src/lib/db/seed.ts
 */
async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log('🌱 Starting seed...\n');

  // ---------- 1. Roles ----------
  const roleIds = {
    classLeader: uuid(),
    viceClassLeader: uuid(),
    treasurer1: uuid(),
    treasurer2: uuid(),
    secretary1: uuid(),
    secretary2: uuid(),
    logistics1: uuid(),
    logistics2: uuid(),
    disciplinary: uuid(),
    creative1: uuid(),
    creative2: uuid(),
    creative3: uuid(),
    classMember: uuid(),
  };

  const rolesData = [
    { id: roleIds.classLeader, name: 'Class Leader', code: 'CLASS_LEADER', description: 'Full access to all class resources', isDefault: false, sortOrder: 1 },
    { id: roleIds.viceClassLeader, name: 'Vice Class Leader', code: 'VICE_CLASS_LEADER', description: 'Operational and monitoring access', isDefault: false, sortOrder: 2 },
    { id: roleIds.treasurer1, name: '1st Treasurer', code: 'TREASURER_1', description: 'Primary financial management', isDefault: false, sortOrder: 3 },
    { id: roleIds.treasurer2, name: '2nd Treasurer', code: 'TREASURER_2', description: 'Backup financial management', isDefault: false, sortOrder: 4 },
    { id: roleIds.secretary1, name: '1st Secretary', code: 'SECRETARY_1', description: 'Primary documentation', isDefault: false, sortOrder: 5 },
    { id: roleIds.secretary2, name: '2nd Secretary', code: 'SECRETARY_2', description: 'Backup documentation', isDefault: false, sortOrder: 6 },
    { id: roleIds.logistics1, name: '1st Logistics', code: 'LOGISTICS_1', description: 'Primary logistics management', isDefault: false, sortOrder: 7 },
    { id: roleIds.logistics2, name: '2nd Logistics', code: 'LOGISTICS_2', description: 'Backup logistics management', isDefault: false, sortOrder: 8 },
    { id: roleIds.disciplinary, name: 'Disciplinary', code: 'DISCIPLINARY', description: 'Member discipline monitoring', isDefault: false, sortOrder: 9 },
    { id: roleIds.creative1, name: '1st Team Creative', code: 'CREATIVE_1', description: 'Primary visual content', isDefault: false, sortOrder: 10 },
    { id: roleIds.creative2, name: '2nd Team Creative', code: 'CREATIVE_2', description: 'Secondary visual content', isDefault: false, sortOrder: 11 },
    { id: roleIds.creative3, name: '3rd Team Creative', code: 'CREATIVE_3', description: 'Tertiary visual content', isDefault: false, sortOrder: 12 },
    { id: roleIds.classMember, name: 'Class Member', code: 'CLASS_MEMBER', description: 'Default read-only access', isDefault: true, sortOrder: 13 },
  ];

  await db.insert(schema.roles).values(rolesData);
  console.log('✅ Roles seeded');

  // ---------- 2. Users ----------
  const passwordHash = await bcrypt.hash('kasly123', 10);
  const pinHash = await bcrypt.hash('1234', 10);

  const userIds = {
    poro: uuid(),
    siti: uuid(),
    ahmad: uuid(),
    budi: uuid(),
    citra: uuid(),
    dina: uuid(),
    eko: uuid(),
    fitri: uuid(),
    galih: uuid(),
    hana: uuid(),
    irfan: uuid(),
    jannah: uuid(),
    krisna: uuid(),
  };

  const usersData = [
    { id: userIds.poro, name: 'Poro Horizon', email: 'poro@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.siti, name: 'Siti Nurhaliza', email: 'siti@d3ti2a.edu', passwordHash, gender: 'FEMALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.ahmad, name: 'Ahmad Rizky', email: 'ahmad@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.budi, name: 'Budi Santoso', email: 'budi@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.citra, name: 'Citra Dewi', email: 'citra@d3ti2a.edu', passwordHash, gender: 'FEMALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.dina, name: 'Dina Permata', email: 'dina@d3ti2a.edu', passwordHash, gender: 'FEMALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.eko, name: 'Eko Prasetyo', email: 'eko@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.fitri, name: 'Fitri Amalia', email: 'fitri@d3ti2a.edu', passwordHash, gender: 'FEMALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.galih, name: 'Galih Wicaksono', email: 'galih@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.hana, name: 'Hana Safira', email: 'hana@d3ti2a.edu', passwordHash, gender: 'FEMALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.irfan, name: 'Irfan Maulana', email: 'irfan@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.jannah, name: 'Jannah Putri', email: 'jannah@d3ti2a.edu', passwordHash, gender: 'FEMALE' as const, pinHash, status: 'ACTIVE' as const },
    { id: userIds.krisna, name: 'Krisna Bayu', email: 'krisna@d3ti2a.edu', passwordHash, gender: 'MALE' as const, pinHash, status: 'ACTIVE' as const },
  ];

  await db.insert(schema.users).values(usersData);
  console.log('✅ Users seeded');

  // ---------- 3. Class ----------
  const classId = uuid();
  await db.insert(schema.classes).values({
    id: classId,
    name: 'D3TI 2A',
    description: 'Diploma 3 Teknik Informatika — Kelas 2A',
    academicYear: '2025/2026',
    status: 'ACTIVE',
  });
  console.log('✅ Class seeded');

  // ---------- 4. Class Members ----------
  const userRoleMap: [string, string][] = [
    [userIds.poro, roleIds.classLeader],
    [userIds.siti, roleIds.viceClassLeader],
    [userIds.ahmad, roleIds.treasurer1],
    [userIds.budi, roleIds.treasurer2],
    [userIds.citra, roleIds.secretary1],
    [userIds.dina, roleIds.secretary2],
    [userIds.eko, roleIds.logistics1],
    [userIds.fitri, roleIds.logistics2],
    [userIds.galih, roleIds.disciplinary],
    [userIds.hana, roleIds.creative1],
    [userIds.irfan, roleIds.creative2],
    [userIds.jannah, roleIds.creative3],
    [userIds.krisna, roleIds.classMember],
  ];

  await db.insert(schema.classMembers).values(
    userRoleMap.map(([userId, roleId]) => ({
      id: uuid(),
      classId,
      userId,
      roleId,
      status: 'ACTIVE' as const,
    }))
  );
  console.log('✅ Class members seeded');

  // ---------- 5. Payment Methods ----------
  const pmIds = { cash: uuid(), spay: uuid(), seabank: uuid() };
  await db.insert(schema.paymentMethods).values([
    { id: pmIds.cash, classId, name: 'Cash', code: 'CASH', icon: 'fa-money-bill', sortOrder: 1 },
    { id: pmIds.spay, classId, name: 'SPay', code: 'SPAY', icon: 'fa-mobile', sortOrder: 2 },
    { id: pmIds.seabank, classId, name: 'SeaBank', code: 'SEABANK', icon: 'fa-building-columns', sortOrder: 3 },
  ]);
  console.log('✅ Payment methods seeded');

  // ---------- 6. Cashflow Categories ----------
  const catIds = {
    iuran: uuid(), donasi: uuid(), denda: uuid(), eventInc: uuid(), refund: uuid(), otherInc: uuid(),
    pembelian: uuid(), konsumsi: uuid(), acara: uuid(), peralatan: uuid(), transportasi: uuid(), dokumentasi: uuid(), dekorasi: uuid(), otherExp: uuid(),
  };
  await db.insert(schema.cashflowCategories).values([
    { id: catIds.iuran, name: 'Iuran Kelas', type: 'INCOME', icon: 'fa-hand-holding-dollar', sortOrder: 1 },
    { id: catIds.donasi, name: 'Donasi', type: 'INCOME', icon: 'fa-gift', sortOrder: 2 },
    { id: catIds.denda, name: 'Denda', type: 'INCOME', icon: 'fa-gavel', sortOrder: 3 },
    { id: catIds.eventInc, name: 'Event', type: 'INCOME', icon: 'fa-calendar', sortOrder: 4 },
    { id: catIds.refund, name: 'Refund', type: 'INCOME', icon: 'fa-rotate-left', sortOrder: 5 },
    { id: catIds.otherInc, name: 'Other Income', type: 'INCOME', icon: 'fa-ellipsis', sortOrder: 6 },
    { id: catIds.pembelian, name: 'Pembelian', type: 'EXPENSE', icon: 'fa-cart-shopping', sortOrder: 1 },
    { id: catIds.konsumsi, name: 'Konsumsi', type: 'EXPENSE', icon: 'fa-utensils', sortOrder: 2 },
    { id: catIds.acara, name: 'Acara', type: 'EXPENSE', icon: 'fa-calendar-day', sortOrder: 3 },
    { id: catIds.peralatan, name: 'Peralatan', type: 'EXPENSE', icon: 'fa-wrench', sortOrder: 4 },
    { id: catIds.transportasi, name: 'Transportasi', type: 'EXPENSE', icon: 'fa-car', sortOrder: 5 },
    { id: catIds.dokumentasi, name: 'Dokumentasi', type: 'EXPENSE', icon: 'fa-camera', sortOrder: 6 },
    { id: catIds.dekorasi, name: 'Dekorasi', type: 'EXPENSE', icon: 'fa-star', sortOrder: 7 },
    { id: catIds.otherExp, name: 'Lainnya', type: 'EXPENSE', icon: 'fa-ellipsis', sortOrder: 8 },
  ]);
  console.log('✅ Cashflow categories seeded');

  // ---------- 7. Sample Transactions ----------
  await db.insert(schema.cashflowTransactions).values([
    { id: uuid(), classId, type: 'INCOME', categoryId: catIds.iuran, amount: '500000', description: 'Iuran bulan Agustus minggu 1', transactionDate: '2026-08-05', createdBy: userIds.ahmad, paymentMethodId: pmIds.cash, status: 'COMPLETED' },
    { id: uuid(), classId, type: 'INCOME', categoryId: catIds.donasi, amount: '200000', description: 'Donasi dari alumni', transactionDate: '2026-08-10', createdBy: userIds.ahmad, paymentMethodId: pmIds.seabank, status: 'COMPLETED' },
    { id: uuid(), classId, type: 'INCOME', categoryId: catIds.iuran, amount: '750000', description: 'Iuran bulan Agustus minggu 2', transactionDate: '2026-08-12', createdBy: userIds.ahmad, paymentMethodId: pmIds.spay, status: 'COMPLETED' },
    { id: uuid(), classId, type: 'EXPENSE', categoryId: catIds.pembelian, amount: '125000', description: 'Printing banner kelas', transactionDate: '2026-08-15', createdBy: userIds.budi, paymentMethodId: pmIds.cash, status: 'COMPLETED' },
    { id: uuid(), classId, type: 'EXPENSE', categoryId: catIds.konsumsi, amount: '75000', description: 'Snack rapat kelas', transactionDate: '2026-08-18', createdBy: userIds.dina, paymentMethodId: pmIds.cash, status: 'COMPLETED' },
    { id: uuid(), classId, type: 'INCOME', categoryId: catIds.denda, amount: '50000', description: 'Denda keterlambatan', transactionDate: '2026-08-20', createdBy: userIds.ahmad, paymentMethodId: pmIds.spay, status: 'COMPLETED' },
  ]);
  console.log('✅ Transactions seeded');

  // ---------- 8. Savings Targets ----------
  const targetIds = { jersey: uuid(), graduation: uuid(), secret: uuid() };
  await db.insert(schema.savingsTargets).values([
    { id: targetIds.jersey, classId, name: 'Class Jersey', description: 'Jersey kelas D3TI 2A', targetAmount: '5000000', currentAmount: '3200000', startDate: '2026-07-01', targetDate: '2026-09-15', status: 'ACTIVE', visibility: 'PUBLIC', createdBy: userIds.poro },
    { id: targetIds.graduation, classId, name: 'Graduation Project', description: 'Persiapan wisuda dan dokumentasi', targetAmount: '3000000', currentAmount: '690000', startDate: '2026-08-01', targetDate: '2026-12-01', status: 'ACTIVE', visibility: 'ROLE_BASED', createdBy: userIds.poro },
    { id: targetIds.secret, classId, name: 'Secret Gift for Wali Kelas', description: 'Hadiah rahasia untuk wali kelas', targetAmount: '750000', currentAmount: '300000', startDate: '2026-09-01', targetDate: '2026-11-01', status: 'PLANNED', visibility: 'PRIVATE', createdBy: userIds.poro },
  ]);

  // Visibility rules for restricted targets
  await db.insert(schema.targetVisibilityRules).values([
    { id: uuid(), targetId: targetIds.graduation, type: 'ROLE', roleId: roleIds.classLeader },
    { id: uuid(), targetId: targetIds.graduation, type: 'ROLE', roleId: roleIds.treasurer1 },
    { id: uuid(), targetId: targetIds.graduation, type: 'ROLE', roleId: roleIds.treasurer2 },
  ]);
  console.log('✅ Savings targets seeded');

  // ---------- 9. Permissions ----------
  const permMap: Record<string, string[]> = {
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

  const permissionRecords: { id: string; resource: string; action: string; description: string }[] = [];
  const permIdMap: Record<string, string> = {};

  for (const [resource, actions] of Object.entries(permMap)) {
    for (const action of actions) {
      const id = uuid();
      const key = `${resource}.${action}`;
      permIdMap[key] = id;
      permissionRecords.push({
        id,
        resource,
        action,
        description: `Can ${action} ${resource}`,
      });
    }
  }

  await db.insert(schema.permissions).values(permissionRecords);
  console.log('✅ Permissions seeded');

  // Assign all permissions to Class Leader
  const classLeaderPermissions = Object.values(permIdMap).map((permId) => ({
    id: uuid(),
    roleId: roleIds.classLeader,
    permissionId: permId,
    grantedBy: userIds.poro,
  }));
  await db.insert(schema.rolePermissions).values(classLeaderPermissions);

  // Assign read permissions to Class Member
  const memberReadPerms = Object.entries(permIdMap)
    .filter(([key]) => key.endsWith('.read') && !key.startsWith('audit') && !key.startsWith('settings'))
    .map(([, permId]) => ({
      id: uuid(),
      roleId: roleIds.classMember,
      permissionId: permId,
      grantedBy: userIds.poro,
    }));
  // Also give evidence.create to members (they can upload their own proofs)
  if (permIdMap['evidence.create']) {
    memberReadPerms.push({
      id: uuid(),
      roleId: roleIds.classMember,
      permissionId: permIdMap['evidence.create'],
      grantedBy: userIds.poro,
    });
  }
  await db.insert(schema.rolePermissions).values(memberReadPerms);

  // Assign treasurer permissions
  const treasurerPerms = [
    'users.read', 'cashflow.create', 'cashflow.read', 'cashflow.update', 'cashflow.delete',
    'contribution.create', 'contribution.read', 'contribution.update', 'contribution.delete',
    'target.create', 'target.read', 'target.update', 'target.delete',
    'purchase.create', 'purchase.read', 'purchase.update',
    'evidence.create', 'evidence.read', 'evidence.update',
    'reports.read', 'reports.export', 'audit.read',
  ];
  const t1Perms = treasurerPerms
    .filter((key) => permIdMap[key])
    .map((key) => ({
      id: uuid(),
      roleId: roleIds.treasurer1,
      permissionId: permIdMap[key],
      grantedBy: userIds.poro,
    }));
  await db.insert(schema.rolePermissions).values(t1Perms);
  console.log('✅ Role permissions seeded');

  // ---------- 10. Audit Logs ----------
  await db.insert(schema.auditLogs).values([
    { id: uuid(), userId: userIds.ahmad, action: 'CREATE', entity: 'cashflow_transactions', newData: { detail: 'Created income: Iuran bulan Agustus minggu 1 - Rp500.000' } },
    { id: uuid(), userId: userIds.budi, action: 'CREATE', entity: 'cashflow_transactions', newData: { detail: 'Created expense: Printing banner kelas - Rp125.000' } },
    { id: uuid(), userId: userIds.poro, action: 'CREATE', entity: 'savings_targets', newData: { detail: 'Created target: Class Jersey - Rp5.000.000' } },
  ]);
  console.log('✅ Audit logs seeded');

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: poro@d3ti2a.edu (Class Leader)');
  console.log('   Email: ahmad@d3ti2a.edu (1st Treasurer)');
  console.log('   Email: krisna@d3ti2a.edu (Class Member)');
  console.log('   Password: kasly123');
  console.log('   PIN: 1234');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
