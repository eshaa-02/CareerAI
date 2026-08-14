'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      // The backend deliberately returns the same success response whether
      // or not the email exists, so this UI can't leak account existence.
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
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
          <h1 className="mt-4 font-display text-2xl font-bold text-[var(--text-primary)]">Reset your password</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        <Card>
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-[var(--accent-primary)]" />
              <h3 className="mt-4 font-semibold text-[var(--text-primary)]">Check your email</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                If an account exists for <span className="font-medium text-[var(--text-primary)]">{email}</span>, a
                reset link is on its way. The link expires in 10 minutes.
              </p>
              <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
                Try a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Email</label>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border-none bg-transparent p-0 text-sm outline-none"
                  />
                </div>
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </Card>

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      </motion.div>
    </div>
  );
}
