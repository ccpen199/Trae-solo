import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/types';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import HomePage from '@/pages/Home';
import CarsList from '@/pages/CarsList';
import CarPublish from '@/pages/CarPublish';
import CarDetail from '@/pages/CarDetail';
import InspectionsList from '@/pages/InspectionsList';
import InspectionDetail from '@/pages/InspectionDetail';
import InspectionCreate from '@/pages/InspectionCreate';
import AppointmentsList from '@/pages/AppointmentsList';
import AppointmentCreate from '@/pages/AppointmentCreate';
import DepositsList from '@/pages/DepositsList';
import ContractsList from '@/pages/ContractsList';
import TransfersList from '@/pages/TransfersList';
import SettlementsList from '@/pages/SettlementsList';
import Statistics from '@/pages/Statistics';
import AuditLogs from '@/pages/AuditLogs';
import ExceptionsList from '@/pages/ExceptionsList';
import UsersList from '@/pages/UsersList';
import NotFound from '@/pages/NotFound';
import Forbidden from '@/pages/Forbidden';

const allRoles: UserRole[] = ['admin', 'dealer', 'buyer', 'inspector', 'sales', 'customer_service', 'finance'];

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/404" element={<NotFound />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={allRoles}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cars"
          element={
            <ProtectedRoute allowedRoles={['dealer', 'sales', 'admin', 'customer_service', 'buyer', 'inspector']}>
              <CarsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cars/publish"
          element={
            <ProtectedRoute allowedRoles={['dealer', 'admin']}>
              <CarPublish />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cars/:id"
          element={
            <ProtectedRoute allowedRoles={['dealer', 'sales', 'buyer', 'inspector', 'admin']}>
              <CarDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inspections"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'sales', 'admin', 'buyer']}>
              <InspectionsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inspections/:id"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'sales', 'admin', 'buyer']}>
              <InspectionDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inspections/create/:carId"
          element={
            <ProtectedRoute allowedRoles={['inspector', 'admin']}>
              <InspectionCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['sales', 'buyer', 'admin']}>
              <AppointmentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/create"
          element={
            <ProtectedRoute allowedRoles={['buyer', 'sales', 'admin']}>
              <AppointmentCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/deposits"
          element={
            <ProtectedRoute allowedRoles={['finance', 'sales', 'buyer', 'admin']}>
              <DepositsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contracts"
          element={
            <ProtectedRoute allowedRoles={['sales', 'buyer', 'admin', 'finance']}>
              <ContractsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfers"
          element={
            <ProtectedRoute allowedRoles={['sales', 'admin', 'customer_service', 'buyer']}>
              <TransfersList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settlements"
          element={
            <ProtectedRoute allowedRoles={['finance', 'admin', 'dealer']}>
              <SettlementsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/statistics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Statistics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exceptions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'customer_service']}>
              <ExceptionsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersList />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}
