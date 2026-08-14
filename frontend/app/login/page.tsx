'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
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
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Sign in to continue to CareerAI</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Email</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                <Mail className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full border-none bg-transparent p-0 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-[var(--text-primary)]">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-[var(--accent-primary)]">
                  Forgot password?
                </Link>
              </div>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
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

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[var(--accent-primary)]">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
