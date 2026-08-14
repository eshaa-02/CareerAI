'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export default function ResetPasswordPage() {
  const { resetToken } = useParams<{ resetToken: string }>();
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { token } = await authService.resetPassword(resetToken, password);
      Cookies.set('token', token, { expires: 7 });
      await refreshUser();
      toast.success('Password reset — you are now logged in.');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'This reset link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-glow to-emerald-deep shadow-glow">
            <Sparkles className="h-6 w-6 text-dark-bg" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">Set a new password</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose a strong password for your account.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">New Password</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border-none bg-transparent p-0 text-sm outline-none"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Confirm New Password</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full border-none bg-transparent p-0 text-sm outline-none"
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Reset Password
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Remembered it after all?{' '}
          <Link href="/login" className="font-semibold text-[var(--accent-primary)]">
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
