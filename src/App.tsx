import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Communities from "@/pages/Communities";
import Properties from "@/pages/Properties";
import Agents from "@/pages/Agents";
import AiCards from "@/pages/AiCards";
import Mortgage from "@/pages/Mortgage";
import Delegations from "@/pages/Delegations";
import Xiangyu from "@/pages/Xiangyu";
import Collaboration from "@/pages/Collaboration";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/ai-cards" element={<AiCards />} />
          <Route path="/mortgage" element={<Mortgage />} />
          <Route path="/delegations" element={<Delegations />} />
          <Route path="/xiangyu" element={<Xiangyu />} />
          <Route path="/collaboration" element={<Collaboration />} />
          <Route path="/verification" element={<Collaboration />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </Router>
  );
}
