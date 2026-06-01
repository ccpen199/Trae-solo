import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Applications from "@/pages/Applications";
import ApplicationDetail from "@/pages/ApplicationDetail";
import NewApplication from "@/pages/NewApplication";
import Rules from "@/pages/Rules";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/new" element={<NewApplication />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="rules" element={<Rules />} />
        </Route>
      </Routes>
    </Router>
  );
}
