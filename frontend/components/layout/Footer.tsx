'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, ArrowUp, Linkedin, Twitter, Facebook, Instagram, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/jobs' },
    { label: 'Contact', href: '/contact' },
  ],
  Products: [
    { label: 'For Candidates', href: '/register' },
    { label: 'For Employers', href: '/register' },
    { label: 'AI Matching', href: '/about' },
  ],
  Resources: [
    { label: 'Job Search Tips', href: '/jobs' },
    { label: 'Companies', href: '/companies' },
    { label: 'FAQ', href: '/about' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("You're subscribed! We'll keep you posted.");
    setEmail('');
  };

  return (
    <footer className="relative border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-glow to-emerald-deep">
                <Sparkles className="h-5 w-5 text-dark-bg" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">CareerAI</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-[var(--text-secondary)]">
              AI-powered recruitment platform connecting exceptional talent with ambitious companies.
            </p>
            <div className="mt-6 flex gap-3">
              {[Linkedin, Twitter, Facebook, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl glass-card p-6 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">Stay in the loop</h4>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Get curated job matches and hiring insights in your inbox.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full gap-2 sm:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-2.5 text-sm sm:w-64"
            />
            <Button type="submit" size="sm" icon={<Send className="h-4 w-4" />}>
              Subscribe
            </Button>
          </form>
        </div>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
