import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import App from './App.jsx'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1890ff' } }}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>
)
