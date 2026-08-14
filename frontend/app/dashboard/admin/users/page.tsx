'use client';

import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import { User } from '@/types';
import { getInitials, timeAgo } from '@/utils/helpers';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    adminService
      .getUsers({ role: role || undefined, search: search || undefined })
      .then((res) => setUsers(res.users))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleToggleSuspend = async (id: string) => {
    try {
      await adminService.toggleSuspendUser(id);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Users Management</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{users.length} users</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="glass-card flex flex-1 items-center gap-2 rounded-xl px-3 py-1">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="w-full rounded-xl px-2 py-2 text-sm" />
        </form>
        <div className="flex gap-2">
          {['', 'candidate', 'employer', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-colors ${
                role === r ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]' : 'glass-card text-[var(--text-secondary)]'
              }`}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u._id} padding="sm" hover={false}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/15 text-xs font-bold text-[var(--accent-primary)]">
                    {getInitials(u.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{u.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {u.email} · Joined {timeAgo(u.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--bg-card-alt)] px-2.5 py-1 text-xs capitalize text-[var(--text-secondary)]">{u.role}</span>
                  {u.isSuspended && <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-400">Suspended</span>}
                  <Button size="sm" variant="secondary" onClick={() => handleToggleSuspend(u._id)} icon={u.isSuspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}>
                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                  <button onClick={() => handleDelete(u._id)} className="text-[var(--text-muted)] hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
