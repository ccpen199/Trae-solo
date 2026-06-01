import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Procurements from '@/pages/Procurements'
import Inventory from '@/pages/Inventory'
import Menus from '@/pages/Menus'
import Anomalies from '@/pages/Anomalies'
import Traceability from '@/pages/Traceability'
import Suppliers from '@/pages/Suppliers'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/procurements" element={<Procurements />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="/suppliers" element={<Suppliers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
