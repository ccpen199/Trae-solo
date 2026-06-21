import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/Home";
import GridPage from "@/pages/GridPage";
import ExperienceIndex from "@/pages/ExperienceIndex";
import ExperienceDetail from "@/pages/ExperienceDetail";
import DemandPage from "@/pages/DemandPage";
import GrowthPage from "@/pages/GrowthPage";
import DisputePage from "@/pages/DisputePage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-warm-bg font-sans">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/grid" element={<GridPage />} />
          <Route path="/experience" element={<ExperienceIndex />} />
          <Route path="/experience/:type" element={<ExperienceIndex />} />
          <Route path="/experience/detail/:id" element={<ExperienceDetail />} />
          <Route path="/demand" element={<DemandPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/dispute" element={<DisputePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
