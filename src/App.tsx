import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import DriverHome from "@/pages/driver/DriverHome";
import DriverOrders from "@/pages/driver/DriverOrders";
import DriverOrderDetail from "@/pages/driver/DriverOrderDetail";
import DriverWallet from "@/pages/driver/DriverWallet";
import DriverStations from "@/pages/driver/DriverStations";
import DriverTrack from "@/pages/driver/DriverTrack";
import DriverProfile from "@/pages/driver/DriverProfile";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/driver/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/driver/home" element={<DriverHome />} />
        <Route path="/driver/orders" element={<DriverOrders />} />
        <Route path="/driver/orders/:id" element={<DriverOrderDetail />} />
        <Route path="/driver/wallet" element={<DriverWallet />} />
        <Route path="/driver/stations" element={<DriverStations />} />
        <Route path="/driver/track" element={<DriverTrack />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route
          path="/other"
          element={<div className="text-center text-xl">Other Page - Coming Soon</div>}
        />
      </Routes>
    </Router>
  );
}
