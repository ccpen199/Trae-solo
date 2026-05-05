import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import UserList from './pages/users/UserList'
import Profile from './pages/users/Profile'
import SupplierList from './pages/suppliers/SupplierList'
import ProductList from './pages/products/ProductList'
import StockInList from './pages/stock/StockInList'
import StockOutList from './pages/stock/StockOutList'
import InventoryList from './pages/inventory/InventoryList'
import InventoryStatistics from './pages/inventory/InventoryStatistics'
import LogList from './pages/logs/LogList'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="users">
          <Route index element={
            <ProtectedRoute requireAdmin>
              <UserList />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="suppliers" element={<SupplierList />} />
        
        <Route path="products" element={<ProductList />} />
        
        <Route path="stock-in" element={<StockInList />} />
        <Route path="stock-out" element={<StockOutList />} />
        
        <Route path="inventory">
          <Route index element={<InventoryList />} />
          <Route path="statistics" element={<InventoryStatistics />} />
        </Route>
        
        <Route path="logs" element={
          <ProtectedRoute requireAdmin>
            <LogList />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App