'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import Button from '@/components/ui/Button';
import { cn, getInitials } from '@/utils/helpers';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '/companies' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-glow to-emerald-deep shadow-glow">
            <Sparkles className="h-5 w-5 text-dark-bg" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">CareerAI</span>
        </Link>

        {/* Center nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {!loading && !user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {!loading && user && (
            <>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--accent-primary)]/10 text-sm font-bold text-[var(--accent-primary)]"
                >
                  {user.avatar?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(user.name)
                  )}
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="glass-card absolute right-0 top-12 w-56 rounded-2xl p-2"
                    >
                      <div className="border-b border-[var(--border-color)] px-3 py-2">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.name}</p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                      <Link
                        href={`/dashboard/${user.role}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-alt)]"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <Link
                        href={`/dashboard/${user.role}/profile`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-alt)]"
                      >
                        <UserIcon className="h-4 w-4" /> My Profile
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border-color)] lg:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-alt)]"
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="mt-2 flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="secondary" size="sm" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="primary" size="sm" fullWidth>
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
