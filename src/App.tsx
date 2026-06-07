import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import ShopDashboard from "@/pages/ShopDashboard";
import ShopInventory from "@/pages/ShopInventory";
import ShopException from "@/pages/ShopException";
import DispatchCenter from "@/pages/DispatchCenter";
import DispatchClaims from "@/pages/DispatchClaims";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/shop" element={<ShopDashboard />} />
        <Route path="/shop/inventory" element={<ShopInventory />} />
        <Route path="/shop/exception" element={<ShopException />} />
        <Route path="/dispatch" element={<DispatchCenter />} />
        <Route path="/dispatch/center" element={<DispatchCenter />} />
        <Route path="/dispatch/claims" element={<DispatchClaims />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
