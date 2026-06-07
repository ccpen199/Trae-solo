import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
  components: {
    Layout: {
      siderBg: '#1a3a5c',
      headerBg: '#0d2b45',
    },
    Menu: {
      darkItemBg: '#1a3a5c',
      darkSubMenuItemBg: '#15324f',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: '#1e4a73',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={theme} locale={zhCN}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
