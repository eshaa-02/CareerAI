'use client';

import { useState } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export default function AccountSettingsPanel() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await authService.updatePassword(form.currentPassword, form.newPassword);
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage your account.</p>
      </div>

      <Card>
        <h2 className="mb-1 font-semibold text-[var(--text-primary)]">Account</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {user?.name} · {user?.email}
        </p>

        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <KeyRound className="h-4 w-4" /> Change Password
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            placeholder="Current password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (min. 8 characters)"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full rounded-xl px-4 py-2.5 text-sm"
          />
          <Button type="submit" loading={saving}>
            Update Password
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-[var(--text-primary)]">Session</h2>
        <Button variant="danger" onClick={logout} icon={<LogOut className="h-4 w-4" />}>
          Log out
        </Button>
      </Card>
    </div>
  );
}
