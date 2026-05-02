import React from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { 
  MainLayout, 
  DashboardPage, 
  DeclarationsPage, 
  TodosPage, 
  ExceptionsPage, 
  MessagesPage,
  DeclarationDetailPage
} from '@/pages'

const DeclarationDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return id ? <DeclarationDetailPage id={id} /> : null
}

const AppRoutes: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/declarations" element={<DeclarationsPage />} />
        <Route path="/declarations/:id" element={<DeclarationDetailWrapper />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/exceptions" element={<ExceptionsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
      </Routes>
    </MainLayout>
  )
}

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 4,
      },
    }}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
