import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Verification from "@/pages/Verification";
import Packages from "@/pages/Packages";
import Appointments from "@/pages/Appointments";
import Refunds from "@/pages/Refunds";
import Merchant from "@/pages/Merchant";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/merchant" element={<Merchant />} />
        </Routes>
      </Layout>
    </Router>
  );
}
