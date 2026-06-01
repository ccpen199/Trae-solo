import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Halls from "@/pages/Halls";
import Bookings from "@/pages/Bookings";
import Sales from "@/pages/Sales";
import Contracts from "@/pages/Contracts";
import Execution from "@/pages/Execution";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/halls" element={<Halls />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/execution" element={<Execution />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
