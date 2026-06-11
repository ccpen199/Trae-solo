import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import ExhibitionIndex from '@/pages/exhibition/Index'
import QRCode from '@/pages/exhibition/QRCode'
import Customers from '@/pages/exhibition/Customers'
import Tracking from '@/pages/exhibition/Tracking'
import ProductsIndex from '@/pages/products/Index'
import Trace from '@/pages/products/Trace'
import Inventory from '@/pages/products/Inventory'
import Promotions from '@/pages/products/Promotions'
import StoresIndex from '@/pages/stores/Index'
import Appointments from '@/pages/stores/Appointments'
import Services from '@/pages/stores/Services'
import Reviews from '@/pages/stores/Reviews'
import ComplianceIndex from '@/pages/compliance/Index'
import Speech from '@/pages/compliance/Speech'
import AML from '@/pages/compliance/AML'
import Geofence from '@/pages/compliance/Geofence'
import TrainingIndex from '@/pages/training/Index'
import Courses from '@/pages/training/Courses'
import Exams from '@/pages/training/Exams'
import Rankings from '@/pages/training/Rankings'
import DashboardIndex from '@/pages/dashboard/Index'
import Fission from '@/pages/dashboard/Fission'
import Sales from '@/pages/dashboard/Sales'
import Saturation from '@/pages/dashboard/Saturation'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/exhibition" element={<ExhibitionIndex />} />
          <Route path="/exhibition/qrcode" element={<QRCode />} />
          <Route path="/exhibition/customers" element={<Customers />} />
          <Route path="/exhibition/tracking" element={<Tracking />} />
          <Route path="/products" element={<ProductsIndex />} />
          <Route path="/products/trace" element={<Trace />} />
          <Route path="/products/inventory" element={<Inventory />} />
          <Route path="/products/promotions" element={<Promotions />} />
          <Route path="/stores" element={<StoresIndex />} />
          <Route path="/stores/appointments" element={<Appointments />} />
          <Route path="/stores/services" element={<Services />} />
          <Route path="/stores/reviews" element={<Reviews />} />
          <Route path="/compliance" element={<ComplianceIndex />} />
          <Route path="/compliance/speech" element={<Speech />} />
          <Route path="/compliance/aml" element={<AML />} />
          <Route path="/compliance/geofence" element={<Geofence />} />
          <Route path="/training" element={<TrainingIndex />} />
          <Route path="/training/courses" element={<Courses />} />
          <Route path="/training/exams" element={<Exams />} />
          <Route path="/training/rankings" element={<Rankings />} />
          <Route path="/dashboard" element={<DashboardIndex />} />
          <Route path="/dashboard/fission" element={<Fission />} />
          <Route path="/dashboard/sales" element={<Sales />} />
          <Route path="/dashboard/saturation" element={<Saturation />} />
        </Route>
      </Routes>
    </Router>
  )
}
