import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import AIQuote from "@/pages/AIQuote";
import Designers from "@/pages/Designers";
import Construction from "@/pages/Construction";
import SupplyChain from "@/pages/SupplyChain";
import Dispute from "@/pages/Dispute";
import CreditCenter from "@/pages/CreditCenter";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-quote" element={<AIQuote />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/construction" element={<Construction />} />
          <Route path="/supply-chain" element={<SupplyChain />} />
          <Route path="/dispute" element={<Dispute />} />
          <Route path="/credit" element={<CreditCenter />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
