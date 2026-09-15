'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getCurrentUserPermissionsAction } from '@/lib/actions/db-actions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  resource?: string | string[];
  children?: { label: string; href: string; resource?: string }[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <IconGrid />,
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: <IconWallet />,
    resource: ['cashflow', 'target', 'reports'],
    children: [
      { label: 'Cashflow', href: '/finance/cashflow', resource: 'cashflow' },
      { label: 'Savings Targets', href: '/savings/targets', resource: 'target' },
      { label: 'Reports', href: '/finance/reports', resource: 'reports' },
    ],
  },
  {
    label: 'Contributions',
    href: '/contributions',
    icon: <IconUsers />,
    resource: 'contribution',
    children: [
      { label: 'Monthly', href: '/contributions', resource: 'contribution' },
      { label: 'Payment Status', href: '/contributions/status', resource: 'contribution' },
    ],
  },
  {
    label: 'Evidence',
    href: '/evidence',
    icon: <IconPaperclip />,
    resource: 'evidence',
  },
  {
    label: 'Members & Access',
    href: '/members',
    icon: <IconShield />,
    resource: ['users', 'roles'],
  },
  {
    label: 'Activity Log',
    href: '/audit',
    icon: <IconClock />,
    resource: 'audit',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <IconGear />,
    resource: 'settings',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('CLASS_LEADER');
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchPerms() {
      try {
        const res = await getCurrentUserPermissionsAction();
        if (isMounted && res.isAuthenticated) {
          setUserRole(res.roleCode || 'CLASS_MEMBER');
          setUserPerms(res.permissions || []);
        }
      } catch (err) {
        console.error('Failed to load user permissions for sidebar:', err);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    }
    fetchPerms();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const FULL_ACCESS_ROLES = ['CLASS_LEADER', 'SECRETARY_1', 'SECRETARY_2'];

  const hasAccessToResource = (resource?: string | string[]) => {
    if (!resource || FULL_ACCESS_ROLES.includes(userRole)) return true;
    const resources = Array.isArray(resource) ? resource : [resource];
    return resources.some((res) =>
      userPerms.some((p) => p.startsWith(`${res}.`))
    );
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Filter nav items based on user's active permissions
  const visibleNavItems = navItems
    .map((item) => {
      // If item has children, filter visible children
      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children.filter((c) =>
          hasAccessToResource(c.resource)
        );
        if (visibleChildren.length === 0 && !hasAccessToResource(item.resource)) {
          return null;
        }
        return {
          ...item,
          children: visibleChildren,
        };
      }

      // If item has no children, check its own resource
      if (!hasAccessToResource(item.resource)) {
        return null;
      }
      return item;
    })
    .filter(Boolean) as NavItem[];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed top-0 left-0 h-full z-50',
          'w-[280px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg',
          'border-r border-[var(--color-baby-blue-200)]/30 dark:border-slate-800',
          'shadow-[var(--shadow-card)]',
          'flex flex-col',
          'lg:relative lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0',
          'transition-transform duration-300 ease-out'
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-[var(--color-baby-blue-200)]/20 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-[var(--shadow-puffy-sm)] border border-[var(--color-baby-blue-200)]/40 dark:border-slate-700 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Hoarizon Logo"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-base font-black text-[var(--color-denim-dark)] dark:text-white font-[var(--font-display)] tracking-tight">
                HOARIZON
              </h1>
              <p className="text-[10px] text-[var(--color-denim-light)] dark:text-sky-400 opacity-70 -mt-0.5">
                Class Cashflow & Wallet
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label) || (hasChildren && item.children!.some(c => isActive(c.href)));

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                      'transition-all duration-200 cursor-pointer',
                      active
                        ? 'bg-[var(--color-baby-blue-100)] dark:bg-sky-950/70 text-[var(--color-denim-dark)] dark:text-sky-300 shadow-sm'
                        : 'text-[var(--color-accent)]/70 dark:text-slate-400 hover:bg-[var(--color-baby-blue-50)] dark:hover:bg-slate-800/60 hover:text-[var(--color-denim)] dark:hover:text-white'
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      active
                        ? 'bg-[var(--color-denim)] text-white shadow-sm'
                        : 'bg-[var(--color-baby-blue-50)] dark:bg-slate-800 text-[var(--color-denim-light)] dark:text-sky-400'
                    )}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[var(--color-denim-light)] dark:text-slate-500 opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                      'transition-all duration-200',
                      active
                        ? 'bg-[var(--color-baby-blue-100)] dark:bg-sky-950/70 text-[var(--color-denim-dark)] dark:text-sky-300 shadow-sm'
                        : 'text-[var(--color-accent)]/70 dark:text-slate-400 hover:bg-[var(--color-baby-blue-50)] dark:hover:bg-slate-800/60 hover:text-[var(--color-denim)] dark:hover:text-white'
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      active
                        ? 'bg-[var(--color-denim)] text-white shadow-sm'
                        : 'bg-[var(--color-baby-blue-50)] dark:bg-slate-800 text-[var(--color-denim-light)] dark:text-sky-400'
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Children */}
                <AnimatePresence>
                  {hasChildren && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-11 mt-1 space-y-0.5 border-l-2 border-[var(--color-baby-blue-200)]/30 dark:border-slate-800 pl-3">
                        {item.children!.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className={cn(
                                'block px-3 py-2 rounded-lg text-xs font-medium',
                                'transition-all duration-150',
                                childActive
                                  ? 'bg-[var(--color-baby-blue-50)] dark:bg-slate-800 text-[var(--color-denim)] dark:text-sky-300 font-semibold'
                                  : 'text-[var(--color-accent)]/60 dark:text-slate-400 hover:text-[var(--color-denim)] dark:hover:text-white hover:bg-[var(--color-baby-blue-50)]/50 dark:hover:bg-slate-800/40'
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-baby-blue-200)]/20 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-denim)] dark:text-sky-400 opacity-80">
            <span>✨</span>
            <span>CopyRight @Suami Marie</span>
          </div>
          <div className="text-[10px] text-[var(--color-denim-light)] dark:text-slate-500 opacity-70">
            KASLY v1.0 — Made with 💙
          </div>
        </div>
      </motion.aside>
    </>
  );
}

/* ---- Simple SVG Icons ---- */

function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5zm-8 0a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m-3 5.197V20" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconPaperclip() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
