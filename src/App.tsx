import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import ListingDetail from '@/pages/ListingDetail'
import Appointment from '@/pages/Appointment'
import Contract from '@/pages/Contract'
import Payment from '@/pages/Payment'
import Service from '@/pages/Service'
import Admin from '@/pages/Admin'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/contract" element={<Contract />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/service" element={<Service />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}
