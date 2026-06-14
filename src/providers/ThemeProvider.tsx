import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeContextType {
  mode: ThemeMode;
  actualTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultMode = 'auto' }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode') as ThemeMode | null;
    return saved || defaultMode;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const actualTheme = isDark ? 'dark' : 'light';

  const updateThemeClass = useCallback((dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(dark);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);

    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        updateThemeClass(e.matches);
      };

      updateThemeClass(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      updateThemeClass(mode === 'dark');
    }
  }, [mode, updateThemeClass]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    if (mode === 'auto') {
      setModeState(isDark ? 'light' : 'dark');
    } else {
      setModeState(mode === 'light' ? 'dark' : 'light');
    }
  }, [mode, isDark]);

  const value: ThemeContextType = {
    mode,
    actualTheme,
    setMode,
    toggleTheme,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
