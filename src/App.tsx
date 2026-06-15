import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/theme/antdConfig';
import { useTheme } from '@/hooks/useTheme';
import AppRouter from '@/router/AppRouter';

export default function App() {
  const { isDark } = useTheme();

  return (
    <ThemeProvider darkMode={isDark}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
}
