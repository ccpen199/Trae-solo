import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from '@/pages/Home'
import LiveList from '@/pages/LiveList'
import LiveRoom from '@/pages/LiveRoom'
import PropertyList from '@/pages/PropertyList'
import PropertyDetail from '@/pages/PropertyDetail'
import Renovation from '@/pages/Renovation'
import QuoteCompare from '@/pages/QuoteCompare'
import ContentList from '@/pages/ContentList'
import ContentDetail from '@/pages/ContentDetail'
import Profile from '@/pages/Profile'
import Admin from '@/pages/Admin'
import Search from '@/pages/Search'
import Dashboard from '@/pages/Dashboard'
import RenovationCompanyDetail from '@/pages/RenovationCompanyDetail'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LoginModal from '@/components/LoginModal'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function AppContent() {
  const location = useLocation()
  const isLiveRoom = location.pathname.startsWith('/live/')

  return (
    <div className="flex flex-col min-h-screen">
      {!isLiveRoom && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live" element={<LiveList />} />
          <Route path="/live/:id" element={<LiveRoom />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/renovation" element={<Renovation />} />
          <Route path="/renovation/company/:id" element={<RenovationCompanyDetail />} />
          <Route path="/renovation/quote-compare" element={<QuoteCompare />} />
          <Route path="/materials" element={<QuoteCompare />} />
          <Route path="/content" element={<ContentList />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isLiveRoom && <Footer />}
      <LoginModal />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  )
}
