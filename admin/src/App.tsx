import React from 'react'
import { App as AntdApp } from 'antd'
import 'dayjs/locale/zh-cn'
import AppRouter from '@/router'

const App: React.FC = () => {
  return (
    <AntdApp>
      <AppRouter />
    </AntdApp>
  )
}

export default App
