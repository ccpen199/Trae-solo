import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

const CACHE_VERSION = 'v4_20250620_login_fix'
const PREFIX = 'app_'
try {
  const stored = localStorage.getItem(PREFIX + 'cache_version')
  if (stored !== JSON.stringify(CACHE_VERSION)) {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
    localStorage.setItem(PREFIX + 'cache_version', JSON.stringify(CACHE_VERSION))
  }
} catch {}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const antdTheme = {
  token: {
    colorPrimary: '#3366FF',
    colorInfo: '#3366FF',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    borderRadius: 8,
    fontFamily: '"Noto Sans SC", sans-serif',
  },
  components: {
    Modal: {
      headerBg: 'transparent',
      contentBg: 'rgba(15, 23, 42, 0.95)',
    },
    Drawer: {
      colorBgElevated: 'rgba(15, 23, 42, 0.98)',
    },
    Table: {
      headerBg: 'rgba(51, 102, 255, 0.1)',
      rowHoverBg: 'rgba(255, 255, 255, 0.03)',
      borderColor: 'rgba(148, 163, 184, 0.1)',
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN} theme={antdTheme}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
