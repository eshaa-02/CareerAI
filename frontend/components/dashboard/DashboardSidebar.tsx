'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, User, FileText, Sparkles, Briefcase, Bookmark, MessageSquare,
  Bell, Settings, Building2, PlusCircle, Users, BarChart3, ShieldCheck, Newspaper,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { UserRole } from '@/types';

const SIDEBAR_CONFIG: Record<UserRole, { label: string; href: string; icon: typeof User }[]> = {
  candidate: [
    { label: 'Dashboard', href: '/dashboard/candidate', icon: LayoutDashboard },
    { label: 'My Profile', href: '/dashboard/candidate/profile', icon: User },
    { label: 'Resume', href: '/dashboard/candidate/resume', icon: FileText },
    { label: 'AI Matching', href: '/dashboard/candidate/matching', icon: Sparkles },
    { label: 'Applied Jobs', href: '/dashboard/candidate/applications', icon: Briefcase },
    { label: 'Interviews', href: '/dashboard/candidate/interviews', icon: CalendarClock },
    { label: 'Saved Jobs', href: '/dashboard/candidate/saved', icon: Bookmark },
    { label: 'Messages', href: '/dashboard/candidate/messages', icon: MessageSquare },
    { label: 'Settings', href: '/dashboard/candidate/settings', icon: Settings },
  ],
  employer: [
    { label: 'Dashboard', href: '/dashboard/employer', icon: LayoutDashboard },
    { label: 'Company Profile', href: '/dashboard/employer/company', icon: Building2 },
    { label: 'Post Job', href: '/dashboard/employer/post-job', icon: PlusCircle },
    { label: 'Manage Jobs', href: '/dashboard/employer/jobs', icon: Briefcase },
    { label: 'Applicants', href: '/dashboard/employer/applicants', icon: Users },
    { label: 'Interviews', href: '/dashboard/employer/interviews', icon: CalendarClock },
    { label: 'Messages', href: '/dashboard/employer/messages', icon: MessageSquare },
    { label: 'Analytics', href: '/dashboard/employer/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard/employer/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Users Management', href: '/dashboard/admin/users', icon: Users },
    { label: 'Employers', href: '/dashboard/admin/employers', icon: Building2 },
    { label: 'Jobs Management', href: '/dashboard/admin/jobs', icon: Newspaper },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: ShieldCheck },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    { label: 'System Settings', href: '/dashboard/admin/settings', icon: Settings },
  ],
};

export default function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = SIDEBAR_CONFIG[role];

  return (
    <aside className="glass-card sticky top-24 hidden h-[calc(100vh-7rem)] w-64 shrink-0 flex-col rounded-2xl p-4 lg:flex">
      <div className="flex items-center gap-2 px-2 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-glow to-emerald-deep">
          <Sparkles className="h-4 w-4 text-dark-bg" />
        </div>
        <span className="font-display text-sm font-bold gradient-text">CareerAI</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-[var(--accent-primary)]/15"
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}
              <div
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
