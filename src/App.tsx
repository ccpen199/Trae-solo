import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const PropertyList = lazy(() => import('@/pages/PropertyList'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const PropertyForm = lazy(() => import('@/pages/PropertyForm'));
const TenantList = lazy(() => import('@/pages/TenantList'));
const TenantDetail = lazy(() => import('@/pages/TenantDetail'));
const TenantForm = lazy(() => import('@/pages/TenantForm'));
const MeterReading = lazy(() => import('@/pages/MeterReading'));
const BillList = lazy(() => import('@/pages/BillList'));
const BillDetail = lazy(() => import('@/pages/BillDetail'));
const RentCalendar = lazy(() => import('@/pages/RentCalendar'));
const LeaseCenter = lazy(() => import('@/pages/LeaseCenter'));
const RentalPoster = lazy(() => import('@/pages/RentalPoster'));
const OperationLog = lazy(() => import('@/pages/OperationLog'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
            <span className="text-sm text-slate-500">系统加载中…</span>
          </div>
        </div>
      }
    >
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/properties" element={<PropertyList />} />
          <Route path="/properties/new" element={<PropertyForm />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/properties/:id/edit" element={<PropertyForm />} />
          <Route path="/tenants" element={<TenantList />} />
          <Route path="/tenants/new" element={<TenantForm />} />
          <Route path="/tenants/:id" element={<TenantDetail />} />
          <Route path="/meter-reading" element={<MeterReading />} />
          <Route path="/bills" element={<BillList />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          <Route path="/calendar" element={<RentCalendar />} />
          <Route path="/lease" element={<LeaseCenter />} />
          <Route path="/lease/poster/:propertyId" element={<RentalPoster />} />
          <Route path="/logs" element={<OperationLog />} />
        </Route>
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
