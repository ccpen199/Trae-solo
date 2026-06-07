import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import Home from "@/pages/Home";
import NewsList from "@/pages/NewsList";
import NewsDetail from "@/pages/NewsDetail";
import LiveTV from "@/pages/LiveTV";
import Videos from "@/pages/Videos";
import Topics from "@/pages/Topics";
import TopicDetail from "@/pages/TopicDetail";
import Quizzes from "@/pages/Quizzes";
import QuizPlay from "@/pages/QuizPlay";
import GroupBuys from "@/pages/GroupBuys";
import GroupBuyDetail from "@/pages/GroupBuyDetail";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Merchants from "@/pages/Merchants";
import MerchantDetail from "@/pages/MerchantDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import MyOrders from "@/pages/MyOrders";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminNews from "@/pages/admin/News";
import AdminMerchants from "@/pages/admin/Merchants";
import AdminSentiment from "@/pages/admin/Sentiment";
import AdminActivity from "@/pages/admin/Activity";
import AdminUsers from "@/pages/admin/Users";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsList />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/live" element={<LiveTV />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/:id" element={<TopicDetail />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/quizzes/:id/play" element={<QuizPlay />} />
          <Route path="/group-buys" element={<GroupBuys />} />
          <Route path="/group-buys/:id" element={<GroupBuyDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/:id" element={<MerchantDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/merchants" element={<AdminMerchants />} />
          <Route path="/admin/sentiment" element={<AdminSentiment />} />
          <Route path="/admin/activity" element={<AdminActivity />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </Router>
  );
}
