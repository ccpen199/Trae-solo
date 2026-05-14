import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import LostFound from './pages/LostFound'
import SecondHand from './pages/SecondHand'
import Errands from './pages/Errands'
import Experience from './pages/Experience'
import Stations from './pages/Stations'
import Profile from './pages/Profile'
import PostDetail from './pages/PostDetail'

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/secondhand" element={<SecondHand />} />
          <Route path="/errands" element={<Errands />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}
