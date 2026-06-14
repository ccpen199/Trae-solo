import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Inspiration from "@/pages/Inspiration";
import Design from "@/pages/Design";
import Construction from "@/pages/Construction";
import Materials from "@/pages/Materials";
import Inspection from "@/pages/Inspection";
import Blockchain from "@/pages/Blockchain";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/inspiration" element={<Inspiration />} />
          <Route path="/design" element={<Design />} />
          <Route path="/construction" element={<Construction />} />
          <Route path="/construction/detail" element={<Construction />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/inspection" element={<Inspection />} />
          <Route path="/blockchain" element={<Blockchain />} />
        </Route>
      </Routes>
    </Router>
  );
}
