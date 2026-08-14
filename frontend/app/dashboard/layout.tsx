'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { UserRole } from '@/types';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    // Guard: prevent a candidate viewing /dashboard/employer/* and vice versa
    const segments = pathname.split('/');
    const routeRole = segments[2] as UserRole | undefined;
    if (routeRole && routeRole !== user.role) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardSidebar role={user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
