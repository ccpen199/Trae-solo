import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import Login from './pages/Login'
import Home from './pages/Home'
import Search from './pages/Search'
import Category from './pages/Category'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderDetail from './pages/OrderDetail'
import GroupBuy from './pages/GroupBuy'
import Community from './pages/Community'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import OrderList from './pages/OrderList'
import PublishPost from './pages/PublishPost'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'

function App() {
  const restoreAuth = useStore((state) => state.restoreAuth)
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const location = useLocation()
  
  useEffect(() => {
    restoreAuth()
  }, [restoreAuth])
  
  const showBottomNav = [
    '/',
    '/category',
    '/community',
    '/profile'
  ].includes(location.pathname)
  
  const noAuthPages = ['/login', '/group-buy']
  
  useEffect(() => {
    if (!isAuthenticated && !noAuthPages.some(p => location.pathname.startsWith(p))) {
      // ProtectedRoute will handle this
    }
  }, [isAuthenticated, location.pathname])
  
  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/group-buy/:id" element={<GroupBuy />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="/search" element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } />
        
        <Route path="/category" element={
          <ProtectedRoute>
            <Category />
          </ProtectedRoute>
        } />
        
        <Route path="/product/:id" element={
          <ProtectedRoute>
            <ProductDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <OrderList />
          </ProtectedRoute>
        } />
        
        <Route path="/order/:id" element={
          <ProtectedRoute>
            <OrderDetail />
          </ProtectedRoute>
        } />
        
        <Route path="/community" element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        } />
        
        <Route path="/publish" element={
          <ProtectedRoute>
            <PublishPost />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {showBottomNav && <BottomNav />}
    </div>
  )
}

export default App
