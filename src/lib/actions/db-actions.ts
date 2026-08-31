'use server';

import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  roles,
  classes,
  classMembers,
  paymentMethods,
  cashflowCategories,
  cashflowTransactions,
  contributions,
  contributionPayments,
  savingsTargets,
  targetVisibilityRules,
  targetContributors,
  purchases,
  evidence,
  auditLogs,
  notifications,
  rolePermissions,
  permissions,
  userPermissionOverrides,
} from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth/auth';
import { getUserPermissions } from '@/lib/permissions/check';

// ==========================================
// 1. MEMBERS & USERS (WITH ROLES & PERMISSIONS)
// ==========================================
export async function getMembersAction() {
  try {
    const data = await db
      .select({
        id: classMembers.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        gender: users.gender,
        status: classMembers.status,
        roleId: roles.id,
        roleName: roles.name,
        roleCode: roles.code,
        sortOrder: roles.sortOrder,
      })
      .from(classMembers)
      .innerJoin(users, eq(classMembers.userId, users.id))
      .innerJoin(roles, eq(classMembers.roleId, roles.id))
      .where(isNull(users.deletedAt))
      .orderBy(roles.sortOrder, users.name);

    // Get payment sums per user
    const payments = await db
      .select({
        userId: contributionPayments.userId,
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${contributionPayments.status} = 'PAID' THEN ${contributionPayments.amount} ELSE 0 END), 0)`,
      })
      .from(contributionPayments)
      .groupBy(contributionPayments.userId);

    const paymentMap = new Map(payments.map((p) => [p.userId, Number(p.totalPaid)]));

    // Get role permissions
    const rolePermsRows = await db
      .select({
        roleId: rolePermissions.roleId,
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    const rolePermMap = new Map<string, string[]>();
    for (const rp of rolePermsRows) {
      const existing = rolePermMap.get(rp.roleId) || [];
      existing.push(`${rp.resource}.${rp.action}`);
      rolePermMap.set(rp.roleId, existing);
    }

    // Get user specific permission overrides
    const overridesRows = await db
      .select({
        userId: userPermissionOverrides.userId,
        resource: permissions.resource,
        action: permissions.action,
        granted: userPermissionOverrides.granted,
      })
      .from(userPermissionOverrides)
      .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id));

    const userOverridesMap = new Map<string, { granted: Set<string>; revoked: Set<string> }>();
    for (const row of overridesRows) {
      if (!userOverridesMap.has(row.userId)) {
        userOverridesMap.set(row.userId, { granted: new Set(), revoked: new Set() });
      }
      const u = userOverridesMap.get(row.userId)!;
      const key = `${row.resource}.${row.action}`;
      if (row.granted) {
        u.granted.add(key);
      } else {
        u.revoked.add(key);
      }
    }

    const defaultRolePerms: Record<string, string[]> = {
      CLASS_LEADER: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'roles.create', 'roles.read', 'roles.update', 'roles.delete',
        'cashflow.create', 'cashflow.read', 'cashflow.update', 'cashflow.delete',
        'contribution.create', 'contribution.read', 'contribution.update', 'contribution.delete',
        'target.create', 'target.read', 'target.update', 'target.delete',
        'purchase.create', 'purchase.read', 'purchase.update', 'purchase.delete',
        'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete',
        'reports.read', 'reports.export', 'audit.read', 'settings.read', 'settings.update'
      ],
      VICE_CLASS_LEADER: [
        'users.read', 'users.update', 'roles.read',
        'cashflow.create', 'cashflow.read', 'cashflow.update',
        'contribution.create', 'contribution.read', 'contribution.update',
        'target.create', 'target.read', 'target.update',
        'purchase.create', 'purchase.read', 'purchase.update',
        'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete',
        'reports.read', 'reports.export', 'audit.read', 'settings.read',
      ],
      TREASURER_1: [
        'cashflow.create', 'cashflow.read', 'cashflow.update', 'cashflow.delete',
        'contribution.create', 'contribution.read', 'contribution.update', 'contribution.delete',
        'target.create', 'target.read', 'target.update', 'target.delete',
        'purchase.create', 'purchase.read', 'purchase.update',
        'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete',
        'reports.read', 'reports.export', 'audit.read'
      ],
      TREASURER_2: [
        'cashflow.create', 'cashflow.read', 'cashflow.update',
        'contribution.create', 'contribution.read', 'contribution.update',
        'target.read', 'target.update', 'purchase.read',
        'reports.read', 'reports.export', 'evidence.read'
      ],
      SECRETARY_1: ['users.read', 'cashflow.read', 'contribution.read', 'reports.read', 'reports.export', 'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete', 'audit.read'],
      SECRETARY_2: ['users.read', 'cashflow.read', 'contribution.read', 'reports.read', 'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete'],
      LOGISTICS_1: ['purchase.create', 'purchase.read', 'purchase.update', 'evidence.read'],
      LOGISTICS_2: ['purchase.read', 'purchase.update', 'evidence.read'],
      DISCIPLINARY: ['users.read', 'contribution.read', 'reports.read', 'evidence.read'],
      CREATIVE_1: ['evidence.read', 'target.read'],
      CREATIVE_2: ['evidence.read', 'target.read'],
      CREATIVE_3: ['evidence.read', 'target.read'],
      CLASS_MEMBER: ['cashflow.read', 'contribution.read', 'target.read', 'reports.read', 'evidence.read'],
    };

    const resourceLabels: Record<string, string> = {
      users: 'Pengguna',
      roles: 'Hak Akses',
      cashflow: 'Kas & Keuangan',
      contribution: 'Iuran',
      target: 'Tabungan',
      purchase: 'Pengadaan',
      evidence: 'Bukti Nota',
      reports: 'Laporan',
      audit: 'Audit Log',
      settings: 'Pengaturan',
    };

    return data.map((m) => {
      const totalPaid = paymentMap.get(m.userId) || 0;
      const outstanding = Math.max(0, 100000 - totalPaid);

      const permSet = new Set<string>(rolePermMap.get(m.roleId) || []);
      if (permSet.size === 0 && defaultRolePerms[m.roleCode]) {
        for (const p of defaultRolePerms[m.roleCode]) {
          permSet.add(p);
        }
      } else if (permSet.size === 0) {
        for (const p of defaultRolePerms.CLASS_MEMBER) {
          permSet.add(p);
        }
      }

      // Merge user-specific overrides
      const overrides = userOverridesMap.get(m.userId);
      if (overrides) {
        for (const p of overrides.granted) {
          permSet.add(p);
        }
        for (const p of overrides.revoked) {
          permSet.delete(p);
        }
      }

      const finalPerms = Array.from(permSet);

      // Generate distinct resource badges
      const distinctResources = Array.from(new Set(finalPerms.map((p) => p.split('.')[0])));
      const permissionSummary = distinctResources.map((res) => resourceLabels[res] || res);

      return {
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        gender: m.gender === 'MALE' ? 'M' : 'F',
        roleId: m.roleId,
        role: m.roleName,
        roleCode: m.roleCode,
        permissions: finalPerms,
        permissionSummary,
        permsCount: finalPerms.length,
        status: m.status,
        totalPaid,
        outstanding,
      };
    });
  } catch (error) {
    console.error('Error in getMembersAction:', error);
    return [];
  }
}

export async function updateMemberRoleAndPermissionsAction(formData: {
  userId: string;
  roleId: string;
  customPermissions?: string[];
}) {
  try {
    await db
      .update(classMembers)
      .set({ roleId: formData.roleId })
      .where(eq(classMembers.userId, formData.userId));

    // Persist custom permissions to user_permission_overrides if provided
    if (formData.customPermissions) {
      let allDbPerms = await db.select().from(permissions);
      
      // Auto-ensure permissions table is populated
      if (allDbPerms.length === 0) {
        const { PERMISSION_MAP } = await import('@/lib/permissions/constants');
        const permRecords: { resource: string; action: string; description: string }[] = [];
        for (const [resource, actions] of Object.entries(PERMISSION_MAP)) {
          for (const action of actions) {
            permRecords.push({
              resource,
              action,
              description: `Can ${action} ${resource}`,
            });
          }
        }
        if (permRecords.length > 0) {
          await db.insert(permissions).values(permRecords);
          allDbPerms = await db.select().from(permissions);
        }
      }

      // Clear previous overrides for this user
      await db
        .delete(userPermissionOverrides)
        .where(eq(userPermissionOverrides.userId, formData.userId));

      // Insert new overrides based on checked/unchecked permissions
      const customPermsSet = new Set(formData.customPermissions);
      const overridesToInsert = allDbPerms.map((p) => ({
        userId: formData.userId,
        permissionId: p.id,
        granted: customPermsSet.has(`${p.resource}.${p.action}`),
      }));

      if (overridesToInsert.length > 0) {
        await db.insert(userPermissionOverrides).values(overridesToInsert);
      }
    }

    const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, formData.userId)).limit(1);
    const [r] = await db.select({ name: roles.name }).from(roles).where(eq(roles.id, formData.roleId)).limit(1);

    await db.insert(auditLogs).values({
      userId: formData.userId,
      action: 'UPDATE',
      entity: 'MemberRole',
      newData: {
        detail: `Ubah peran anggota ${u?.name || 'User'} menjadi ${r?.name || 'Role'} dan perbarui hak akses modul`,
      },
    });

    revalidatePath('/members');
    revalidatePath('/roles');
    revalidatePath('/permissions');
    revalidatePath('/dashboard');
    revalidatePath('/finance');
    revalidatePath('/contributions');
    revalidatePath('/savings');
    revalidatePath('/purchases');
    revalidatePath('/evidence');
    revalidatePath('/settings');
    revalidatePath('/audit');

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateMemberRoleAndPermissionsAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getCurrentUserPermissionsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        isAuthenticated: false,
        userName: 'Bendahara',
        userEmail: 'user@hoarizon.app',
        roleCode: 'CLASS_MEMBER',
        permissions: [] as string[],
      };
    }

    const [membership] = await db
      .select({
        roleId: classMembers.roleId,
        roleCode: roles.code,
      })
      .from(classMembers)
      .innerJoin(roles, eq(classMembers.roleId, roles.id))
      .where(and(eq(classMembers.userId, session.user.id), eq(classMembers.status, 'ACTIVE')))
      .limit(1);

    if (!membership) {
      return {
        isAuthenticated: true,
        userName: session.user.name || 'Bendahara',
        userEmail: session.user.email || 'user@hoarizon.app',
        roleCode: 'CLASS_MEMBER',
        permissions: [] as string[],
      };
    }

    const perms = await getUserPermissions(session.user.id, membership.roleId);

    return {
      isAuthenticated: true,
      userName: session.user.name || 'Bendahara',
      userEmail: session.user.email || 'user@hoarizon.app',
      roleCode: membership.roleCode,
      permissions: perms,
    };
  } catch (error) {
    console.error('Error in getCurrentUserPermissionsAction:', error);
    return {
      isAuthenticated: false,
      userName: 'Bendahara',
      userEmail: 'user@hoarizon.app',
      roleCode: 'CLASS_MEMBER',
      permissions: [] as string[],
    };
  }
}

// ==========================================
// 2. DASHBOARD SUMMARY
// ==========================================
export async function getDashboardSummaryAction() {
  try {
    const session = await auth();
    let currentUserId = session?.user?.id;
    let userName = session?.user?.name || 'Treasurer';
    let userRole = 'Pengurus Kas';

    if (!currentUserId) {
      const [firstUser] = await db.select({ id: users.id, name: users.name }).from(users).limit(1);
      currentUserId = firstUser?.id;
      if (firstUser) userName = firstUser.name;
    }

    if (currentUserId) {
      const [member] = await db
        .select({
          name: users.name,
          roleName: roles.name,
        })
        .from(classMembers)
        .innerJoin(users, eq(classMembers.userId, users.id))
        .innerJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      if (member) {
        userName = member.name;
        userRole = member.roleName;
      }
    }

    // Cashflow summary
    const txSummary = await db
      .select({
        type: cashflowTransactions.type,
        total: sql<string>`COALESCE(SUM(${cashflowTransactions.amount}), 0)`,
      })
      .from(cashflowTransactions)
      .where(isNull(cashflowTransactions.deletedAt))
      .groupBy(cashflowTransactions.type);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const item of txSummary) {
      if (item.type === 'INCOME') totalIncome = Number(item.total);
      if (item.type === 'EXPENSE') totalExpense = Number(item.total);
    }

    // Also check contribution payments
    const [contribSum] = await db
      .select({
        totalPaid: sql<string>`COALESCE(SUM(${contributionPayments.amount}), 0)`,
      })
      .from(contributionPayments)
      .where(eq(contributionPayments.status, 'PAID'));

    const totalContributionCollected = Number(contribSum?.totalPaid || 0);
    if (totalIncome === 0 && totalContributionCollected > 0) {
      totalIncome = totalContributionCollected;
    }

    const totalBalance = totalIncome - totalExpense;

    // Savings target summary
    const targets = await db
      .select({
        targetAmount: sql<string>`COALESCE(SUM(${savingsTargets.targetAmount}), 0)`,
        currentAmount: sql<string>`COALESCE(SUM(${savingsTargets.currentAmount}), 0)`,
      })
      .from(savingsTargets)
      .where(isNull(savingsTargets.deletedAt));

    const totalTargetAmount = Number(targets[0]?.targetAmount || 0);
    const totalTargetAchieved = Number(targets[0]?.currentAmount || 0);

    // Total members count
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(classMembers)
      .where(eq(classMembers.status, 'ACTIVE'));

    const totalMembers = memberCount?.count || 25;

    // Paid members count for current month
    const paidMembers = await db
      .select({
        userId: contributionPayments.userId,
        paid: sql<string>`COALESCE(SUM(${contributionPayments.amount}), 0)`,
      })
      .from(contributionPayments)
      .where(eq(contributionPayments.status, 'PAID'))
      .groupBy(contributionPayments.userId);

    const lunasCount = paidMembers.filter((p) => Number(p.paid) >= 100000).length;

    // Recent Transactions
    const recentTx = await db
      .select({
        id: cashflowTransactions.id,
        type: cashflowTransactions.type,
        category: cashflowCategories.name,
        amount: cashflowTransactions.amount,
        description: cashflowTransactions.description,
        date: cashflowTransactions.transactionDate,
        by: users.name,
        method: paymentMethods.code,
      })
      .from(cashflowTransactions)
      .leftJoin(cashflowCategories, eq(cashflowTransactions.categoryId, cashflowCategories.id))
      .leftJoin(users, eq(cashflowTransactions.createdBy, users.id))
      .leftJoin(paymentMethods, eq(cashflowTransactions.paymentMethodId, paymentMethods.id))
      .where(isNull(cashflowTransactions.deletedAt))
      .orderBy(desc(cashflowTransactions.transactionDate), desc(cashflowTransactions.createdAt))
      .limit(6);

    // Active targets
    const activeTargets = await db
      .select({
        id: savingsTargets.id,
        name: savingsTargets.name,
        targetAmount: savingsTargets.targetAmount,
        currentAmount: savingsTargets.currentAmount,
        targetDate: savingsTargets.targetDate,
      })
      .from(savingsTargets)
      .where(and(eq(savingsTargets.status, 'ACTIVE'), isNull(savingsTargets.deletedAt)))
      .limit(4);

    return {
      userName,
      userRole,
      totalBalance,
      totalIncome,
      totalExpense,
      netCashflow: totalBalance,
      savingsTarget: totalTargetAmount,
      targetAchieved: totalTargetAchieved,
      totalMembers,
      lunasCount,
      totalContributionCollected,
      contributionPercent: Math.min(100, Math.round((lunasCount / Math.max(1, totalMembers)) * 100)),
      recentTransactions: recentTx.map((t) => ({
        id: t.id,
        type: t.type,
        category: t.category || 'Kas',
        description: t.description || '',
        amount: Number(t.amount),
        date: t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—',
        by: t.by || 'Pengurus',
        method: t.method || 'CASH',
      })),
      upcomingDeadlines: activeTargets.map((t) => {
        const target = Number(t.targetAmount) || 1;
        const current = Number(t.currentAmount) || 0;
        const progress = Math.min(100, Math.round((current / target) * 100));
        let daysRemaining = 30;
        if (t.targetDate) {
          const diffTime = new Date(t.targetDate).getTime() - new Date().getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
        return {
          id: t.id,
          name: t.name,
          targetAmount: Number(t.targetAmount),
          currentAmount: Number(t.currentAmount),
          daysRemaining,
          progress,
        };
      }),
    };
  } catch (error) {
    console.error('Error in getDashboardSummaryAction:', error);
    return {
      userName: 'Bendahara',
      userRole: 'Pengurus Kas',
      totalBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      netCashflow: 0,
      savingsTarget: 0,
      targetAchieved: 0,
      totalMembers: 25,
      lunasCount: 0,
      totalContributionCollected: 0,
      contributionPercent: 0,
      recentTransactions: [],
      upcomingDeadlines: [],
    };
  }
}

// ==========================================
// 3. CONTRIBUTIONS
// ==========================================
export async function getContributionsAction(month: number = 8, year: number = 2026) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    let currentUserRoleCode = (session?.user as any)?.roleCode;

    if (currentUserId && !currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode || 'CLASS_MEMBER';
    }

    const canVerify = [
      'CLASS_LEADER',
      'VICE_CLASS_LEADER',
      'SECRETARY_1',
      'SECRETARY_2',
    ].includes(currentUserRoleCode || '');

    const memberList = await db
      .select({
        userId: users.id,
        name: users.name,
        gender: users.gender,
      })
      .from(classMembers)
      .innerJoin(users, eq(classMembers.userId, users.id))
      .where(eq(classMembers.status, 'ACTIVE'))
      .orderBy(users.name);

    // Get payments for this month & year with payment method & evidence
    const payments = await db
      .select({
        id: contributionPayments.id,
        userId: contributionPayments.userId,
        weekNumber: contributionPayments.weekNumber,
        amount: contributionPayments.amount,
        status: contributionPayments.status,
        paidAt: contributionPayments.paidAt,
        verifiedAt: contributionPayments.verifiedAt,
        methodName: paymentMethods.name,
        methodCode: paymentMethods.code,
        evidenceId: evidence.id,
        evidenceUrl: evidence.fileUrl,
        evidenceFileName: evidence.fileName,
        evidenceStatus: evidence.status,
      })
      .from(contributionPayments)
      .leftJoin(contributions, eq(contributionPayments.contributionId, contributions.id))
      .leftJoin(paymentMethods, eq(contributionPayments.paymentMethodId, paymentMethods.id))
      .leftJoin(
        evidence,
        and(eq(evidence.entityType, 'CONTRIBUTION'), eq(evidence.entityId, contributionPayments.id))
      )
      .where(and(eq(contributions.month, month), eq(contributions.year, year)));

    const paymentMatrix: Record<
      string,
      Record<
        number,
        {
          paymentId?: string;
          status: string;
          methodCode: string;
          methodName: string;
          amount: number;
          evidenceId?: string;
          evidenceUrl?: string;
          evidenceFileName?: string;
          paidAt?: string;
        }
      >
    > = {};

    const pendingSubmissions: Array<{
      paymentId: string;
      userId: string;
      userName: string;
      weekNumber: number;
      amount: number;
      methodCode: string;
      methodName: string;
      evidenceId?: string;
      evidenceUrl?: string;
      evidenceFileName?: string;
      paidAt?: string;
    }> = [];

    const memberNameMap = new Map(memberList.map((m) => [m.userId, m.name]));

    for (const p of payments) {
      if (!paymentMatrix[p.userId]) paymentMatrix[p.userId] = {};
      const status = p.status;
      const methodCode = p.methodCode || 'CASH';
      const methodName = p.methodName || 'Tunai';

      paymentMatrix[p.userId][p.weekNumber] = {
        paymentId: p.id,
        status,
        methodCode,
        methodName,
        amount: Number(p.amount || 25000),
        evidenceId: p.evidenceId || undefined,
        evidenceUrl: p.evidenceUrl || undefined,
        evidenceFileName: p.evidenceFileName || undefined,
        paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
      };

      if (status === 'PENDING') {
        pendingSubmissions.push({
          paymentId: p.id,
          userId: p.userId,
          userName: memberNameMap.get(p.userId) || 'Siswa',
          weekNumber: p.weekNumber,
          amount: Number(p.amount || 25000),
          methodCode,
          methodName,
          evidenceId: p.evidenceId || undefined,
          evidenceUrl: p.evidenceUrl || undefined,
          evidenceFileName: p.evidenceFileName || undefined,
          paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : undefined,
        });
      }
    }

    const rows = memberList.map((m) => {
      const userPayments = paymentMatrix[m.userId] || {};

      const getWeekDisplay = (wNum: number) => {
        const item = userPayments[wNum];
        if (!item || item.status === 'UNPAID') return 'Belum';
        if (item.status === 'PENDING') return 'PENDING';
        return item.methodCode || 'CASH';
      };

      const w1 = getWeekDisplay(1);
      const w2 = getWeekDisplay(2);
      const w3 = getWeekDisplay(3);
      const w4 = getWeekDisplay(4);

      const weeksPaid = [w1, w2, w3, w4].filter((w) => w !== 'Belum' && w !== 'PENDING').length;
      const total = weeksPaid * 25000;

      return {
        userId: m.userId,
        name: m.name,
        gender: m.gender === 'MALE' ? 'M' : 'F',
        amount: 25000,
        w1,
        w2,
        w3,
        w4,
        total,
        weeksDetail: {
          1: userPayments[1] || { status: 'UNPAID', methodCode: 'CASH', methodName: 'Tunai', amount: 25000 },
          2: userPayments[2] || { status: 'UNPAID', methodCode: 'CASH', methodName: 'Tunai', amount: 25000 },
          3: userPayments[3] || { status: 'UNPAID', methodCode: 'CASH', methodName: 'Tunai', amount: 25000 },
          4: userPayments[4] || { status: 'UNPAID', methodCode: 'CASH', methodName: 'Tunai', amount: 25000 },
        },
      };
    });

    const totalCollected = rows.reduce((sum, r) => sum + r.total, 0);
    const totalExpected = rows.length * 100000;
    const totalPending = Math.max(0, totalExpected - totalCollected);

    return {
      month,
      year,
      totalCollected,
      totalPending,
      unpaidCount: rows.filter((r) => r.total < 100000).length,
      membersCount: rows.length,
      members: rows,
      pendingSubmissions,
      currentUserId: currentUserId || null,
      currentUserRole: currentUserRoleCode || 'CLASS_MEMBER',
      canVerify,
    };
  } catch (error) {
    console.error('Error in getContributionsAction:', error);
    return {
      month,
      year,
      totalCollected: 0,
      totalPending: 0,
      unpaidCount: 0,
      membersCount: 0,
      members: [],
      pendingSubmissions: [],
      currentUserId: null,
      currentUserRole: 'CLASS_MEMBER',
      canVerify: false,
    };
  }
}

// ==========================================
// 4. CASHFLOW TRANSACTIONS
// ==========================================
export async function getCashflowTransactionsAction(typeFilter?: 'INCOME' | 'EXPENSE') {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    let currentUserRoleCode = (session?.user as any)?.roleCode;

    if (currentUserId && !currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    const canManage = TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '');

    const query = db
      .select({
        id: cashflowTransactions.id,
        type: cashflowTransactions.type,
        amount: cashflowTransactions.amount,
        description: cashflowTransactions.description,
        date: cashflowTransactions.transactionDate,
        status: cashflowTransactions.status,
        category: cashflowCategories.name,
        categoryIcon: cashflowCategories.icon,
        by: users.name,
        method: paymentMethods.name,
        methodCode: paymentMethods.code,
        evidenceId: evidence.id,
        evidenceUrl: evidence.fileUrl,
        evidenceFileName: evidence.fileName,
      })
      .from(cashflowTransactions)
      .leftJoin(cashflowCategories, eq(cashflowTransactions.categoryId, cashflowCategories.id))
      .leftJoin(users, eq(cashflowTransactions.createdBy, users.id))
      .leftJoin(paymentMethods, eq(cashflowTransactions.paymentMethodId, paymentMethods.id))
      .leftJoin(
        evidence,
        and(eq(evidence.entityType, 'CASHFLOW'), eq(evidence.entityId, cashflowTransactions.id))
      )
      .where(isNull(cashflowTransactions.deletedAt))
      .orderBy(desc(cashflowTransactions.transactionDate), desc(cashflowTransactions.createdAt));

    const transactions = await query;

    const filtered = typeFilter ? transactions.filter((t) => t.type === typeFilter) : transactions;

    const categories = await db.select().from(cashflowCategories).orderBy(cashflowCategories.sortOrder);
    const methods = await db.select().from(paymentMethods).where(eq(paymentMethods.status, 'ACTIVE'));

    return {
      transactions: filtered.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description || '',
        date: t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        rawDate: t.date,
        status: t.status,
        category: t.category || 'Kas',
        categoryIcon: t.categoryIcon || 'fa-coins',
        by: t.by || 'Bendahara',
        method: t.method || 'Cash',
        methodCode: t.methodCode || 'CASH',
        evidenceId: t.evidenceId || undefined,
        evidenceUrl: t.evidenceUrl || undefined,
        evidenceFileName: t.evidenceFileName || undefined,
        canManage,
      })),
      categories,
      paymentMethods: methods,
      canManage,
      currentUserRole: currentUserRoleCode || 'CLASS_MEMBER',
    };
  } catch (error) {
    console.error('Error in getCashflowTransactionsAction:', error);
    return { transactions: [], categories: [], paymentMethods: [], canManage: false, currentUserRole: 'CLASS_MEMBER' };
  }
}

// ==========================================
// 5. SAVINGS TARGETS
// ==========================================
// Helper to encode/decode split scheme in description
function encodeTargetDescription(desc?: string, splitScheme?: string, fixedAmount?: number) {
  const meta = {
    scheme: splitScheme || 'EQUAL_SPLIT',
    fixed: Number(fixedAmount) || 0,
  };
  return `<!--SCHEME:${JSON.stringify(meta)}-->${desc || ''}`;
}

function decodeTargetDescription(rawDesc?: string | null) {
  if (!rawDesc) return { text: '', splitScheme: 'EQUAL_SPLIT' as const, fixedAmount: 0 };
  const match = rawDesc.match(/<!--SCHEME:(.*?)-->/);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const text = rawDesc.replace(/<!--SCHEME:.*?-->/, '');
      return {
        text,
        splitScheme: (meta.scheme as 'EQUAL_SPLIT' | 'VOLUNTARY' | 'FIXED_AMOUNT') || 'EQUAL_SPLIT',
        fixedAmount: Number(meta.fixed || 0),
      };
    } catch {
      // fallback
    }
  }
  return { text: rawDesc, splitScheme: 'EQUAL_SPLIT' as const, fixedAmount: 0 };
}

const TARGET_ADMIN_ROLES = ['CLASS_LEADER', 'VICE_CLASS_LEADER', 'TREASURER_1', 'SECRETARY_1', 'SECRETARY_2'];

export async function getSavingsTargetsAction() {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    let currentUserRoleCode = (session?.user as any)?.roleCode;

    if (currentUserId && !currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    const canManage = TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '');
    const isClassLeader = currentUserRoleCode === 'CLASS_LEADER';
    const isOfficer = [
      'CLASS_LEADER',
      'VICE_CLASS_LEADER',
      'TREASURER_1',
      'TREASURER_2',
      'SECRETARY_1',
      'SECRETARY_2',
      'LOGISTICS_1',
      'LOGISTICS_2',
    ].includes(currentUserRoleCode || '');

    const [activeMembersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(classMembers)
      .where(eq(classMembers.status, 'ACTIVE'));

    const totalClassMembers = activeMembersCount?.count || 25;

    const list = await db
      .select({
        id: savingsTargets.id,
        name: savingsTargets.name,
        description: savingsTargets.description,
        targetAmount: savingsTargets.targetAmount,
        currentAmount: savingsTargets.currentAmount,
        startDate: savingsTargets.startDate,
        targetDate: savingsTargets.targetDate,
        status: savingsTargets.status,
        visibility: savingsTargets.visibility,
        createdById: savingsTargets.createdBy,
        createdByName: users.name,
      })
      .from(savingsTargets)
      .leftJoin(users, eq(savingsTargets.createdBy, users.id))
      .where(isNull(savingsTargets.deletedAt))
      .orderBy(desc(savingsTargets.createdAt));

    // Fetch all visibility rules for private/role targets
    const allRules = await db
      .select({
        targetId: targetVisibilityRules.targetId,
        userId: targetVisibilityRules.userId,
        userName: users.name,
        roleId: targetVisibilityRules.roleId,
      })
      .from(targetVisibilityRules)
      .leftJoin(users, eq(targetVisibilityRules.userId, users.id));

    const rulesMap = new Map<string, { userId: string; name: string }[]>();
    for (const r of allRules) {
      if (!rulesMap.has(r.targetId)) {
        rulesMap.set(r.targetId, []);
      }
      if (r.userId && r.userName) {
        rulesMap.get(r.targetId)!.push({ userId: r.userId, name: r.userName });
      }
    }

    // Fetch pending submissions for targets
    const pendingEvidence = await db
      .select({
        id: targetContributors.id,
        targetId: targetContributors.targetId,
        targetName: savingsTargets.name,
        userId: targetContributors.userId,
        userName: users.name,
        amount: targetContributors.amount,
        contributedAt: targetContributors.contributedAt,
        evidenceId: evidence.id,
        evidenceUrl: evidence.fileUrl,
        evidenceFileName: evidence.fileName,
        evidenceStatus: evidence.status,
      })
      .from(targetContributors)
      .leftJoin(savingsTargets, eq(targetContributors.targetId, savingsTargets.id))
      .leftJoin(users, eq(targetContributors.userId, users.id))
      .innerJoin(
        evidence,
        and(
          eq(evidence.entityType, 'TARGET'),
          eq(evidence.entityId, targetContributors.id),
          eq(evidence.status, 'PENDING')
        )
      );

    const pendingSubmissions = pendingEvidence.map((p) => ({
      contributorId: p.id,
      targetId: p.targetId,
      targetName: p.targetName || 'Target',
      userId: p.userId,
      userName: p.userName || 'Siswa',
      amount: Number(p.amount || 0),
      evidenceId: p.evidenceId,
      evidenceUrl: p.evidenceUrl,
      evidenceFileName: p.evidenceFileName,
      contributedAt: p.contributedAt
        ? new Date(p.contributedAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
    }));

    // Fetch all active members
    const allMembers = await db
      .select({
        userId: users.id,
        name: users.name,
        role: roles.name,
        roleCode: roles.code,
      })
      .from(classMembers)
      .leftJoin(users, eq(classMembers.userId, users.id))
      .leftJoin(roles, eq(classMembers.roleId, roles.id))
      .where(eq(classMembers.status, 'ACTIVE'))
      .orderBy(users.name);

    // Fetch all contributions for all targets
    const allContributions = await db
      .select({
        id: targetContributors.id,
        targetId: targetContributors.targetId,
        userId: targetContributors.userId,
        userName: users.name,
        amount: targetContributors.amount,
        contributedAt: targetContributors.contributedAt,
        evidenceStatus: evidence.status,
        evidenceUrl: evidence.fileUrl,
        evidenceFileName: evidence.fileName,
      })
      .from(targetContributors)
      .leftJoin(users, eq(targetContributors.userId, users.id))
      .leftJoin(
        evidence,
        and(
          eq(evidence.entityType, 'TARGET'),
          eq(evidence.entityId, targetContributors.id)
        )
      )
      .orderBy(desc(targetContributors.contributedAt));

    // Map: targetId -> Map<userId, contribution>
    const contributionsByTarget = new Map<
      string,
      Map<
        string,
        {
          amount: number;
          status: 'LUNAS' | 'PENDING';
          evidenceUrl?: string;
          evidenceFileName?: string;
          contributedAt?: string;
        }
      >
    >();

    for (const c of allContributions) {
      if (!c.targetId || !c.userId) continue;
      if (!contributionsByTarget.has(c.targetId)) {
        contributionsByTarget.set(c.targetId, new Map());
      }
      const targetMap = contributionsByTarget.get(c.targetId)!;

      const isVerified = c.evidenceStatus === 'VERIFIED' || !c.evidenceStatus;
      const isPending = c.evidenceStatus === 'PENDING';
      const status: 'LUNAS' | 'PENDING' = isVerified ? 'LUNAS' : 'PENDING';

      // If already recorded LUNAS, don't overwrite with PENDING
      const existing = targetMap.get(c.userId);
      if (!existing || (existing.status === 'PENDING' && isVerified)) {
        targetMap.set(c.userId, {
          amount: Number(c.amount || 0),
          status,
          evidenceUrl: c.evidenceUrl || undefined,
          evidenceFileName: c.evidenceFileName || undefined,
          contributedAt: c.contributedAt
            ? new Date(c.contributedAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined,
        });
      }
    }

    // Filter targets based on visibility rules
    const accessibleTargets = list.filter((t) => {
      // 1. Leader always has full oversight
      if (isClassLeader) return true;
      // 2. Creator always sees their target
      if (currentUserId && t.createdById === currentUserId) return true;
      // 3. Public targets are visible to all
      if (t.visibility === 'PUBLIC') return true;
      // 4. Role based targets visible to officers
      if (t.visibility === 'ROLE_BASED' && isOfficer) return true;
      // 5. Private targets visible only if current user is in targetVisibilityRules
      if (t.visibility === 'PRIVATE' && currentUserId) {
        const allowed = rulesMap.get(t.id) || [];
        return allowed.some((u) => u.userId === currentUserId);
      }
      return false;
    });

    const officerRoleCodes = [
      'CLASS_LEADER',
      'VICE_CLASS_LEADER',
      'TREASURER_1',
      'TREASURER_2',
      'SECRETARY_1',
      'SECRETARY_2',
      'LOGISTICS_1',
      'LOGISTICS_2',
    ];

    const targetsResult = accessibleTargets.map((t) => {
      const target = Number(t.targetAmount) || 0;
      const current = Number(t.currentAmount) || 0;
      const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
      const allowedUsers = rulesMap.get(t.id) || [];

      const { text: cleanDesc, splitScheme, fixedAmount } = decodeTargetDescription(t.description);

      const targetContribMap = contributionsByTarget.get(t.id) || new Map();

      // Build participant pool
      let participantPool: { userId: string; name: string; role: string; roleCode?: string }[] = [];
      if (t.visibility === 'PRIVATE') {
        const allowedUserIds = new Set(allowedUsers.map((u) => u.userId));
        if (t.createdById) allowedUserIds.add(t.createdById);
        participantPool = allMembers
          .filter((m) => m.userId && allowedUserIds.has(m.userId))
          .map((m) => ({
            userId: m.userId!,
            name: m.name || 'Siswa',
            role: m.role || 'Anggota',
            roleCode: m.roleCode || 'CLASS_MEMBER',
          }));
      } else if (t.visibility === 'ROLE_BASED') {
        participantPool = allMembers
          .filter((m) => m.roleCode && officerRoleCodes.includes(m.roleCode))
          .map((m) => ({
            userId: m.userId!,
            name: m.name || 'Siswa',
            role: m.role || 'Pengurus',
            roleCode: m.roleCode || 'CLASS_MEMBER',
          }));
      } else {
        // PUBLIC
        participantPool = allMembers.map((m) => ({
          userId: m.userId!,
          name: m.name || 'Siswa',
          role: m.role || 'Anggota',
          roleCode: m.roleCode || 'CLASS_MEMBER',
        }));
      }

      const participantCount = Math.max(1, participantPool.length);

      let nominalPerPerson = 0;
      if (splitScheme === 'EQUAL_SPLIT') {
        nominalPerPerson = target > 0 ? Math.ceil(target / participantCount) : 0;
      } else if (splitScheme === 'FIXED_AMOUNT') {
        nominalPerPerson = fixedAmount || 0;
      } else {
        nominalPerPerson = 0;
      }

      // Compute participant list with status: LUNAS, PENDING, UNPAID
      let paidCount = 0;
      let pendingCount = 0;
      let unpaidCount = 0;

      const participants = participantPool.map((p) => {
        const contrib = targetContribMap.get(p.userId);
        if (contrib && contrib.status === 'LUNAS') {
          paidCount++;
          return {
            userId: p.userId,
            name: p.name,
            role: p.role,
            roleCode: p.roleCode,
            status: 'LUNAS' as const,
            amount: contrib.amount,
            evidenceUrl: contrib.evidenceUrl,
            evidenceFileName: contrib.evidenceFileName,
            contributedAt: contrib.contributedAt,
          };
        } else if (contrib && contrib.status === 'PENDING') {
          pendingCount++;
          return {
            userId: p.userId,
            name: p.name,
            role: p.role,
            roleCode: p.roleCode,
            status: 'PENDING' as const,
            amount: contrib.amount,
            evidenceUrl: contrib.evidenceUrl,
            evidenceFileName: contrib.evidenceFileName,
            contributedAt: contrib.contributedAt,
          };
        } else {
          unpaidCount++;
          return {
            userId: p.userId,
            name: p.name,
            role: p.role,
            roleCode: p.roleCode,
            status: 'UNPAID' as const,
            amount: 0,
          };
        }
      });

      const currentUserParticipant = currentUserId
        ? participants.find((p) => p.userId === currentUserId) || null
        : null;

      return {
        id: t.id,
        name: t.name,
        description: cleanDesc,
        targetAmount: target,
        currentAmount: current,
        startDate: t.startDate || '—',
        targetDate: t.targetDate || '—',
        status: t.status,
        visibility: t.visibility,
        progress,
        createdBy: t.createdByName || 'Ketua Kelas',
        createdById: t.createdById,
        allowedUsers,
        allowedUserIds: allowedUsers.map((u) => u.userId),
        splitScheme,
        fixedAmount,
        nominalPerPerson,
        participantCount,
        participants,
        paidCount,
        pendingCount,
        unpaidCount,
        currentUserStatus: currentUserParticipant ? currentUserParticipant.status : null,
        currentUserAmount: currentUserParticipant ? currentUserParticipant.amount : 0,
        canManage,
      };
    });

    return {
      targets: targetsResult,
      pendingSubmissions,
      canManage,
      currentUserId: currentUserId || null,
      currentUserRole: currentUserRoleCode || 'CLASS_MEMBER',
    };
  } catch (error) {
    console.error('Error in getSavingsTargetsAction:', error);
    return {
      targets: [],
      pendingSubmissions: [],
      canManage: false,
      currentUserId: null,
      currentUserRole: 'CLASS_MEMBER',
    };
  }
}

// ==========================================
// 6. PURCHASES
// ==========================================
export async function getPurchasesAction() {
  try {
    const purchaseList = await db
      .select({
        id: purchases.id,
        name: purchases.name,
        description: purchases.description,
        budget: purchases.budget,
        actualAmount: purchases.actualAmount,
        status: purchases.status,
        visibility: purchases.visibility,
        createdByName: users.name,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.createdBy, users.id))
      .where(isNull(purchases.deletedAt))
      .orderBy(desc(purchases.createdAt));

    return purchaseList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      budget: Number(p.budget || 0),
      actualAmount: Number(p.actualAmount || 0),
      status: p.status,
      visibility: p.visibility,
      createdBy: p.createdByName || 'Logistik',
    }));
  } catch (error) {
    console.error('Error in getPurchasesAction:', error);
    return [];
  }
}

// ==========================================
// 7. EVIDENCE
// ==========================================
export async function getEvidenceAction() {
  try {
    const list = await db
      .select({
        id: evidence.id,
        entityType: evidence.entityType,
        fileName: evidence.fileName,
        fileUrl: evidence.fileUrl,
        fileType: evidence.fileType,
        status: evidence.status,
        uploadedByName: users.name,
        createdAt: evidence.createdAt,
      })
      .from(evidence)
      .leftJoin(users, eq(evidence.uploadedBy, users.id))
      .orderBy(desc(evidence.createdAt));

    return list.map((e) => ({
      id: e.id,
      entityType: e.entityType,
      fileName: e.fileName,
      fileUrl: e.fileUrl,
      fileType: e.fileType,
      status: e.status,
      uploadedBy: e.uploadedByName || 'Member',
      date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    }));
  } catch (error) {
    console.error('Error in getEvidenceAction:', error);
    return [];
  }
}

// ==========================================
// 8. ROLES & PERMISSIONS
// ==========================================
export async function getRolesAction() {
  try {
    const allRoles = await db.select().from(roles).orderBy(roles.sortOrder);

    // Count permissions per role
    const permCounts = await db
      .select({
        roleId: rolePermissions.roleId,
        count: sql<number>`count(*)::int`,
      })
      .from(rolePermissions)
      .groupBy(rolePermissions.roleId);

    const permMap = new Map(permCounts.map((p) => [p.roleId, p.count]));

    // Count members per role
    const memberCounts = await db
      .select({
        roleId: classMembers.roleId,
        count: sql<number>`count(*)::int`,
      })
      .from(classMembers)
      .where(eq(classMembers.status, 'ACTIVE'))
      .groupBy(classMembers.roleId);

    const memberMap = new Map(memberCounts.map((m) => [m.roleId, m.count]));

    return allRoles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description || '',
      perms: permMap.get(r.id) || 0,
      members: memberMap.get(r.id) || 0,
      isDefault: r.isDefault,
    }));
  } catch (error) {
    console.error('Error in getRolesAction:', error);
    return [];
  }
}

export async function getPermissionsAction() {
  try {
    const allPerms = await db.select().from(permissions).orderBy(permissions.resource, permissions.action);
    return allPerms;
  } catch (error) {
    console.error('Error in getPermissionsAction:', error);
    return [];
  }
}

// ==========================================
// 9. AUDIT LOGS
// ==========================================
export async function getAuditLogsAction() {
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        newData: auditLogs.newData,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    return logs.map((l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (l.newData as any) || {};
      return {
        id: l.id,
        user: l.userName || 'System',
        action: l.action,
        entity: l.entity,
        detail: data.detail || data.message || `${l.action} on ${l.entity}`,
        time: l.createdAt ? new Date(l.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
      };
    });
  } catch (error) {
    console.error('Error in getAuditLogsAction:', error);
    return [];
  }
}

// ==========================================
// 10. TRANSACTION CRUD ACTIONS
// ==========================================
export async function getCategoriesAndPaymentMethodsAction() {
  try {
    const categories = await db
      .select({
        id: cashflowCategories.id,
        name: cashflowCategories.name,
        type: cashflowCategories.type,
      })
      .from(cashflowCategories)
      .orderBy(cashflowCategories.type, cashflowCategories.name);

    const methods = await db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
        code: paymentMethods.code,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.status, 'ACTIVE'));

    return { categories, methods };
  } catch (error) {
    console.error('Error in getCategoriesAndPaymentMethodsAction:', error);
    return { categories: [], methods: [] };
  }
}

export async function createTransactionAction(formData: {
  type: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  categoryName?: string;
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethodCode?: string;
  paymentMethodId?: string;
  receiptBase64?: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
}) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak menambah transaksi kas.'
      );
    }

    const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
    const classId = cls?.id;
    if (!classId) throw new Error('Kelas tidak ditemukan.');

    let categoryId = formData.categoryId;
    if (!categoryId) {
      // Find or create category
      const [existingCat] = await db
        .select({ id: cashflowCategories.id })
        .from(cashflowCategories)
        .where(eq(cashflowCategories.type, formData.type))
        .limit(1);
      categoryId = existingCat?.id;
    }

    let paymentMethodId = formData.paymentMethodId;
    if (!paymentMethodId && formData.paymentMethodCode) {
      const [existingMethod] = await db
        .select({ id: paymentMethods.id })
        .from(paymentMethods)
        .where(eq(paymentMethods.code, formData.paymentMethodCode))
        .limit(1);
      paymentMethodId = existingMethod?.id;
    }

    if (!categoryId) {
      const [newCat] = await db
        .insert(cashflowCategories)
        .values({
          name: formData.categoryName || (formData.type === 'INCOME' ? 'Pemasukan Lainnya' : 'Pengeluaran Lainnya'),
          type: formData.type,
        })
        .returning({ id: cashflowCategories.id });
      categoryId = newCat.id;
    }

    const [newTx] = await db
      .insert(cashflowTransactions)
      .values({
        classId,
        type: formData.type,
        categoryId,
        amount: String(formData.amount),
        description: formData.description,
        transactionDate: formData.transactionDate,
        createdBy: userId,
        paymentMethodId: paymentMethodId || null,
        status: 'COMPLETED',
      })
      .returning({ id: cashflowTransactions.id });

    // Save evidence / receipt if provided
    if (formData.receiptBase64 && newTx?.id) {
      await db.insert(evidence).values({
        entityType: 'CASHFLOW',
        entityId: newTx.id,
        fileName: formData.receiptFileName || 'nota_transaksi.jpg',
        fileUrl: formData.receiptBase64,
        fileType: formData.receiptFileType || 'image/jpeg',
        fileSize: formData.receiptFileSize || 102400,
        uploadedBy: userId,
        status: 'VERIFIED',
      });
    }

    // Record audit log
    await db.insert(auditLogs).values({
      userId,
      action: 'CREATE',
      entity: 'Cashflow',
      newData: {
        type: formData.type,
        amount: formData.amount,
        description: formData.description,
        detail: `Tambah ${formData.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}: ${formData.description || 'Transaksi'} — Rp${Number(formData.amount).toLocaleString('id-ID')}${formData.receiptBase64 ? ' (dengan lampiran bukti)' : ''}`,
      },
    });

    const isIncome = formData.type === 'INCOME';
    await createNotificationHelper({
      type: 'PAYMENT_RECEIVED',
      title: isIncome ? '↗ Pemasukan Kas Baru' : '↘ Pengeluaran Kas Baru',
      message: `${isIncome ? 'Pemasukan' : 'Pengeluaran'} (${formData.categoryName || 'Kas'}) sebesar Rp${Number(formData.amount).toLocaleString('id-ID')} telah dicatat.`,
      entityType: 'CASHFLOW',
      entityId: newTx?.id,
    });

    revalidatePath('/dashboard');
    revalidatePath('/finance/cashflow');
    revalidatePath('/finance/income');
    revalidatePath('/finance/expense');
    revalidatePath('/finance/reports');
    revalidatePath('/evidence');
    return { success: true, transactionId: newTx?.id };
  } catch (error: unknown) {
    console.error('Error in createTransactionAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateTransactionAction(
  id: string,
  formData: {
    type?: 'INCOME' | 'EXPENSE';
    amount?: number;
    description?: string;
    transactionDate?: string;
    receiptBase64?: string;
    receiptFileName?: string;
    receiptFileType?: string;
    receiptFileSize?: number;
    removeEvidence?: boolean;
  }
) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak mengubah transaksi kas.'
      );
    }

    const updateValues: Record<string, unknown> = {};
    if (formData.type) updateValues.type = formData.type;
    if (formData.amount !== undefined) updateValues.amount = String(formData.amount);
    if (formData.description !== undefined) updateValues.description = formData.description;
    if (formData.transactionDate) updateValues.transactionDate = formData.transactionDate;

    await db
      .update(cashflowTransactions)
      .set(updateValues)
      .where(eq(cashflowTransactions.id, id));

    // Evidence update
    if (formData.removeEvidence) {
      await db.delete(evidence).where(
        and(eq(evidence.entityType, 'CASHFLOW'), eq(evidence.entityId, id))
      );
    } else if (formData.receiptBase64) {
      await db.delete(evidence).where(
        and(eq(evidence.entityType, 'CASHFLOW'), eq(evidence.entityId, id))
      );
      await db.insert(evidence).values({
        entityType: 'CASHFLOW',
        entityId: id,
        fileName: formData.receiptFileName || 'nota_transaksi.jpg',
        fileUrl: formData.receiptBase64,
        fileType: formData.receiptFileType || 'image/jpeg',
        fileSize: formData.receiptFileSize || 102400,
        uploadedBy: userId,
        status: 'VERIFIED',
      });
    }

    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'UPDATE',
        entity: 'Cashflow',
        newData: {
          id,
          detail: `Edit transaksi kas ID: ${id.slice(0, 8)}`,
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/finance/cashflow');
    revalidatePath('/finance/income');
    revalidatePath('/finance/expense');
    revalidatePath('/finance/reports');
    revalidatePath('/evidence');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateTransactionAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak menghapus transaksi kas.'
      );
    }

    const [tx] = await db
      .select({
        id: cashflowTransactions.id,
        type: cashflowTransactions.type,
        amount: cashflowTransactions.amount,
        description: cashflowTransactions.description,
      })
      .from(cashflowTransactions)
      .where(eq(cashflowTransactions.id, id))
      .limit(1);

    await db.delete(cashflowTransactions).where(eq(cashflowTransactions.id, id));

    if (userId) {
      const txTypeLabel = tx?.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
      const txAmount = tx ? Number(tx.amount).toLocaleString('id-ID') : '0';
      const txDesc = tx?.description ? ` (${tx.description})` : '';

      await db.insert(auditLogs).values({
        userId,
        action: 'DELETE',
        entity: 'Cashflow',
        newData: {
          id,
          detail: `Hapus transaksi ${txTypeLabel}: Rp${txAmount}${txDesc}`,
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/finance/cashflow');
    revalidatePath('/finance/income');
    revalidatePath('/finance/expense');
    revalidatePath('/finance/reports');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteTransactionAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 11. MEMBERS CRUD ACTIONS
// ==========================================
export async function createMemberAction(formData: {
  name: string;
  email: string;
  gender: 'MALE' | 'FEMALE';
  roleId?: string;
  roleCode?: string;
}) {
  try {
    const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
    const classId = cls?.id;
    if (!classId) throw new Error('Kelas tidak ditemukan.');

    let roleId = formData.roleId;
    if (!roleId) {
      const [defaultRole] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(formData.roleCode ? eq(roles.code, formData.roleCode) : eq(roles.code, 'CLASS_MEMBER'))
        .limit(1);
      roleId = defaultRole?.id;
    }
    if (!roleId) throw new Error('Role tidak ditemukan.');

    // Insert user
    const defaultPassword = `${formData.name.split(' ')[0]}#2026`;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name: formData.name,
        email: formData.email.toLowerCase(),
        gender: formData.gender,
        passwordHash,
      })
      .returning({ id: users.id });

    // Insert class member
    await db.insert(classMembers).values({
      classId,
      userId: newUser.id,
      roleId,
      status: 'ACTIVE',
    });

    // Record audit log
    await db.insert(auditLogs).values({
      userId: newUser.id,
      action: 'CREATE',
      entity: 'Member',
      newData: {
        name: formData.name,
        detail: `Tambah anggota baru: ${formData.name}`,
      },
    });

    revalidatePath('/members');
    revalidatePath('/contributions');
    revalidatePath('/contributions/status');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createMemberAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateMemberAction(
  userId: string,
  formData: {
    name?: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE';
    roleId?: string;
    roleCode?: string;
  }
) {
  try {
    if (formData.name || formData.email || formData.gender) {
      const userUpdate: Record<string, unknown> = {};
      if (formData.name) userUpdate.name = formData.name;
      if (formData.email) userUpdate.email = formData.email.toLowerCase();
      if (formData.gender) userUpdate.gender = formData.gender;
      await db.update(users).set(userUpdate).where(eq(users.id, userId));
    }

    if (formData.roleId || formData.roleCode) {
      let roleId = formData.roleId;
      if (!roleId && formData.roleCode) {
        const [r] = await db.select({ id: roles.id }).from(roles).where(eq(roles.code, formData.roleCode)).limit(1);
        roleId = r?.id;
      }
      if (roleId) {
        await db.update(classMembers).set({ roleId }).where(eq(classMembers.userId, userId));
      }
    }

    await db.insert(auditLogs).values({
      userId,
      action: 'UPDATE',
      entity: 'Member',
      newData: {
        userId,
        detail: `Perbarui profil anggota: ${formData.name || userId.slice(0, 8)}`,
      },
    });

    revalidatePath('/members');
    revalidatePath('/contributions');
    revalidatePath('/contributions/status');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateMemberAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteMemberAction(userId: string) {
  try {
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));
    await db.update(classMembers).set({ status: 'INACTIVE' }).where(eq(classMembers.userId, userId));

    await db.insert(auditLogs).values({
      userId,
      action: 'DELETE',
      entity: 'Member',
      newData: {
        userId,
        detail: `Hapus / nonaktifkan anggota ID: ${userId.slice(0, 8)}`,
      },
    });

    revalidatePath('/members');
    revalidatePath('/contributions');
    revalidatePath('/contributions/status');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteMemberAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 12. CONTRIBUTIONS PAYMENT TOGGLE
// ==========================================
export async function updateContributionPaymentStatusAction(formData: {
  userId: string;
  weekNumber: number;
  month?: number;
  year?: number;
  methodCode?: string;
}) {
  try {
    const session = await auth();
    let currentUserId = session?.user?.id;
    if (!currentUserId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      currentUserId = firstUser?.id;
    }

    const month = formData.month || 8;
    const year = formData.year || 2026;
    const amount = '25000.00';

    let [contrib] = await db
      .select({ id: contributions.id })
      .from(contributions)
      .where(and(eq(contributions.month, month), eq(contributions.year, year)))
      .limit(1);

    if (!contrib) {
      const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
      const [usr] = await db.select({ id: users.id }).from(users).limit(1);
      const [newC] = await db
        .insert(contributions)
        .values({
          classId: cls.id,
          month,
          year,
          amountPerWeek: amount,
          createdBy: usr.id,
          status: 'ACTIVE',
        })
        .returning({ id: contributions.id });
      contrib = newC;
    }

    const [existing] = await db
      .select({ id: contributionPayments.id, status: contributionPayments.status })
      .from(contributionPayments)
      .where(
        and(
          eq(contributionPayments.contributionId, contrib.id),
          eq(contributionPayments.userId, formData.userId),
          eq(contributionPayments.weekNumber, formData.weekNumber)
        )
      )
      .limit(1);

    let paymentMethodId: string | null = null;
    if (formData.methodCode) {
      const [pm] = await db
        .select({ id: paymentMethods.id })
        .from(paymentMethods)
        .where(eq(paymentMethods.code, formData.methodCode))
        .limit(1);
      paymentMethodId = pm?.id || null;
    }

    if (existing) {
      const nextStatus = existing.status === 'PAID' ? 'UNPAID' : 'PAID';
      await db
        .update(contributionPayments)
        .set({
          status: nextStatus,
          paidAt: nextStatus === 'PAID' ? new Date() : null,
          verifiedBy: nextStatus === 'PAID' ? currentUserId : null,
          verifiedAt: nextStatus === 'PAID' ? new Date() : null,
          paymentMethodId: nextStatus === 'PAID' ? paymentMethodId : null,
        })
        .where(eq(contributionPayments.id, existing.id));
    } else {
      await db.insert(contributionPayments).values({
        contributionId: contrib.id,
        userId: formData.userId,
        weekNumber: formData.weekNumber,
        amount,
        status: 'PAID',
        paidAt: new Date(),
        verifiedBy: currentUserId,
        verifiedAt: new Date(),
        paymentMethodId,
      });
    }

    revalidatePath('/contributions');
    revalidatePath('/contributions/status');
    revalidatePath('/dashboard');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateContributionPaymentStatusAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function submitContributionPaymentAction(formData: {
  userId?: string;
  weekNumber: number;
  month?: number;
  year?: number;
  amount?: number;
  methodCode: string;
  receiptBase64?: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
  note?: string;
}) {
  try {
    const session = await auth();
    let currentUserId = session?.user?.id;
    if (!currentUserId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      currentUserId = firstUser?.id;
    }
    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (currentUserId && !currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    const approverRoles = ['CLASS_LEADER', 'VICE_CLASS_LEADER', 'SECRETARY_1', 'SECRETARY_2'];
    const isApprover = approverRoles.includes(currentUserRoleCode || '');

    // Non-approvers can ONLY submit payment for themselves!
    const targetUserId = isApprover && formData.userId ? formData.userId : currentUserId;
    const month = formData.month || 8;
    const year = formData.year || 2026;
    const amount = String(formData.amount || 25000);

    const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
    let [contrib] = await db
      .select({ id: contributions.id })
      .from(contributions)
      .where(and(eq(contributions.month, month), eq(contributions.year, year)))
      .limit(1);

    if (!contrib) {
      const [newC] = await db
        .insert(contributions)
        .values({
          classId: cls.id,
          month,
          year,
          amountPerWeek: amount,
          createdBy: currentUserId,
          status: 'ACTIVE',
        })
        .returning({ id: contributions.id });
      contrib = newC;
    }

    let [pm] = await db
      .select({ id: paymentMethods.id, code: paymentMethods.code, name: paymentMethods.name })
      .from(paymentMethods)
      .where(eq(paymentMethods.code, formData.methodCode || 'CASH'))
      .limit(1);

    const [existing] = await db
      .select({ id: contributionPayments.id })
      .from(contributionPayments)
      .where(
        and(
          eq(contributionPayments.contributionId, contrib.id),
          eq(contributionPayments.userId, targetUserId),
          eq(contributionPayments.weekNumber, formData.weekNumber)
        )
      )
      .limit(1);

    let paymentId: string;
    if (existing) {
      paymentId = existing.id;
      await db
        .update(contributionPayments)
        .set({
          status: 'PENDING',
          paymentMethodId: pm?.id || null,
          amount,
          paidAt: new Date(),
          verifiedBy: null,
          verifiedAt: null,
        })
        .where(eq(contributionPayments.id, existing.id));
    } else {
      const [newP] = await db
        .insert(contributionPayments)
        .values({
          contributionId: contrib.id,
          userId: targetUserId,
          weekNumber: formData.weekNumber,
          amount,
          status: 'PENDING',
          paidAt: new Date(),
          paymentMethodId: pm?.id || null,
        })
        .returning({ id: contributionPayments.id });
      paymentId = newP.id;
    }

    // Attach receipt / evidence if provided
    if (formData.receiptBase64 && formData.receiptFileName) {
      await db.delete(evidence).where(
        and(eq(evidence.entityType, 'CONTRIBUTION'), eq(evidence.entityId, paymentId))
      );

      await db.insert(evidence).values({
        entityType: 'CONTRIBUTION',
        entityId: paymentId,
        fileName: formData.receiptFileName,
        fileUrl: formData.receiptBase64,
        fileType: formData.receiptFileType || 'image/jpeg',
        fileSize: formData.receiptFileSize || 102400,
        uploadedBy: currentUserId,
        status: 'PENDING',
      });
    }

    const [targetUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, targetUserId)).limit(1);

    await db.insert(auditLogs).values({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'Contribution',
      newData: {
        paymentId,
        targetUserId,
        weekNumber: formData.weekNumber,
        detail: `Pengajuan pembayaran kas: Minggu ${formData.weekNumber} oleh ${targetUser?.name || 'Siswa'} (${pm?.name || formData.methodCode}) — Menunggu verifikasi`,
      },
    });

    revalidatePath('/contributions');
    revalidatePath('/contributions/status');
    revalidatePath('/evidence');
    revalidatePath('/audit');
    return { success: true, paymentId };
  } catch (error: unknown) {
    console.error('Error in submitContributionPaymentAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function verifyContributionPaymentAction(formData: {
  paymentId: string;
  status: 'PAID' | 'UNPAID' | 'REJECTED';
  rejectionReason?: string;
}) {
  try {
    const session = await auth();
    let currentUserId = session?.user?.id;
    let currentUserRoleCode = (session?.user as any)?.roleCode;

    if (currentUserId && !currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    const approverRoles = ['CLASS_LEADER', 'VICE_CLASS_LEADER', 'SECRETARY_1', 'SECRETARY_2'];
    if (!currentUserId || !approverRoles.includes(currentUserRoleCode || '')) {
      throw new Error('Hanya Ketua Kelas, Wakil Ketua, Sekretaris 1 & Sekretaris 2 yang berhak mengonfirmasi pembayaran uang kas.');
    }

    const [p] = await db
      .select({
        id: contributionPayments.id,
        userId: contributionPayments.userId,
        weekNumber: contributionPayments.weekNumber,
        amount: contributionPayments.amount,
        paymentMethodId: contributionPayments.paymentMethodId,
        userName: users.name,
      })
      .from(contributionPayments)
      .leftJoin(users, eq(contributionPayments.userId, users.id))
      .where(eq(contributionPayments.id, formData.paymentId))
      .limit(1);

    if (!p) throw new Error('Data pembayaran iuran tidak ditemukan.');

    const isApproval = formData.status === 'PAID';

    await db
      .update(contributionPayments)
      .set({
        status: isApproval ? 'PAID' : 'UNPAID',
        verifiedBy: isApproval ? currentUserId : null,
        verifiedAt: isApproval ? new Date() : null,
        paidAt: isApproval ? new Date() : null,
      })
      .where(eq(contributionPayments.id, formData.paymentId));

    // Update evidence status
    await db
      .update(evidence)
      .set({
        status: isApproval ? 'VERIFIED' : 'REJECTED',
        verifiedBy: currentUserId,
        verifiedAt: new Date(),
        rejectionReason: formData.rejectionReason || null,
      })
      .where(and(eq(evidence.entityType, 'CONTRIBUTION'), eq(evidence.entityId, formData.paymentId)));

    // If approved, automatically insert income transaction into cashflow
    if (isApproval) {
      const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
      let [cat] = await db
        .select()
        .from(cashflowCategories)
        .where(eq(cashflowCategories.name, 'Uang Kas'))
        .limit(1);

      if (!cat) {
        const [newCat] = await db
          .insert(cashflowCategories)
          .values({
            name: 'Uang Kas',
            type: 'INCOME',
            icon: 'fa-coins',
            sortOrder: 1,
            isDefault: 'true',
          })
          .returning();
        cat = newCat;
      }

      await db.insert(cashflowTransactions).values({
        classId: cls.id,
        categoryId: cat.id,
        paymentMethodId: p.paymentMethodId || null,
        type: 'INCOME',
        amount: String(p.amount),
        description: `Pembayaran Uang Kas Minggu ${p.weekNumber} (${p.userName || 'Siswa'})`,
        transactionDate: new Date().toISOString().slice(0, 10),
        createdBy: currentUserId,
        status: 'COMPLETED',
      });
    }

    await db.insert(auditLogs).values({
      userId: currentUserId,
      action: 'VERIFY',
      entity: 'Contribution',
      newData: {
        paymentId: formData.paymentId,
        userName: p.userName,
        status: formData.status,
        detail: isApproval
          ? `Konfirmasi & Setujui pembayaran uang kas: Minggu ${p.weekNumber} - ${p.userName} (Rp${Number(p.amount).toLocaleString('id-ID')})`
          : `Tolak pengajuan pembayaran uang kas: Minggu ${p.weekNumber} - ${p.userName}${formData.rejectionReason ? ` (Alasan: ${formData.rejectionReason})` : ''}`,
      },
    });

    if (p.userId) {
      await createNotificationHelper({
        userIds: [p.userId],
        type: isApproval ? 'PAYMENT_RECEIVED' : 'EVIDENCE_REJECTED',
        title: isApproval ? '✓ Pembayaran Kas Disetujui (LUNAS)' : '✕ Pengajuan Pembayaran Kas Ditolak',
        message: isApproval
          ? `Pembayaran uang kas Anda untuk Minggu ke-${p.weekNumber} (Rp${Number(p.amount).toLocaleString('id-ID')}) telah diverifikasi & disetujui.`
          : `Pengajuan pembayaran kas Minggu ke-${p.weekNumber} ditolak: ${formData.rejectionReason || 'Bukti transfer tidak valid.'}`,
        entityType: 'CONTRIBUTION',
        entityId: formData.paymentId,
      });
    }

    revalidatePath('/contributions');
    revalidatePath('/contributions/status');
    revalidatePath('/finance/cashflow');
    revalidatePath('/finance/income');
    revalidatePath('/evidence');
    revalidatePath('/audit');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in verifyContributionPaymentAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 13. SAVINGS TARGETS CRUD
// ==========================================
export async function createSavingsTargetAction(formData: {
  name: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ROLE_BASED';
  allowedUserIds?: string[];
  splitScheme?: 'EQUAL_SPLIT' | 'VOLUNTARY' | 'FIXED_AMOUNT';
  fixedAmount?: number;
}) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak membuat target tabungan.'
      );
    }

    const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);

    const encodedDesc = encodeTargetDescription(
      formData.description,
      formData.splitScheme,
      formData.fixedAmount
    );

    const [newTarget] = await db
      .insert(savingsTargets)
      .values({
        classId: cls.id,
        name: formData.name,
        description: encodedDesc,
        targetAmount: String(formData.targetAmount || 0),
        currentAmount: String(formData.currentAmount || 0),
        startDate: new Date().toISOString().slice(0, 10),
        targetDate: formData.targetDate || null,
        visibility: formData.visibility || 'PUBLIC',
        status: 'ACTIVE',
        createdBy: userId!,
      })
      .returning({ id: savingsTargets.id });

    // If PRIVATE, save allowed users to targetVisibilityRules
    if (formData.visibility === 'PRIVATE' && formData.allowedUserIds && formData.allowedUserIds.length > 0) {
      const uniqueUserIds = Array.from(new Set([...formData.allowedUserIds, userId!]));
      const rulesToInsert = uniqueUserIds.map((uId) => ({
        targetId: newTarget.id,
        type: 'USER' as const,
        userId: uId,
      }));
      await db.insert(targetVisibilityRules).values(rulesToInsert);
    }

    await db.insert(auditLogs).values({
      userId: userId!,
      action: 'CREATE',
      entity: 'Target',
      newData: {
        name: formData.name,
        visibility: formData.visibility,
        splitScheme: formData.splitScheme || 'EQUAL_SPLIT',
        allowedUsersCount: formData.allowedUserIds?.length || 0,
        detail: `Buat target tabungan baru: ${formData.name} (${formData.visibility || 'PUBLIC'}) — Rp${Number(formData.targetAmount || 0).toLocaleString('id-ID')}`,
      },
    });

    await createNotificationHelper({
      userIds: formData.visibility === 'PRIVATE' ? formData.allowedUserIds : undefined,
      type: 'TARGET_NEAR_COMPLETION',
      title: '🎯 Target Tabungan Baru Dibuka',
      message: `Program tabungan "${formData.name}" dengan target dana Rp${Number(formData.targetAmount || 0).toLocaleString('id-ID')} telah resmi dibuka!`,
      entityType: 'TARGET',
      entityId: newTarget.id,
    });

    revalidatePath('/savings/targets');
    revalidatePath('/dashboard');
    revalidatePath('/audit');
    return { success: true, targetId: newTarget.id };
  } catch (error: unknown) {
    console.error('Error in createSavingsTargetAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateSavingsTargetAction(
  id: string,
  formData: {
    name?: string;
    description?: string;
    targetAmount?: number;
    currentAmount?: number;
    targetDate?: string;
    status?: 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'ACHIEVED' | 'CANCELLED';
    visibility?: 'PUBLIC' | 'PRIVATE' | 'ROLE_BASED';
    allowedUserIds?: string[];
    splitScheme?: 'EQUAL_SPLIT' | 'VOLUNTARY' | 'FIXED_AMOUNT';
    fixedAmount?: number;
  }
) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak mengubah target tabungan.'
      );
    }

    const updateValues: Record<string, unknown> = {};
    if (formData.name) updateValues.name = formData.name;
    if (formData.description !== undefined || formData.splitScheme !== undefined || formData.fixedAmount !== undefined) {
      updateValues.description = encodeTargetDescription(
        formData.description,
        formData.splitScheme,
        formData.fixedAmount
      );
    }
    if (formData.targetAmount !== undefined) updateValues.targetAmount = String(formData.targetAmount || 0);
    if (formData.currentAmount !== undefined) updateValues.currentAmount = String(formData.currentAmount || 0);
    if (formData.targetDate !== undefined) updateValues.targetDate = formData.targetDate || null;
    if (formData.status) updateValues.status = formData.status;
    if (formData.visibility) updateValues.visibility = formData.visibility;

    await db.update(savingsTargets).set(updateValues).where(eq(savingsTargets.id, id));

    // Update visibility rules if visibility or allowedUserIds provided
    if (formData.visibility !== undefined || formData.allowedUserIds !== undefined) {
      await db.delete(targetVisibilityRules).where(eq(targetVisibilityRules.targetId, id));

      if (formData.visibility === 'PRIVATE' && formData.allowedUserIds && formData.allowedUserIds.length > 0) {
        const uniqueUserIds = Array.from(new Set(formData.allowedUserIds));
        const rulesToInsert = uniqueUserIds.map((uId) => ({
          targetId: id,
          type: 'USER' as const,
          userId: uId,
        }));
        await db.insert(targetVisibilityRules).values(rulesToInsert);
      }
    }

    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'UPDATE',
        entity: 'Target',
        newData: {
          id,
          name: formData.name,
          visibility: formData.visibility,
          detail: `Perbarui target tabungan: ${formData.name || id}`,
        },
      });
    }

    revalidatePath('/savings/targets');
    revalidatePath('/dashboard');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateSavingsTargetAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteSavingsTargetAction(id: string) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak menghapus target tabungan.'
      );
    }

    const [target] = await db
      .select({
        id: savingsTargets.id,
        name: savingsTargets.name,
        targetAmount: savingsTargets.targetAmount,
      })
      .from(savingsTargets)
      .where(eq(savingsTargets.id, id))
      .limit(1);

    await db.delete(targetVisibilityRules).where(eq(targetVisibilityRules.targetId, id));
    await db.delete(savingsTargets).where(eq(savingsTargets.id, id));

    if (userId && target) {
      await db.insert(auditLogs).values({
        userId,
        action: 'DELETE',
        entity: 'Target',
        newData: {
          id,
          name: target.name,
          detail: `Hapus target tabungan: "${target.name}" (Target: Rp${Number(target.targetAmount).toLocaleString('id-ID')})`,
        },
      });
    }

    revalidatePath('/savings/targets');
    revalidatePath('/dashboard');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteSavingsTargetAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function submitTargetContributionAction(formData: {
  targetId: string;
  amount: number;
  userId?: string;
  methodCode?: string;
  receiptBase64?: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
  note?: string;
}) {
  try {
    const session = await auth();
    let currentUserId = session?.user?.id;
    if (!currentUserId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      currentUserId = firstUser?.id;
    }
    if (!currentUserId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    const isApprover = TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '');
    const targetUserId = isApprover && formData.userId ? formData.userId : currentUserId;

    const [target] = await db
      .select({ id: savingsTargets.id, name: savingsTargets.name })
      .from(savingsTargets)
      .where(eq(savingsTargets.id, formData.targetId))
      .limit(1);

    if (!target) throw new Error('Target tabungan tidak ditemukan.');

    const [newContributor] = await db
      .insert(targetContributors)
      .values({
        targetId: formData.targetId,
        userId: targetUserId,
        amount: String(formData.amount),
        contributedAt: new Date(),
      })
      .returning({ id: targetContributors.id });

    // Attach receipt / evidence with status 'PENDING'
    if (formData.receiptBase64 && formData.receiptFileName) {
      await db.insert(evidence).values({
        entityType: 'TARGET',
        entityId: newContributor.id,
        fileName: formData.receiptFileName,
        fileUrl: formData.receiptBase64,
        fileType: formData.receiptFileType || 'image/jpeg',
        fileSize: formData.receiptFileSize || 102400,
        uploadedBy: currentUserId,
        status: 'PENDING',
      });
    }

    const [userRecord] = await db.select({ name: users.name }).from(users).where(eq(users.id, targetUserId)).limit(1);

    await db.insert(auditLogs).values({
      userId: currentUserId,
      action: 'CREATE',
      entity: 'Target',
      newData: {
        targetId: formData.targetId,
        targetName: target.name,
        amount: formData.amount,
        targetUserId,
        detail: `Pengajuan setor iuran target "${target.name}" oleh ${userRecord?.name || 'Siswa'} sebesar Rp${Number(formData.amount).toLocaleString('id-ID')} — Menunggu verifikasi`,
      },
    });

    revalidatePath('/savings/targets');
    revalidatePath('/evidence');
    revalidatePath('/audit');
    return { success: true, contributorId: newContributor.id };
  } catch (error: unknown) {
    console.error('Error in submitTargetContributionAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function verifyTargetContributionAction(formData: {
  contributorId: string;
  status: 'PAID' | 'REJECTED';
  rejectionReason?: string;
}) {
  try {
    const session = await auth();
    let currentUserId = session?.user?.id;
    let currentUserRoleCode = (session?.user as any)?.roleCode;

    if (currentUserId && !currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, currentUserId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    const approverRoles = ['CLASS_LEADER', 'VICE_CLASS_LEADER', 'TREASURER_1', 'SECRETARY_1', 'SECRETARY_2'];
    if (!currentUserId || !approverRoles.includes(currentUserRoleCode || '')) {
      throw new Error('Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak mengonfirmasi setoran target.');
    }

    const [contributor] = await db
      .select({
        id: targetContributors.id,
        targetId: targetContributors.targetId,
        userId: targetContributors.userId,
        amount: targetContributors.amount,
        targetName: savingsTargets.name,
        targetCurrentAmount: savingsTargets.currentAmount,
        userName: users.name,
      })
      .from(targetContributors)
      .leftJoin(savingsTargets, eq(targetContributors.targetId, savingsTargets.id))
      .leftJoin(users, eq(targetContributors.userId, users.id))
      .where(eq(targetContributors.id, formData.contributorId))
      .limit(1);

    if (!contributor) throw new Error('Data setoran target tidak ditemukan.');

    const isApproval = formData.status === 'PAID';

    // Update evidence
    await db
      .update(evidence)
      .set({
        status: isApproval ? 'VERIFIED' : 'REJECTED',
        verifiedBy: currentUserId,
        verifiedAt: new Date(),
        rejectionReason: formData.rejectionReason || null,
      })
      .where(and(eq(evidence.entityType, 'TARGET'), eq(evidence.entityId, formData.contributorId)));

    if (isApproval) {
      // Increase target's currentAmount
      const newCurrent = Number(contributor.targetCurrentAmount || 0) + Number(contributor.amount);
      await db
        .update(savingsTargets)
        .set({ currentAmount: String(newCurrent) })
        .where(eq(savingsTargets.id, contributor.targetId));

      // Record income transaction in cashflow
      const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
      let [cat] = await db
        .select()
        .from(cashflowCategories)
        .where(eq(cashflowCategories.name, 'Target Tabungan'))
        .limit(1);

      if (!cat) {
        const [newCat] = await db
          .insert(cashflowCategories)
          .values({
            name: 'Target Tabungan',
            type: 'INCOME',
            icon: 'fa-bullseye',
            sortOrder: 2,
            isDefault: 'true',
          })
          .returning();
        cat = newCat;
      }

      await db.insert(cashflowTransactions).values({
        classId: cls.id,
        categoryId: cat.id,
        type: 'INCOME',
        amount: String(contributor.amount),
        description: `Setoran Target: ${contributor.targetName} (${contributor.userName || 'Siswa'})`,
        transactionDate: new Date().toISOString().slice(0, 10),
        createdBy: currentUserId,
        status: 'COMPLETED',
      });
    } else {
      await db.delete(targetContributors).where(eq(targetContributors.id, formData.contributorId));
    }

    await db.insert(auditLogs).values({
      userId: currentUserId,
      action: 'VERIFY',
      entity: 'Target',
      newData: {
        contributorId: formData.contributorId,
        targetName: contributor.targetName,
        userName: contributor.userName,
        status: formData.status,
        detail: isApproval
          ? `Konfirmasi setoran target "${contributor.targetName}": ${contributor.userName} (Rp${Number(contributor.amount).toLocaleString('id-ID')})`
          : `Tolak setoran target "${contributor.targetName}": ${contributor.userName}${formData.rejectionReason ? ` (Alasan: ${formData.rejectionReason})` : ''}`,
      },
    });

    if (contributor.userId) {
      await createNotificationHelper({
        userIds: [contributor.userId],
        type: isApproval ? 'TARGET_NEAR_COMPLETION' : 'EVIDENCE_REJECTED',
        title: isApproval ? '✓ Setoran Target Disetujui (LUNAS)' : '✕ Setoran Target Ditolak',
        message: isApproval
          ? `Setoran Anda untuk target tabungan "${contributor.targetName}" (Rp${Number(contributor.amount).toLocaleString('id-ID')}) telah disetujui & diverifikasi.`
          : `Pengajuan setoran untuk target "${contributor.targetName}" ditolak: ${formData.rejectionReason || 'Bukti transfer tidak valid.'}`,
        entityType: 'TARGET',
        entityId: contributor.targetId,
      });
    }

    revalidatePath('/savings/targets');
    revalidatePath('/finance/cashflow');
    revalidatePath('/finance/income');
    revalidatePath('/evidence');
    revalidatePath('/audit');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in verifyTargetContributionAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 14. PURCHASES CRUD
// ==========================================
export async function createPurchaseAction(formData: {
  name: string;
  description?: string;
  budget: number;
  actualAmount?: number;
  status?: 'PLANNED' | 'WAITING' | 'PURCHASED' | 'RECEIVED' | 'CANCELLED';
}) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak menambah rencana belanja.'
      );
    }

    const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);

    await db.insert(purchases).values({
      classId: cls.id,
      name: formData.name,
      description: formData.description || null,
      budget: String(formData.budget),
      actualAmount: String(formData.actualAmount || 0),
      status: formData.status || 'PLANNED',
      createdBy: userId,
    });

    await db.insert(auditLogs).values({
      userId,
      action: 'CREATE',
      entity: 'Purchase',
      newData: {
        name: formData.name,
        detail: `Rencana belanja baru: ${formData.name} — Anggaran Rp${Number(formData.budget).toLocaleString('id-ID')}`,
      },
    });

    revalidatePath('/purchases');
    revalidatePath('/finance/expense');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createPurchaseAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updatePurchaseAction(
  id: string,
  formData: {
    name?: string;
    description?: string;
    budget?: number;
    actualAmount?: number;
    status?: 'PLANNED' | 'WAITING' | 'PURCHASED' | 'RECEIVED' | 'CANCELLED';
  }
) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak mengubah rencana belanja.'
      );
    }

    const updateValues: Record<string, unknown> = {};
    if (formData.name) updateValues.name = formData.name;
    if (formData.description !== undefined) updateValues.description = formData.description;
    if (formData.budget !== undefined) updateValues.budget = String(formData.budget);
    if (formData.actualAmount !== undefined) updateValues.actualAmount = String(formData.actualAmount);
    if (formData.status) updateValues.status = formData.status;

    await db.update(purchases).set(updateValues).where(eq(purchases.id, id));
    revalidatePath('/purchases');
    revalidatePath('/finance/expense');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updatePurchaseAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deletePurchaseAction(id: string) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak menghapus rencana belanja.'
      );
    }

    const [p] = await db
      .select({
        id: purchases.id,
        name: purchases.name,
        budget: purchases.budget,
      })
      .from(purchases)
      .where(eq(purchases.id, id))
      .limit(1);

    await db.delete(purchases).where(eq(purchases.id, id));

    if (userId && p) {
      await db.insert(auditLogs).values({
        userId,
        action: 'DELETE',
        entity: 'Purchase',
        newData: {
          id,
          name: p.name,
          detail: `Hapus rencana belanja: "${p.name}" (Anggaran: Rp${Number(p.budget).toLocaleString('id-ID')})`,
        },
      });
    }

    revalidatePath('/purchases');
    revalidatePath('/finance/expense');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deletePurchaseAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function syncPurchaseToExpenseAction(formData: {
  purchaseId: string;
  actualAmount: number;
  paymentMethodCode?: string;
  transactionDate?: string;
}) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak terautentikasi.');

    let currentUserRoleCode = (session?.user as any)?.roleCode;
    if (!currentUserRoleCode) {
      const [member] = await db
        .select({ roleCode: roles.code })
        .from(classMembers)
        .leftJoin(roles, eq(classMembers.roleId, roles.id))
        .where(eq(classMembers.userId, userId))
        .limit(1);
      currentUserRoleCode = member?.roleCode;
    }

    if (!TARGET_ADMIN_ROLES.includes(currentUserRoleCode || '')) {
      throw new Error(
        'Hanya Ketua Kelas, Wakil Ketua, Bendahara 1, Sekretaris 1, dan Sekretaris 2 yang berhak merealisasikan belanja ke kas.'
      );
    }

    const [cls] = await db.select({ id: classes.id }).from(classes).limit(1);
    const [p] = await db.select().from(purchases).where(eq(purchases.id, formData.purchaseId)).limit(1);
    if (!p) throw new Error('Data rencana belanja tidak ditemukan.');

    const finalAmount = formData.actualAmount > 0 ? formData.actualAmount : Number(p.budget);

    // 1. Get or create Category 'Pengadaan Barang'
    let [cat] = await db
      .select()
      .from(cashflowCategories)
      .where(eq(cashflowCategories.name, 'Pengadaan Barang'))
      .limit(1);

    if (!cat) {
      const [newCat] = await db
        .insert(cashflowCategories)
        .values({
          name: 'Pengadaan Barang',
          type: 'EXPENSE',
          icon: 'fa-box',
          sortOrder: 10,
          isDefault: 'true',
        })
        .returning();
      cat = newCat;
    }

    // 2. Get Payment Method
    const methodCode = formData.paymentMethodCode || 'CASH';
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.code, methodCode))
      .limit(1);

    // 3. Create Expense Transaction in cashflow_transactions
    await db.insert(cashflowTransactions).values({
      classId: cls.id,
      categoryId: cat.id,
      paymentMethodId: method ? method.id : null,
      type: 'EXPENSE',
      amount: String(finalAmount),
      description: `Pengadaan Barang: ${p.name}`,
      transactionDate: formData.transactionDate || new Date().toISOString().slice(0, 10),
      createdBy: userId,
      purchaseId: formData.purchaseId,
      status: 'COMPLETED',
    });

    // 4. Update Purchase status to PURCHASED and actualAmount
    await db
      .update(purchases)
      .set({
        status: 'PURCHASED',
        actualAmount: String(finalAmount),
      })
      .where(eq(purchases.id, formData.purchaseId));

    // 5. Audit Log
    await db.insert(auditLogs).values({
      userId,
      action: 'CREATE',
      entity: 'Expense',
      newData: {
        purchaseId: formData.purchaseId,
        name: p.name,
        amount: finalAmount,
        detail: `Realisasi pengadaan belanja "${p.name}" otomatis dicatat ke Kas Pengeluaran: Rp${finalAmount.toLocaleString('id-ID')}`,
      },
    });

    revalidatePath('/finance/expense');
    revalidatePath('/finance/cashflow');
    revalidatePath('/purchases');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in syncPurchaseToExpenseAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 15. EVIDENCE CRUD
// ==========================================
export async function createEvidenceAction(formData: {
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  entityType?: string;
  entityId?: string;
}) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) throw new Error('Pengguna tidak ditemukan.');

    const entityId = formData.entityId || userId;

    await db.insert(evidence).values({
      entityType: formData.entityType || 'PAYMENT',
      entityId,
      fileName: formData.fileName,
      fileUrl: formData.fileUrl || '/uploads/sample-receipt.jpg',
      fileType: formData.fileType || 'image/jpeg',
      fileSize: formData.fileSize || 102400,
      uploadedBy: userId,
      status: 'PENDING',
    });

    await db.insert(auditLogs).values({
      userId,
      action: 'CREATE',
      entity: 'Evidence',
      newData: {
        fileName: formData.fileName,
        entityType: formData.entityType,
        detail: `Unggah bukti/nota baru: ${formData.fileName}`,
      },
    });

    await createNotificationHelper({
      type: 'EVIDENCE_UPLOADED',
      title: '📎 Berkas Bukti / Nota Baru',
      message: `Berkas "${formData.fileName}" (${formData.entityType || 'Bukti Transaksi'}) telah diunggah ke arsip bukti.`,
      entityType: 'EVIDENCE',
    });

    revalidatePath('/evidence');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createEvidenceAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateEvidenceAction(
  id: string,
  formData: {
    fileName: string;
    entityType?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
  }
) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    await db
      .update(evidence)
      .set({
        fileName: formData.fileName,
        ...(formData.entityType ? { entityType: formData.entityType } : {}),
        ...(formData.fileUrl ? { fileUrl: formData.fileUrl } : {}),
        ...(formData.fileType ? { fileType: formData.fileType } : {}),
        ...(formData.fileSize ? { fileSize: formData.fileSize } : {}),
      })
      .where(eq(evidence.id, id));

    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'UPDATE',
        entity: 'Evidence',
        newData: {
          id,
          fileName: formData.fileName,
          detail: `Perbarui bukti/nota: ${formData.fileName}`,
        },
      });
    }

    revalidatePath('/evidence');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateEvidenceAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function verifyEvidenceAction(id: string, status: 'VERIFIED' | 'REJECTED') {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    await db
      .update(evidence)
      .set({
        status,
        verifiedBy: userId,
        verifiedAt: new Date(),
      })
      .where(eq(evidence.id, id));

    if (userId) {
      await db.insert(auditLogs).values({
        userId,
        action: 'VERIFY',
        entity: 'Evidence',
        newData: {
          id,
          status,
          detail: `${status === 'VERIFIED' ? 'Verifikasi' : 'Tolak'} bukti ID: ${id.slice(0, 8)}`,
        },
      });
    }

    revalidatePath('/evidence');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in verifyEvidenceAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteEvidenceAction(id: string) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    const [ev] = await db
      .select({ id: evidence.id, fileName: evidence.fileName })
      .from(evidence)
      .where(eq(evidence.id, id))
      .limit(1);

    await db.delete(evidence).where(eq(evidence.id, id));

    if (userId && ev) {
      await db.insert(auditLogs).values({
        userId,
        action: 'DELETE',
        entity: 'Evidence',
        newData: {
          id,
          fileName: ev.fileName,
          detail: `Hapus berkas bukti / nota: "${ev.fileName}"`,
        },
      });
    }

    revalidatePath('/evidence');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteEvidenceAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 16. ROLES CRUD
// ==========================================
export async function createRoleAction(formData: {
  name: string;
  code: string;
  description?: string;
}) {
  try {
    const [user] = await db.select({ id: users.id }).from(users).limit(1);

    await db.insert(roles).values({
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description || null,
      sortOrder: 50,
      isDefault: false,
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: 'CREATE',
      entity: 'Role',
      newData: {
        name: formData.name,
        code: formData.code,
        detail: `Tambah peran jabatan baru: ${formData.name} (${formData.code})`,
      },
    });

    revalidatePath('/roles');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in createRoleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteRoleAction(id: string) {
  try {
    const [r] = await db
      .select({ id: roles.id, name: roles.name, code: roles.code })
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    await db.delete(roles).where(eq(roles.id, id));

    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }

    if (userId && r) {
      await db.insert(auditLogs).values({
        userId,
        action: 'DELETE',
        entity: 'Role',
        newData: {
          id,
          name: r.name,
          detail: `Hapus peran jabatan: "${r.name}" (${r.code})`,
        },
      });
    }

    revalidatePath('/roles');
    revalidatePath('/audit');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in deleteRoleAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ==========================================
// 17. NOTIFICATIONS SYSTEM
// ==========================================

export async function createNotificationHelper(params: {
  userIds?: string[];
  type: 'PAYMENT_RECEIVED' | 'EVIDENCE_UPLOADED' | 'EVIDENCE_REJECTED' | 'TARGET_NEAR_COMPLETION' | 'TARGET_DEADLINE_NEAR' | 'PAYMENT_OVERDUE' | 'PURCHASE_COMPLETED' | 'USER_ADDED' | 'PERMISSION_CHANGED';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    let targetUserIds = params.userIds;

    if (!targetUserIds || targetUserIds.length === 0) {
      const allUsers = await db.select({ id: users.id }).from(users).where(isNull(users.deletedAt));
      targetUserIds = allUsers.map((u) => u.id);
    }

    if (targetUserIds.length === 0) return;

    const valuesToInsert = targetUserIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      isRead: false,
    }));

    await db.insert(notifications).values(valuesToInsert);
  } catch (err) {
    console.error('Error in createNotificationHelper:', err);
  }
}

export async function getUserNotificationsAction() {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) return { notifications: [], unreadCount: 0 };

    const notifs = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        entityType: notifications.entityType,
        entityId: notifications.entityId,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const unreadCount = notifs.filter((n) => !n.isRead).length;

    const formatted = notifs.map((n) => {
      let href = '/dashboard';
      if (n.entityType === 'CASHFLOW' || n.type === 'PAYMENT_RECEIVED') href = '/finance/cashflow';
      else if (n.entityType === 'TARGET' || n.type === 'TARGET_NEAR_COMPLETION') href = '/savings/targets';
      else if (n.entityType === 'EVIDENCE' || n.type === 'EVIDENCE_UPLOADED') href = '/evidence';
      else if (n.entityType === 'CONTRIBUTION' || n.type === 'PAYMENT_OVERDUE') href = '/contributions';

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        entityType: n.entityType,
        entityId: n.entityId,
        isRead: n.isRead,
        href,
        timeAgo: n.createdAt
          ? new Date(n.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Baru saja',
      };
    });

    return { notifications: formatted, unreadCount };
  } catch (error) {
    console.error('Error in getUserNotificationsAction:', error);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId));
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in markNotificationAsReadAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      userId = firstUser?.id;
    }
    if (!userId) return { success: false, error: 'User not found' };

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in markAllNotificationsAsReadAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendPaymentReminderAction(targetUserId: string, arrearsAmount: number) {
  try {
    const [targetUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) throw new Error('Anggota tidak ditemukan.');

    const formattedAmount = `Rp${Number(arrearsAmount).toLocaleString('id-ID')}`;

    await db.insert(notifications).values({
      userId: targetUserId,
      type: 'PAYMENT_OVERDUE',
      title: '📲 Pengingat Tagihan Uang Kas',
      message: `Halo ${targetUser.name}! Anda memiliki tunggakan kas sebesar ${formattedAmount} untuk bulan ini. Harap segera melakukan pembayaran atau setor bukti transfer.`,
      entityType: 'CONTRIBUTION',
      isRead: false,
    });

    const session = await auth();
    let currentUserId = session?.user?.id;
    if (currentUserId) {
      await db.insert(auditLogs).values({
        userId: currentUserId,
        action: 'CREATE',
        entity: 'Notification',
        newData: {
          targetUserId,
          targetUserName: targetUser.name,
          arrearsAmount,
          detail: `Kirim pengingat tagihan uang kas ke ${targetUser.name} (${formattedAmount})`,
        },
      });
    }

    revalidatePath('/contributions/status');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error in sendPaymentReminderAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBatchPaymentReminderAction() {
  try {
    const month = 8;
    const year = 2026;
    const targetPerMonth = 100000;

    const allMembers = await db
      .select({
        userId: users.id,
        name: users.name,
      })
      .from(classMembers)
      .innerJoin(users, eq(classMembers.userId, users.id))
      .where(eq(classMembers.status, 'ACTIVE'));

    const payments = await db
      .select({
        userId: contributionPayments.userId,
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${contributionPayments.status} = 'PAID' THEN ${contributionPayments.amount} ELSE 0 END), 0)`,
      })
      .from(contributionPayments)
      .leftJoin(contributions, eq(contributionPayments.contributionId, contributions.id))
      .where(and(eq(contributions.month, month), eq(contributions.year, year)))
      .groupBy(contributionPayments.userId);

    const paidMap = new Map(payments.map((p) => [p.userId, Number(p.totalPaid)]));

    const remindersToInsert: Array<{
      userId: string;
      type: 'PAYMENT_OVERDUE';
      title: string;
      message: string;
      entityType: string;
      isRead: boolean;
    }> = [];

    for (const m of allMembers) {
      const paid = paidMap.get(m.userId) || 0;
      const sisa = Math.max(0, targetPerMonth - paid);
      if (sisa > 0) {
        remindersToInsert.push({
          userId: m.userId,
          type: 'PAYMENT_OVERDUE',
          title: '📲 Pengingat Tagihan Uang Kas Kelas',
          message: `Halo ${m.name}, Anda memiliki sisa tunggakan kas sebesar Rp${sisa.toLocaleString('id-ID')} untuk bulan ini. Harap segera melunasi iuran kas.`,
          entityType: 'CONTRIBUTION',
          isRead: false,
        });
      }
    }

    if (remindersToInsert.length > 0) {
      await db.insert(notifications).values(remindersToInsert);
    }

    revalidatePath('/contributions/status');
    return { success: true, count: remindersToInsert.length };
  } catch (error: unknown) {
    console.error('Error in sendBatchPaymentReminderAction:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


