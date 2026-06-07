import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Houses from '@/pages/Houses'
import HouseDetail from '@/pages/HouseDetail'
import HouseForm from '@/pages/HouseForm'
import Clients from '@/pages/Clients'
import ClientDetail from '@/pages/ClientDetail'
import ClientForm from '@/pages/ClientForm'
import Schedule from '@/pages/Schedule'
import ScheduleForm from '@/pages/ScheduleForm'
import Transactions from '@/pages/Transactions'
import TransactionDetail from '@/pages/TransactionDetail'
import TransactionForm from '@/pages/TransactionForm'
import Commissions from '@/pages/Commissions'
import Organization from '@/pages/Organization'
import AuditLogs from '@/pages/AuditLogs'
import Profile from '@/pages/Profile'
import ProtectedRoute from '@/components/Layout/ProtectedRoute'
import ProtectedLayout from '@/components/Layout/ProtectedLayout'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/houses" element={<Houses />} />
            <Route path="/houses/new" element={<HouseForm />} />
            <Route path="/houses/:id" element={<HouseDetail />} />
            <Route path="/houses/:id/edit" element={<HouseForm />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/edit" element={<ClientForm />} />
            <Route path="/schedules" element={<Schedule />} />
            <Route path="/schedules/new" element={<ScheduleForm />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/new" element={<TransactionForm />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/profile" element={<Profile />} />

            <Route element={<ProtectedRoute roles={['director', 'manager', 'admin']} />}>
              <Route path="/organizations" element={<Organization />} />
            </Route>

            <Route element={<ProtectedRoute roles={['director', 'admin', 'platform']} />}>
              <Route path="/audit" element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<div className="text-center py-12 text-xl text-zinc-500">页面不存在</div>} />
      </Routes>
    </Router>
  )
}
