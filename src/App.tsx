import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Home from "@/pages/Home";
import Steps from "@/pages/Steps";
import Video from "@/pages/Video";
import Checkin from "@/pages/Checkin";
import Invite from "@/pages/Invite";
import Wallet from "@/pages/Wallet";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Tasks from "@/pages/admin/Tasks";
import Users from "@/pages/admin/Users";
import Risk from "@/pages/admin/Risk";
import Ads from "@/pages/admin/Ads";

function MobileLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/tasks" element={<Tasks />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/risk" element={<Risk />} />
          <Route path="/admin/ads" element={<Ads />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<MobileLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/steps" element={<Steps />} />
        <Route path="/video" element={<Video />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/wallet" element={<Wallet />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
