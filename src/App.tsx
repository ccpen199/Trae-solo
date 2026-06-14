import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Certificates from "@/pages/Certificates";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import JointService from "@/pages/JointService";
import Life from "@/pages/Life";
import Monitor from "@/pages/Monitor";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/services/joint" element={<JointService />} />
          <Route path="/life" element={<Life />} />
          <Route path="/monitor" element={<Monitor />} />
        </Routes>
      </Layout>
    </Router>
  );
}
