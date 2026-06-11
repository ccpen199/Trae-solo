import { createBrowserRouter, Navigate } from 'react-router-dom';
import UserLayout from '@/components/Layout/UserLayout';
import AdminLayout from '@/components/Layout/AdminLayout';

import Home from '@/pages/user/Home';
import Login from '@/pages/user/Login';
import Payment from '@/pages/user/Payment';
import PaymentRecords from '@/pages/user/Payment/records';
import PaymentVoucher from '@/pages/user/Payment/voucher';
import Announcement from '@/pages/user/Announcement';
import AnnouncementDetail from '@/pages/user/Announcement/[id]';
import ServiceMap from '@/pages/user/ServiceMap';
import Household from '@/pages/user/Household';
import Profile from '@/pages/user/Profile';

import AdminLogin from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import AdminWorkOrder from '@/pages/admin/WorkOrder';
import AdminAnnouncement from '@/pages/admin/Announcement';
import AdminReconciliation from '@/pages/admin/Reconciliation';
import AdminRegulatory from '@/pages/admin/System/Regulatory';

const router = createBrowserRouter([
  {
    path: '/',
    element: <UserLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'payment', element: <Payment /> },
      { path: 'payment/bills', element: <Payment /> },
      { path: 'payment/records', element: <PaymentRecords /> },
      { path: 'payment/voucher', element: <PaymentVoucher /> },
      { path: 'payment/export', element: <PaymentRecords /> },
      { path: 'announcements', element: <Announcement /> },
      { path: 'announcements/:id', element: <AnnouncementDetail /> },
      { path: 'service-map', element: <ServiceMap /> },
      { path: 'household', element: <Household /> },
      { path: 'profile', element: <Profile /> },
      { path: 'profile/work-orders', element: <Profile /> },
      { path: 'profile/messages', element: <Profile /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'login', element: <AdminLogin /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'announcements', element: <AdminAnnouncement /> },
      { path: 'announcements/create', element: <AdminAnnouncement /> },
      { path: 'payment', element: <PaymentRecords /> },
      { path: 'payment/reconciliation', element: <AdminReconciliation /> },
      { path: 'work-orders', element: <AdminWorkOrder /> },
      { path: 'work-orders/pending', element: <AdminWorkOrder /> },
      { path: 'users', element: <AdminWorkOrder /> },
      { path: 'outlets', element: <ServiceMap /> },
      { path: 'system/roles', element: <AdminRegulatory /> },
      { path: 'system/regulatory', element: <AdminRegulatory /> },
      { path: 'system/audit', element: <AdminRegulatory /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
