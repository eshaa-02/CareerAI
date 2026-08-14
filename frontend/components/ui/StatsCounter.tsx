'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

interface CounterProps {
  value: number;
  label: string;
  suffix?: string;
}

function Counter({ value, label, suffix = '' }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => setDisplayValue(Math.round(v)));
    return unsubscribe;
  }, [springValue]);

  return (
    <div className="text-center">
      <span ref={ref} className="gradient-text font-display text-4xl font-bold sm:text-5xl">
        {displayValue.toLocaleString()}
        {suffix}
      </span>
      <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

interface StatsCounterProps {
  stats: { totalJobs: number; totalCompanies: number; totalCandidates: number; totalApplications: number };
}

export default function StatsCounter({ stats }: StatsCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card mx-auto grid max-w-5xl grid-cols-2 gap-8 rounded-3xl p-8 sm:grid-cols-4 sm:p-12"
    >
      <Counter value={stats.totalJobs} label="Active Jobs" suffix="+" />
      <Counter value={stats.totalCompanies} label="Companies" suffix="+" />
      <Counter value={stats.totalCandidates} label="Candidates" suffix="+" />
      <Counter value={stats.totalApplications} label="Applications" suffix="+" />
    </motion.div>
  );
}
