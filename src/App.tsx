import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/admin/AdminLayout";
import Home from "@/pages/Home";
import Category from "@/pages/Category";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import Search from "@/pages/Search";
import Publish from "@/pages/Publish";
import MerchantDetail from "@/pages/MerchantDetail";
import MerchantDashboard from "@/pages/MerchantDashboard";
import Services from "@/pages/Services";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";

import AdminOverview from "@/pages/admin/Overview";
import AdminMerchants from "@/pages/admin/Merchants";
import AdminNews from "@/pages/admin/News";
import AdminPosts from "@/pages/admin/Posts";
import AdminAudit from "@/pages/admin/Audit";
import AdminOrders from "@/pages/admin/Orders";
import AdminOrderDetail from "@/pages/admin/OrderDetail";
import AdminDistribution from "@/pages/admin/Distribution";
import AdminServices from "@/pages/admin/Services";
import AdminRiders from "@/pages/admin/Riders";
import AdminDelivery from "@/pages/admin/Delivery";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/category" element={<Category />} />
          <Route path="/category/:type" element={<Category />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/merchant/:id" element={<MerchantDetail />} />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="merchants" element={<AdminMerchants />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="distribution" element={<AdminDistribution />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="riders" element={<AdminRiders />} />
          <Route path="delivery" element={<AdminDelivery />} />
        </Route>
      </Routes>
    </Router>
  );
}
