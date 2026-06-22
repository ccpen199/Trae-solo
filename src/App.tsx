import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
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
      </Routes>
    </Router>
  );
}
