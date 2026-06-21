import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SeatManagement from "@/pages/assets/SeatManagement";
import RoomManagement from "@/pages/assets/RoomManagement";
import DeviceManagement from "@/pages/assets/DeviceManagement";
import BookingPage from "@/pages/booking/BookingPage";
import HotelBookings from "@/pages/hotel/HotelBookings";
import MemberList from "@/pages/members/MemberList";
import MemberLevels from "@/pages/members/MemberLevels";
import ExchangeCenter from "@/pages/members/ExchangeCenter";
import IotMonitor from "@/pages/iot/IotMonitor";
import AlertCenter from "@/pages/iot/AlertCenter";
import Tournaments from "@/pages/events/Tournaments";
import LiveStreams from "@/pages/events/LiveStreams";
import Teams from "@/pages/events/Teams";
import ProductManagement from "@/pages/mall/ProductManagement";
import MallOrders from "@/pages/mall/MallOrders";
import StoreManagement from "@/pages/settings/StoreManagement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets/seats" element={<SeatManagement />} />
          <Route path="assets/rooms" element={<RoomManagement />} />
          <Route path="assets/devices" element={<DeviceManagement />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="hotel/bookings" element={<HotelBookings />} />
          <Route path="members/list" element={<MemberList />} />
          <Route path="members/levels" element={<MemberLevels />} />
          <Route path="members/exchange" element={<ExchangeCenter />} />
          <Route path="iot/monitor" element={<IotMonitor />} />
          <Route path="iot/alerts" element={<AlertCenter />} />
          <Route path="events/tournaments" element={<Tournaments />} />
          <Route path="events/live" element={<LiveStreams />} />
          <Route path="events/teams" element={<Teams />} />
          <Route path="mall/products" element={<ProductManagement />} />
          <Route path="mall/orders" element={<MallOrders />} />
          <Route path="settings/stores" element={<StoreManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
