import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Home from "@/pages/Home"
import Vessels from "@/pages/Vessels"
import VesselForm from "@/pages/VesselForm"
import VesselDetail from "@/pages/VesselDetail"
import Declarations from "@/pages/Declarations"
import DeclarationForm from "@/pages/DeclarationForm"
import DeclarationDetail from "@/pages/DeclarationDetail"
import Monitor from "@/pages/Monitor"
import Events from "@/pages/Events"
import EventForm from "@/pages/EventForm"
import EventDetail from "@/pages/EventDetail"
import Reports from "@/pages/Reports"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/vessels" element={<Vessels />} />
          <Route path="/vessels/new" element={<VesselForm />} />
          <Route path="/vessels/:id" element={<VesselDetail />} />
          <Route path="/declarations" element={<Declarations />} />
          <Route path="/declarations/new" element={<DeclarationForm />} />
          <Route path="/declarations/:id" element={<DeclarationDetail />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  )
}
