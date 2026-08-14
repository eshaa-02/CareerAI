'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSocket } from '@/context/SocketContext';
import { notificationService } from '@/services/notificationService';
import { timeAgo, cn } from '@/utils/helpers';

export default function NotificationBell() {
  const { notifications, unreadCount, setNotifications, setUnreadCount } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService
      .getMyNotifications()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] transition-colors hover:bg-[var(--bg-card-alt)]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-[var(--text-primary)]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="glass-card absolute right-0 top-12 z-50 w-80 rounded-2xl sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <Link
                    key={n._id}
                    href={n.link || '#'}
                    onClick={() => handleNotificationClick(n._id)}
                    className={cn(
                      'flex items-start gap-3 border-b border-[var(--border-color)] p-4 transition-colors last:border-0 hover:bg-[var(--bg-card-alt)]',
                      !n.read && 'bg-[var(--accent-primary)]/5'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        !n.read ? 'bg-[var(--accent-primary)]' : 'bg-transparent'
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{n.message}</p>
                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{timeAgo(n.createdAt)}</p>
                    </div>
                    {n.read && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />}
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
