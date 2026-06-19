import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PortalHome from "@/pages/PortalHome";
import UserLayout from "@/components/user/UserLayout";
import AdminLayout from "@/components/admin/AdminLayout";

import UserHome from "@/pages/user/Home";
import UserEstimate from "@/pages/user/Estimate";
import UserBooking from "@/pages/user/Booking";
import UserOrders from "@/pages/user/Orders";
import UserOrderDetail from "@/pages/user/OrderDetail";
import UserProfile from "@/pages/user/Profile";
import UserDonation from "@/pages/user/Donation";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminQualityList from "@/pages/admin/QualityList";
import AdminQualityDetail from "@/pages/admin/QualityDetail";
import AdminPricingList from "@/pages/admin/PricingList";
import AdminPricingEdit from "@/pages/admin/PricingEdit";
import AdminPayout from "@/pages/admin/Payout";
import AdminLogistics from "@/pages/admin/Logistics";
import AdminProcessors from "@/pages/admin/Processors";
import AdminAnalytics from "@/pages/admin/Analytics";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PortalHome />} />

        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserHome />} />
          <Route path="estimate" element={<UserEstimate />} />
          <Route path="booking" element={<UserBooking />} />
          <Route path="orders" element={<UserOrders />} />
          <Route path="orders/:id" element={<UserOrderDetail />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="donation" element={<UserDonation />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="quality" element={<AdminQualityList />} />
          <Route path="quality/:id" element={<AdminQualityDetail />} />
          <Route path="pricing" element={<AdminPricingList />} />
          <Route path="pricing/:id" element={<AdminPricingEdit />} />
          <Route path="payout" element={<AdminPayout />} />
          <Route path="logistics" element={<AdminLogistics />} />
          <Route path="processors" element={<AdminProcessors />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
