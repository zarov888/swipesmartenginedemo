'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('swipesmart-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('swipesmart-theme', theme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-surface-100 border border-white/10 p-1 transition-colors hover:border-white/20"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ x: theme === 'dark' ? 0 : 24 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          theme === 'dark'
            ? 'bg-accent-purple'
            : 'bg-accent-orange'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-white" />
        ) : (
          <Sun className="w-3 h-3 text-white" />
        )}
      </motion.div>

      {/* Icons on track */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Moon className={`w-3 h-3 transition-opacity ${theme === 'dark' ? 'opacity-0' : 'opacity-30'}`} />
        <Sun className={`w-3 h-3 transition-opacity ${theme === 'dark' ? 'opacity-30' : 'opacity-0'}`} />
      </div>
    </button>
  );
}
