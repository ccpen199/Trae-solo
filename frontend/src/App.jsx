import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import NewProducts from './pages/NewProducts'
import Crowdfunding from './pages/Crowdfunding'
import Welfare from './pages/Welfare'
import FlashSale from './pages/FlashSale'
import Categories from './pages/Categories'
import ContentList from './pages/ContentList'
import ContentDetail from './pages/ContentDetail'
import ProductDetail from './pages/ProductDetail'
import Search from './pages/Search'
import Supplier from './pages/Supplier'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Profile from './pages/Profile'
import Member from './pages/Member'
import Points from './pages/Points'
import MyCoupons from './pages/MyCoupons'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminChannels from './pages/admin/Channels'
import AdminContents from './pages/admin/Contents'
import AdminCoupons from './pages/admin/Coupons'
import AdminCrowdfunding from './pages/admin/Crowdfunding'
import AdminUsers from './pages/admin/Users'

const ProtectedRoute = ({ children }) => {
  const user = useStore(state => state.user)
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

const AdminProtectedRoute = ({ children }) => {
  const admin = useStore(state => state.admin)
  if (!admin) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewProducts />} />
        <Route path="/crowdfunding" element={<Crowdfunding />} />
        <Route path="/welfare" element={<Welfare />} />
        <Route path="/flash-sale" element={<FlashSale />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/content" element={<ContentList />} />
        <Route path="/content/:id" element={<ContentDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/supplier/:name" element={<Supplier />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <OrderDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/member" element={
          <ProtectedRoute>
            <Member />
          </ProtectedRoute>
        } />
        <Route path="/points" element={
          <ProtectedRoute>
            <Points />
          </ProtectedRoute>
        } />
        <Route path="/coupons" element={
          <ProtectedRoute>
            <MyCoupons />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <AdminProtectedRoute>
            <AdminProducts />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminProtectedRoute>
            <AdminOrders />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/channels" element={
          <AdminProtectedRoute>
            <AdminChannels />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/contents" element={
          <AdminProtectedRoute>
            <AdminContents />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/coupons" element={
          <AdminProtectedRoute>
            <AdminCoupons />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/crowdfunding" element={
          <AdminProtectedRoute>
            <AdminCrowdfunding />
          </AdminProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <AdminProtectedRoute>
            <AdminUsers />
          </AdminProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
