'use client';

import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
        theme === 'dark'
          ? 'border-emerald-glow/20 bg-white/5 hover:bg-emerald-glow/10'
          : 'border-camel-300 bg-white hover:bg-camel-50'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute"
        >
          {theme === 'dark' ? (
            <Moon className="h-5 w-5 text-emerald-glow" />
          ) : (
            <Sun className="h-5 w-5 text-camel-600" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
