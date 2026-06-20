import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import Designers from "@/pages/Designers";
import DesignerDetail from "@/pages/DesignerDetail";
import Calculator from "@/pages/Calculator";
import Favorites from "@/pages/Favorites";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import { useAppStore } from '@/hooks/useAppStore'

export default function App() {
  const { currentUserId, initFavorites } = useAppStore()

  useEffect(() => {
    initFavorites(currentUserId)
  }, [currentUserId, initFavorites])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/designers" element={<Designers />} />
        <Route path="/designers/:id" element={<DesignerDetail />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:section" element={<Profile />} />
      </Routes>
    </Router>
  );
}
