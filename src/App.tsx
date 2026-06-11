import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Diagnosis from '@/pages/Diagnosis'
import Compare from '@/pages/Compare'
import Live from '@/pages/Live'
import Engineer from '@/pages/Engineer'
import EngineerOrder from '@/pages/EngineerOrder'
import Supplier from '@/pages/Supplier'
import Admin from '@/pages/Admin'
import Discover from '@/pages/Discover'
import Profile from '@/pages/Profile'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/live/:orderId" element={<Live />} />
          <Route path="/engineer" element={<Engineer />} />
          <Route path="/engineer/order/:id" element={<EngineerOrder />} />
          <Route path="/supplier" element={<Supplier />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}
