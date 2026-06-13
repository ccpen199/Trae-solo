import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import EventDetail from "@/pages/EventDetail";
import QueuePage from "@/pages/QueuePage";
import Orders from "@/pages/Orders";
import TicketDetail from "@/pages/TicketDetail";
import OrganizerDashboard from "@/pages/OrganizerDashboard";
import OrganizerEvents from "@/pages/OrganizerEvents";
import ShowtimeConfig from "@/pages/ShowtimeConfig";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminOrganizers from "@/pages/AdminOrganizers";
import useAuthStore from "@/stores/authStore";

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (token) fetchMe()
  }, [token, fetchMe])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/queue/:showtimeId" element={<QueuePage />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/ticket/:id" element={<TicketDetail />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/organizer/events" element={<OrganizerEvents />} />
        <Route path="/organizer/showtimes/:id" element={<ShowtimeConfig />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/organizers" element={<AdminOrganizers />} />
      </Routes>
    </Router>
  );
}
