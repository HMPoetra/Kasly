'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/ui/Sidebar';
import { BottomNav } from '@/components/ui/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div className="flex h-screen bg-gingham-subtle dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
            {/* Sidebar Desktop & Mobile Drawer */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Header */}
              <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-3.5 sm:px-5 lg:px-6 flex-shrink-0 z-30 transition-colors duration-200">
                {/* Left: hamburger + search */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0 text-[var(--color-denim)] dark:text-sky-400"
                    aria-label="Open menu"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  {/* Global Search (Hidden on very small screens, visible on md+) */}
                  <div className="hidden md:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-3 py-2 min-w-[240px] lg:min-w-[280px] border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group">
                    <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                      Cari transaksi, iuran, target...
                    </span>
                    <kbd className="ml-auto text-[10px] bg-white dark:bg-slate-700 font-bold rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shadow-2xs">
                      ⌘K
                    </kbd>
                  </div>
                </div>

                {/* Right: theme toggle + notifications + profile */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
                  {/* Standalone 1-Click Dark Mode Toggle */}
                  <ThemeToggle />

                  {/* Notification bell dropdown */}
                  <NotificationDropdown />

                  {/* User Profile Dropdown & Logout Action */}
                  <div className="border-l border-slate-200 dark:border-slate-800 pl-1.5 sm:pl-2.5">
                    <ProfileDropdown />
                  </div>
                </div>
              </header>

              {/* Page Content with dynamic mobile bottom padding */}
              <main className="flex-1 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-3.5 sm:p-5 md:p-6 lg:p-8 pb-28 lg:pb-8 max-w-[1600px] mx-auto w-full"
                >
                  {children}
                </motion.div>
              </main>

              {/* Dynamic Bottom Mobile Navigation Bar */}
              <BottomNav />
            </div>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
