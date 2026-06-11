import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Weather from "@/pages/Weather";
import Calendar from "@/pages/Calendar";
import Health from "@/pages/Health";
import RecipeDetail from "@/pages/RecipeDetail";
import Exercise from "@/pages/Exercise";
import Medication from "@/pages/Medication";
import Family from "@/pages/Family";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/health" element={<Health />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/exercise" element={<Exercise />} />
        <Route path="/medication" element={<Medication />} />
        <Route path="/family" element={<Family />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
