import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import VideoPage from './pages/VideoPage'
import VideoDetailPage from './pages/VideoDetailPage'
import CartPage from './pages/CartPage'
import UserPage from './pages/UserPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SettlementPage from './pages/SettlementPage'
import OrderListPage from './pages/OrderListPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AddressPage from './pages/AddressPage'
import SearchPage from './pages/SearchPage'

const navPaths = ['/', '/category', '/video', '/cart', '/user']

function App() {
  const location = useLocation()
  const showBottomNav = navPaths.includes(location.pathname)
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/video/:videoId" element={<VideoDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/settlement" element={<SettlementPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/order/:orderId" element={<OrderDetailPage />} />
        <Route path="/addresses" element={<AddressPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
      
      {showBottomNav && <BottomNav />}
    </div>
  )
}

export default App
