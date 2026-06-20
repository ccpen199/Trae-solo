import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import PropertyList from "@/pages/PropertyList";
import PropertyDetail from "@/pages/PropertyDetail";
import Compare from "@/pages/Compare";
import AuctionCenter from "@/pages/AuctionCenter";
import DueDiligence from "@/pages/DueDiligence";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/list" element={<PropertyList />} />
          <Route path="/detail/:id" element={<PropertyDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/auction" element={<AuctionCenter />} />
          <Route path="/due-diligence" element={<DueDiligence />} />
        </Route>
      </Routes>
    </Router>
  );
}
