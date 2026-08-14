'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types';
import { timeAgo, cn } from '@/utils/helpers';

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    notificationService
      .getMyNotifications()
      .then((data) => setNotifications(data.notifications))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleClick = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  if (loading) {
    return <div className="skeleton h-64 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Everything that's happened on your account.</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead} icon={<CheckCheck className="h-4 w-4" />}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
          <p className="mt-3 text-[var(--text-muted)]">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n._id} padding="sm" hover={false} className={cn('flex items-start justify-between gap-3', !n.read && 'border-[var(--accent-primary)]/30')}>
              <Link href={n.link || '#'} onClick={() => handleClick(n._id)} className="flex flex-1 items-start gap-3">
                <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', !n.read ? 'bg-[var(--accent-primary)]' : 'bg-transparent')} />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{n.message}</p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">{timeAgo(n.createdAt)}</p>
                </div>
              </Link>
              <button onClick={() => handleDelete(n._id)} className="shrink-0 text-[var(--text-muted)] hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
