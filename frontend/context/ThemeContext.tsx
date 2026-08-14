'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('careerai-theme') as Theme | null;

    const preferred: Theme =
      stored ||
      (window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark');

    setThemeState(preferred);

    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(preferred);
  }, []);

  const applyTheme = (next: Theme) => {
    document.documentElement.style.transition =
      'background-color 0.4s ease, color 0.4s ease';

    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);

    localStorage.setItem('careerai-theme', next);
    setThemeState(next);
  };

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (next: Theme) => {
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}