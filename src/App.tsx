import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import Home from "@/pages/Home";
import StationMap from "@/pages/StationMap";
import RoutePlan from "@/pages/RoutePlan";
import PlugCharge from "@/pages/PlugCharge";
import ChargingMonitor from "@/pages/ChargingMonitor";
import OrderList from "@/pages/OrderList";
import Login from "@/pages/Login";
import V2G from "@/pages/V2G";
import Community from "@/pages/Community";
import AdminDashboard from "@/pages/admin/Dashboard";
import Settlement from "@/pages/admin/Settlement";
import Revenue from "@/pages/admin/Revenue";
import UserProfile from "@/pages/admin/UserProfile";
import CommunityReview from "@/pages/admin/CommunityReview";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<StationMap />} />
          <Route path="/route-plan" element={<RoutePlan />} />
          <Route path="/plug-charge" element={<PlugCharge />} />
          <Route path="/charging-monitor" element={<ChargingMonitor />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/v2g" element={<V2G />} />
          <Route path="/community" element={<Community />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/settlement" element={<Settlement />} />
          <Route path="/admin/revenue" element={<Revenue />} />
          <Route path="/admin/user-profile" element={<UserProfile />} />
          <Route path="/admin/community-review" element={<CommunityReview />} />
        </Route>
      </Routes>
    </Router>
  );
}
