import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

const themeConfig = {
  token: {
    colorPrimary: '#0052D9',
    colorInfo: '#0052D9',
    colorSuccess: '#00B42A',
    colorWarning: '#FF7D00',
    colorError: '#F53F3F',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#0052D9',
      colorPrimaryHover: '#1C6DE8',
      colorPrimaryActive: '#003DA8',
    },
    Input: {
      colorPrimary: '#0052D9',
      colorPrimaryHover: '#1C6DE8',
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
