import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import Member from '@/pages/Member'
import Merchant from '@/pages/Merchant'
import Scenarios from '@/pages/Scenarios'
import { ToastProvider } from '@/components/Toast'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/member" element={<Member />} />
            <Route path="/merchant" element={<Merchant />} />
            <Route path="/scenarios" element={<Scenarios />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
