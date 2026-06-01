import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Orders from "@/pages/Orders"
import OrderDetail from "@/pages/OrderDetail"
import Dispatches from "@/pages/Dispatches"
import OnSiteRecords from "@/pages/OnSiteRecords"
import OnSiteDetail from "@/pages/OnSiteDetail"
import ServiceTickets from "@/pages/ServiceTickets"
import ServiceTicketDetail from "@/pages/ServiceTicketDetail"
import Settlements from "@/pages/Settlements"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/dispatches" element={<Dispatches />} />
          <Route path="/on-site" element={<OnSiteRecords />} />
          <Route path="/on-site/:id" element={<OnSiteDetail />} />
          <Route path="/service-tickets" element={<ServiceTickets />} />
          <Route path="/service-tickets/:id" element={<ServiceTicketDetail />} />
          <Route path="/settlements" element={<Settlements />} />
        </Route>
      </Routes>
    </Router>
  )
}
