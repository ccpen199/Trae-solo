import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import News from "@/pages/News";
import NewsDetail from "@/pages/NewsDetail";
import Circles from "@/pages/Circles";
import CircleDetail from "@/pages/CircleDetail";
import CircleCreate from "@/pages/CircleCreate";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import EventCreate from "@/pages/EventCreate";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import MerchantApply from "@/pages/MerchantApply";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Match from "@/pages/Match";
import MatchProfile from "@/pages/MatchProfile";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/circles" element={<Circles />} />
          <Route path="/circles/create" element={<CircleCreate />} />
          <Route path="/circles/:id" element={<CircleDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/create" element={<EventCreate />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ProductDetail />} />
          <Route path="/shop/merchant/apply" element={<MerchantApply />} />
          <Route path="/shop/orders" element={<Orders />} />
          <Route path="/shop/orders/:id" element={<OrderDetail />} />
          <Route path="/match" element={<Match />} />
          <Route path="/match/profile" element={<MatchProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/other" element={<div className="text-center text-xl py-20">Coming Soon</div>} />
          <Route path="*" element={<div className="text-center text-xl py-20 text-warm-400">页面不存在</div>} />
        </Route>
      </Routes>
    </Router>
  );
}
