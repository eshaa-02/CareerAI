'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, Building2, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/utils/helpers';

export default function RegisterPage() {
  const { register } = useAuth();
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
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
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Join CareerAI in seconds</p>
        </div>

        <Card>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                role === 'candidate'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-color)]'
              )}
            >
              <UserCircle className="h-5 w-5 text-[var(--accent-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">I&apos;m a Candidate</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                role === 'employer'
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-color)]'
              )}
            >
              <Building2 className="h-5 w-5 text-[var(--accent-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">I&apos;m an Employer</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Full Name</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                <User className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full border-none bg-transparent p-0 text-sm outline-none"
                />
              </div>
            </div>

            {role === 'employer' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Company Name</label>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                  <Building2 className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <input
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Acme Inc."
                    className="w-full border-none bg-transparent p-0 text-sm outline-none"
                  />
                </div>
              </div>
            )}

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
              <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Password</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                <Lock className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full border-none bg-transparent p-0 text-sm outline-none"
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create Account
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[var(--accent-primary)]">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
