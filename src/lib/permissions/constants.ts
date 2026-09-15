import type { PermissionString } from '@/types';

/**
 * Complete permission map.
 * Each resource has a set of allowed actions.
 */
export const PERMISSION_MAP: Record<string, string[]> = {
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

/**
 * Generate all permission strings from the permission map.
 */
export function getAllPermissions(): PermissionString[] {
  const perms: PermissionString[] = [];
  for (const [resource, actions] of Object.entries(PERMISSION_MAP)) {
    for (const action of actions) {
      perms.push(`${resource}.${action}` as PermissionString);
    }
  }
  return perms;
}

/**
 * Default role permission assignments.
 * Used during seed to set up initial permissions.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionString[]> = {
  CLASS_LEADER: getAllPermissions(), // Full access

  VICE_CLASS_LEADER: [
    'users.read', 'users.update',
    'roles.read',
    'cashflow.create', 'cashflow.read', 'cashflow.update', 'cashflow.delete',
    'contribution.create', 'contribution.read', 'contribution.update',
    'target.create', 'target.read', 'target.update', 'target.delete',
    'purchase.create', 'purchase.read', 'purchase.update',
    'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete',
    'reports.read', 'reports.export',
    'audit.read',
    'settings.read',
  ],

  TREASURER_1: [
    'users.read',
    'cashflow.create', 'cashflow.read', 'cashflow.update', 'cashflow.delete',
    'contribution.create', 'contribution.read', 'contribution.update', 'contribution.delete',
    'target.create', 'target.read', 'target.update', 'target.delete',
    'purchase.create', 'purchase.read', 'purchase.update',
    'evidence.create', 'evidence.read', 'evidence.update', 'evidence.delete',
    'reports.read', 'reports.export',
    'audit.read',
  ],

  TREASURER_2: [
    'users.read',
    'cashflow.read',
    'contribution.read',
    'target.read',
    'purchase.read',
    'evidence.read',
    'reports.read', 'reports.export',
    'audit.read',
  ],

  SECRETARY_1: getAllPermissions(), // Full access — same as Class Leader

  SECRETARY_2: getAllPermissions(), // Full access — same as Class Leader

  LOGISTICS_1: [
    'users.read',
    'cashflow.read',
    'purchase.create', 'purchase.read', 'purchase.update',
    'evidence.read',
  ],

  LOGISTICS_2: [
    'users.read',
    'cashflow.read',
    'purchase.read', 'purchase.update',
    'evidence.read',
  ],

  DISCIPLINARY: [
    'users.read',
    'contribution.read',
    'reports.read',
    'evidence.read',
  ],

  CREATIVE_1: [
    'users.read',
    'evidence.read',
    'target.read',
  ],

  CREATIVE_2: [
    'users.read',
    'evidence.read',
    'target.read',
  ],

  CREATIVE_3: [
    'users.read',
    'evidence.read',
    'target.read',
  ],

  CLASS_MEMBER: [
    'cashflow.read',
    'contribution.read',
    'target.read',
    'purchase.read',
    'evidence.read',
  ],
};
