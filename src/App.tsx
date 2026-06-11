import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Market from '@/pages/Market'
import Match from '@/pages/Match'
import IndustryMap from '@/pages/IndustryMap'
import Orders from '@/pages/Orders'
import SupplierDetail from '@/pages/SupplierDetail'
import News from '@/pages/News'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/match" element={<Match />} />
          <Route path="/map" element={<IndustryMap />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/supplier/:id" element={<SupplierDetail />} />
          <Route path="/news" element={<News />} />
        </Route>
      </Routes>
    </Router>
  )
}
