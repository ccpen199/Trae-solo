import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import StoreHall from "@/pages/StoreHall";
import StoreDetail from "@/pages/StoreDetail";
import SmartMatch from "@/pages/SmartMatch";
import SmartPricing from "@/pages/SmartPricing";
import Knowledge from "@/pages/Knowledge";
import KnowledgeDetail from "@/pages/KnowledgeDetail";
import BrokerCenter from "@/pages/BrokerCenter";
import RiskEngine from "@/pages/RiskEngine";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/storehall" element={<StoreHall />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/match" element={<SmartMatch />} />
          <Route path="/pricing" element={<SmartPricing />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
          <Route path="/broker" element={<BrokerCenter />} />
          <Route path="/risk" element={<RiskEngine />} />
        </Routes>
      </Layout>
    </Router>
  );
}
