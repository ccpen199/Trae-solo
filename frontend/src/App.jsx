import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import ArticleList from './pages/ArticleList'
import ArticleDetail from './pages/ArticleDetail'
import HotelList from './pages/HotelList'
import HotelDetail from './pages/HotelDetail'
import HotelBooking from './pages/HotelBooking'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import ConfirmOrder from './pages/ConfirmOrder'
import Community from './pages/Community'
import PostDetail from './pages/PostDetail'
import CreatePost from './pages/CreatePost'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Wallet from './pages/Wallet'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="articles" element={<ArticleList />} />
        <Route path="articles/:id" element={<ArticleDetail />} />
        <Route path="hotels" element={<HotelList />} />
        <Route path="hotels/:id" element={<HotelDetail />} />
        <Route path="hotels/:id/booking" element={<HotelBooking />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="confirm-order" element={<ConfirmOrder />} />
        <Route path="community" element={<Community />} />
        <Route path="community/posts/:id" element={<PostDetail />} />
        <Route path="community/create" element={<CreatePost />} />
        <Route path="profile" element={<Profile />} />
        <Route path="orders" element={<Orders />} />
        <Route path="wallet" element={<Wallet />} />
      </Route>
    </Routes>
  )
}

export default App
