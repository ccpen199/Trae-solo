import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CitizenCode from './pages/CitizenCode'
import Verification from './pages/Verification'
import CardLifecycle from './pages/CardLifecycle'
import ServiceHub from './pages/ServiceHub'
import Operations from './pages/Operations'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="qrcode" element={<CitizenCode />} />
          <Route path="verify" element={<Verification />} />
          <Route path="cards" element={<CardLifecycle />} />
          <Route path="services" element={<ServiceHub />} />
          <Route path="operations" element={<Operations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
