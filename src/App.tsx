import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import Home from "@/pages/Home"
import Services from "@/pages/Services"
import Assistant from "@/pages/Assistant"
import Profile from "@/pages/Profile"
import Feedback from "@/pages/Feedback"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="/services" element={<ErrorBoundary><Services /></ErrorBoundary>} />
          <Route path="/search" element={<ErrorBoundary><Services /></ErrorBoundary>} />
          <Route path="/assistant" element={<ErrorBoundary><Assistant /></ErrorBoundary>} />
          <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="/feedback" element={<ErrorBoundary><Feedback /></ErrorBoundary>} />
        </Route>
      </Routes>
    </Router>
  )
}
