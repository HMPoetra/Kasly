'use client';

import { useState, useEffect } from 'react';
import { getCurrentUserPermissionsAction } from '@/lib/actions/db-actions';

export function usePermissions() {
  const [roleCode, setRoleCode] = useState<string>('CLASS_LEADER');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getCurrentUserPermissionsAction();
        if (isMounted && res.isAuthenticated) {
          setRoleCode(res.roleCode || 'CLASS_MEMBER');
          setPermissions(res.permissions || []);
        }
      } catch (err) {
        console.error('Error in usePermissions hook:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasAccess = (resource: string) => {
    if (roleCode === 'CLASS_LEADER') return true;
    return permissions.some((p) => p.startsWith(`${resource}.`));
  };

  const can = (permission: string) => {
    if (roleCode === 'CLASS_LEADER') return true;
    return permissions.includes(permission);
  };

  return {
    roleCode,
    permissions,
    isLoading,
    hasAccess,
    can,
    isLeader: roleCode === 'CLASS_LEADER',
  };
}
