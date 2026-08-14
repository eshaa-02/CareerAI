'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: string; // ISO date
  targetTime: string; // "HH:mm"
}

function getTimeParts(targetDate: string, targetTime: string) {
  const target = new Date(targetDate);
  const [hours, minutes] = targetTime.split(':').map(Number);
  target.setHours(hours || 0, minutes || 0, 0, 0);

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ targetDate, targetTime }: CountdownTimerProps) {
  const [parts, setParts] = useState(() => getTimeParts(targetDate, targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setParts(getTimeParts(targetDate, targetTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  if (!parts) {
    return <span className="text-sm font-semibold text-[var(--accent-primary)]">Starting now</span>;
  }

  const units = [
    { label: 'Days', value: parts.days },
    { label: 'Hrs', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Sec', value: parts.seconds },
  ];

  return (
    <div className="flex gap-2">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <motion.div
            key={u.value}
            initial={{ opacity: 0.4, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-primary)]/15 text-sm font-bold text-[var(--accent-primary)]"
          >
            {String(u.value).padStart(2, '0')}
          </motion.div>
          <span className="mt-1 text-[10px] text-[var(--text-muted)]">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
