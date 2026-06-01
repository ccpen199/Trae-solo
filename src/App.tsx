import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Doctors from "@/pages/Doctors";
import Institutions from "@/pages/Institutions";
import Scheduling from "@/pages/Scheduling";
import Appointments from "@/pages/Appointments";
import SettlementPage from "@/pages/Settlement";
import Compliance from "@/pages/Compliance";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/settlement" element={<SettlementPage />} />
          <Route path="/compliance" element={<Compliance />} />
        </Route>
      </Routes>
    </Router>
  );
}
