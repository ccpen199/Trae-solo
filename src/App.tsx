import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import JobsList from "@/pages/JobsList";
import JobDetail from "@/pages/JobDetail";
import CreateJob from "@/pages/CreateJob";
import EmployerJobs from "@/pages/EmployerJobs";
import Recommendations from "@/pages/Recommendations";
import AdminDashboard from "@/pages/AdminDashboard";
import MyApplications from "@/pages/MyApplications";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/setup" element={<Profile />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/recommendations" element={<Recommendations />} />
          <Route path="/my/applications" element={<MyApplications />} />
          <Route path="/employer/jobs" element={<EmployerJobs />} />
          <Route path="/employer/jobs/create" element={<CreateJob />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
