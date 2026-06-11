import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Publish from "@/pages/Publish";
import TaskDetail from "@/pages/TaskDetail";
import Profile from "@/pages/Profile";
import ProfileHistory from "@/pages/ProfileHistory";
import ProfileVerify from "@/pages/ProfileVerify";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/history" element={<ProfileHistory />} />
          <Route path="/profile/verify" element={<ProfileVerify />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </Router>
  );
}
