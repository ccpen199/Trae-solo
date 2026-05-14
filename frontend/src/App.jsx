import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import Profile from './pages/Profile.jsx';
import Coupons from './pages/Coupons.jsx';
import GroupDeals from './pages/GroupDeals.jsx';
import FlashSales from './pages/FlashSales.jsx';
import BottomNav from './components/BottomNav.jsx';

function App() {
  return (
    <div style={{ paddingBottom: '60px' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/group-deals" element={<GroupDeals />} />
        <Route path="/flash-sales" element={<FlashSales />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default App;
