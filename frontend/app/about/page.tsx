'use client';

import { motion } from 'framer-motion';
import { Target, Users, Sparkles, Globe2 } from 'lucide-react';
import Card from '@/components/ui/Card';

const VALUES = [
  { icon: Target, title: 'Purpose-driven matching', desc: 'We built our AI matching engine to reduce noise, not add to it — every score is explainable.' },
  { icon: Users, title: 'People first', desc: 'Behind every application is a person. Our platform is designed to respect their time and effort.' },
  { icon: Sparkles, title: 'Continuous innovation', desc: 'From real-time notifications to skill-gap insights, we keep pushing what a job portal can do.' },
  { icon: Globe2, title: 'Global reach', desc: 'Connecting talent and companies across borders, industries, and career stages.' },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">About CareerAI</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-secondary)]">
          CareerAI was founded on a simple idea: job searching and hiring should be driven by genuine fit, not
          keyword luck. We combine AI-powered matching with a premium, transparent experience for candidates and
          employers alike.
        </p>
      </motion.div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2">
        {VALUES.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15">
                <v.icon className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <h3 className="mt-4 font-semibold text-[var(--text-primary)]">{v.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{v.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mt-16 text-center" padding="lg">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Our mission</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
          To make hiring and job searching faster, fairer, and more transparent — for every candidate and every
          company, regardless of size.
        </p>
      </Card>
    </div>
  );
}
