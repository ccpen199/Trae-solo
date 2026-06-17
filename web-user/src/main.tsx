import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import App from './App'
import './index.css'

const theme = {
  token: {
    colorPrimary: '#165DFF',
    colorSuccess: '#00B42A',
    colorWarning: '#FF7D00',
    colorError: '#F53F3F',
    colorInfo: '#165DFF',
    borderRadius: 6,
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN} theme={theme}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
