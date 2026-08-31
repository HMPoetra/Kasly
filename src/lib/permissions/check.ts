import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  rolePermissions,
  permissions,
  userPermissionOverrides,
  classMembers,
  roles,
  targetVisibilityRules,
  purchaseVisibilityRules,
  savingsTargets,
  purchases,
} from '@/lib/db/schema';
import type { PermissionString } from '@/types';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions/constants';

/**
 * Get all effective permissions for a user, considering:
 * 1. Role-based permissions
 * 2. User-specific overrides (grant or revoke)
 * Priority: User Override > Role Permission > Default
 */
export async function getUserPermissions(
  userId: string,
  roleId: string
): Promise<PermissionString[]> {
  // Get role info
  const [roleInfo] = await db
    .select({ code: roles.code })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  // Get role permissions from DB
  const rolePerms = await db
    .select({
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));

  const permSet = new Set<string>(
    rolePerms.map((p) => `${p.resource}.${p.action}`)
  );

  // Fallback to default role permissions if empty in DB
  if (permSet.size === 0 && roleInfo?.code && DEFAULT_ROLE_PERMISSIONS[roleInfo.code]) {
    for (const p of DEFAULT_ROLE_PERMISSIONS[roleInfo.code]) {
      permSet.add(p);
    }
  }

  // Apply user overrides (priority over role permissions)
  const overrides = await db
    .select({
      resource: permissions.resource,
      action: permissions.action,
      granted: userPermissionOverrides.granted,
    })
    .from(userPermissionOverrides)
    .innerJoin(
      permissions,
      eq(userPermissionOverrides.permissionId, permissions.id)
    )
    .where(eq(userPermissionOverrides.userId, userId));

  for (const override of overrides) {
    const key = `${override.resource}.${override.action}`;
    if (override.granted) {
      permSet.add(key);
    } else {
      permSet.delete(key);
    }
  }

  return Array.from(permSet) as PermissionString[];
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(
  userId: string,
  roleId: string,
  permission: PermissionString
): Promise<boolean> {
  const perms = await getUserPermissions(userId, roleId);
  return perms.includes(permission);
}

/**
 * Check if a user has any of the specified permissions.
 */
export async function hasAnyPermission(
  userId: string,
  roleId: string,
  requiredPermissions: PermissionString[]
): Promise<boolean> {
  const perms = await getUserPermissions(userId, roleId);
  return requiredPermissions.some((p) => perms.includes(p));
}

/**
 * Check if a user can access a resource based on its visibility rules.
 * This handles PUBLIC, ROLE_BASED, USER_BASED, and PRIVATE visibility.
 */
export async function canAccessTarget(
  userId: string,
  roleId: string,
  targetId: string
): Promise<boolean> {
  const [target] = await db
    .select({ visibility: savingsTargets.visibility, createdBy: savingsTargets.createdBy })
    .from(savingsTargets)
    .where(eq(savingsTargets.id, targetId))
    .limit(1);

  if (!target) return false;

  // Creator always has access
  if (target.createdBy === userId) return true;

  switch (target.visibility) {
    case 'PUBLIC':
      return true;

    case 'PRIVATE':
      return false;

    case 'ROLE_BASED': {
      const rules = await db
        .select()
        .from(targetVisibilityRules)
        .where(
          and(
            eq(targetVisibilityRules.targetId, targetId),
            eq(targetVisibilityRules.type, 'ROLE')
          )
        );
      return rules.some((r) => r.roleId === roleId);
    }

    case 'USER_BASED': {
      const rules = await db
        .select()
        .from(targetVisibilityRules)
        .where(
          and(
            eq(targetVisibilityRules.targetId, targetId),
            eq(targetVisibilityRules.type, 'USER')
          )
        );
      return rules.some((r) => r.userId === userId);
    }

    default:
      return false;
  }
}

/**
 * Check if a user can access a purchase based on its visibility rules.
 */
export async function canAccessPurchase(
  userId: string,
  roleId: string,
  purchaseId: string
): Promise<boolean> {
  const [purchase] = await db
    .select({ visibility: purchases.visibility, createdBy: purchases.createdBy })
    .from(purchases)
    .where(eq(purchases.id, purchaseId))
    .limit(1);

  if (!purchase) return false;

  // Creator always has access
  if (purchase.createdBy === userId) return true;

  switch (purchase.visibility) {
    case 'PUBLIC':
      return true;

    case 'PRIVATE':
      return false;

    case 'ROLE_BASED': {
      const rules = await db
        .select()
        .from(purchaseVisibilityRules)
        .where(
          and(
            eq(purchaseVisibilityRules.purchaseId, purchaseId),
            eq(purchaseVisibilityRules.type, 'ROLE')
          )
        );
      return rules.some((r) => r.roleId === roleId);
    }

    case 'USER_BASED': {
      const rules = await db
        .select()
        .from(purchaseVisibilityRules)
        .where(
          and(
            eq(purchaseVisibilityRules.purchaseId, purchaseId),
            eq(purchaseVisibilityRules.type, 'USER')
          )
        );
      return rules.some((r) => r.userId === userId);
    }

    default:
      return false;
  }
}

/**
 * Get the current user's membership info (classId, roleId).
 */
export async function getUserMembership(userId: string) {
  const [membership] = await db
    .select({
      classId: classMembers.classId,
      roleId: classMembers.roleId,
    })
    .from(classMembers)
    .where(
      and(
        eq(classMembers.userId, userId),
        eq(classMembers.status, 'ACTIVE')
      )
    )
    .limit(1);

  return membership ?? null;
}
