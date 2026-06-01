import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Calculator from "@/pages/Calculator";
import HSCodes from "@/pages/HSCodes";
import TaxRules from "@/pages/TaxRules";
import BatchImport from "@/pages/BatchImport";
import History from "@/pages/History";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/hs-codes" element={<HSCodes />} />
          <Route path="/tax-rules" element={<TaxRules />} />
          <Route path="/batch" element={<BatchImport />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </Router>
  );
}
