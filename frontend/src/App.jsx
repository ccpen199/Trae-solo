import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import Login from './pages/Login'
import MainLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TransactionList from './pages/transactions/List'
import TransactionDetail from './pages/transactions/Detail'
import TransactionCreate from './pages/transactions/Create'
import TodoList from './pages/Todos'
import MessageList from './pages/Messages'
import AuditLogs from './pages/AuditLogs'
import './App.css'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<TransactionList />} />
        <Route path="transactions/create" element={<TransactionCreate />} />
        <Route path="transactions/:id" element={<TransactionDetail />} />
        <Route path="todos" element={<TodoList />} />
        <Route path="messages" element={<MessageList />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>
    </Routes>
  )
}

export default App
