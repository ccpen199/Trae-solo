import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import Contracts from "@/pages/Contracts";
import Revenues from "@/pages/Revenues";
import Decisions from "@/pages/Decisions";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/revenues" element={<Revenues />} />
          <Route path="/decisions" element={<Decisions />} />
        </Route>
      </Routes>
    </Router>
  );
}
