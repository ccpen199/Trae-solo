import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import WorkerList from './pages/Workers/WorkerList'
import WorkerDetail from './pages/Workers/WorkerDetail'
import EmployerList from './pages/Employers/EmployerList'
import EmployerDetail from './pages/Employers/EmployerDetail'
import OrderList from './pages/Orders/OrderList'
import OrderDetail from './pages/Orders/OrderDetail'
import ServiceTracking from './pages/Supervision/ServiceTracking'
import Evaluation from './pages/Supervision/Evaluation'
import DisputeList from './pages/Disputes/DisputeList'
import CompensationEngine from './pages/Compensation/CompensationEngine'
import ServicePackages from './pages/ServiceProvider/ServicePackages'
import TrainingCourses from './pages/ServiceProvider/TrainingCourses'
import Recertification from './pages/ServiceProvider/Recertification'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workers" element={<WorkerList />} />
          <Route path="/workers/:id" element={<WorkerDetail />} />
          <Route path="/employers" element={<EmployerList />} />
          <Route path="/employers/:id" element={<EmployerDetail />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/supervision" element={<ServiceTracking />} />
          <Route path="/supervision/evaluations" element={<Evaluation />} />
          <Route path="/disputes" element={<DisputeList />} />
          <Route path="/compensation" element={<CompensationEngine />} />
          <Route path="/provider/packages" element={<ServicePackages />} />
          <Route path="/provider/training" element={<TrainingCourses />} />
          <Route path="/provider/recertification" element={<Recertification />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
