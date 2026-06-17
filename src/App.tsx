import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Identity from "@/pages/Identity";
import GovOffice from "@/pages/GovOffice";
import SmartTour from "@/pages/SmartTour";
import Livelihood from "@/pages/Livelihood";
import Monitor from "@/pages/Monitor";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/identity" element={<Identity />} />
          <Route path="/gov" element={<GovOffice />} />
          <Route path="/tour" element={<SmartTour />} />
          <Route path="/livelihood" element={<Livelihood />} />
          <Route path="/monitor" element={<Monitor />} />
        </Route>
      </Routes>
    </Router>
  );
}
