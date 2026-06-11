import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import Home from "@/pages/Home"
import Rent from "@/pages/Rent"
import Trade from "@/pages/Trade"
import Valuation from "@/pages/Valuation"
import Recycle from "@/pages/Recycle"
import Insurance from "@/pages/Insurance"
import Preview from "@/pages/Preview"
import Admin from "@/pages/Admin"
import Auth from "@/pages/Auth"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/rent/:id" element={<Rent />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/trade/buy/:id" element={<Trade />} />
          <Route path="/trade/sell" element={<Trade />} />
          <Route path="/valuation" element={<Valuation />} />
          <Route path="/valuation/:id" element={<Valuation />} />
          <Route path="/recycle" element={<Recycle />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/preview/:id" element={<Preview />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
        </Route>
      </Routes>
    </Router>
  )
}
