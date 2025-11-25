'use client';

import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useState, useEffect } from 'react';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [themeState, setThemeState] = useState<'dark' | 'light'>('dark');
  
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setThemeState(theme);
  }, [theme]);

  const handleToggle = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    toggleTheme();
  };

  return (
    <header className="w-full bg-linear-to-b from-gray-900 to-black dark:from-gray-900 dark:to-black border-b border-gray-800 dark:border-gray-800 shadow-lg transition-colors">
      <div className="container mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-700 dark:from-blue-500 dark:to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
            B
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white dark:text-white">Project Bayani</h1>
            <p className="text-xs md:text-sm text-gray-400 dark:text-gray-400">Real-time Monitoring Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && themeState === 'dark' ? (
              <Sun size={24} className="text-yellow-400" />
            ) : (
              <Moon size={24} className="text-gray-600" />
            )}
          </button>
          <button className="lg:hidden p-2 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Menu size={24} className="text-gray-300 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
