import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazySuspense } from '../utils/lazySuspense';

const Login = lazySuspense(() => import('../pages/shared/Login'));
const Register = lazySuspense(() => import('../pages/Register'));
const NotFound = lazySuspense(() => import('../pages/NotFound'));

const UserLayout = lazySuspense(() => import('../components/layout/UserLayout'));
const UserHome = lazySuspense(() => import('../pages/user/Home'));
const OrderCreate = lazySuspense(() => import('../pages/user/OrderCreate'));
const OrderList = lazySuspense(() => import('../pages/user/OrderList'));
const OrderDetail = lazySuspense(() => import('../pages/user/OrderDetail'));
const Address = lazySuspense(() => import('../pages/user/Address'));
const Wallet = lazySuspense(() => import('../pages/user/Wallet'));
const Profile = lazySuspense(() => import('../pages/user/Profile'));

const RiderLayout = lazySuspense(() => import('../components/layout/RiderLayout'));
const RiderRegister = lazySuspense(() => import('../pages/rider/Register'));
const RiderDashboard = lazySuspense(() => import('../pages/rider/Dashboard'));
const RiderHall = lazySuspense(() => import('../pages/rider/Hall'));
const RiderTasks = lazySuspense(() => import('../pages/rider/Tasks'));
const RiderEarnings = lazySuspense(() => import('../pages/rider/Earnings'));
const RiderGrowth = lazySuspense(() => import('../pages/rider/Growth'));
const RiderSettings = lazySuspense(() => import('../pages/rider/Settings'));

const MerchantLayout = lazySuspense(() => import('../components/layout/MerchantLayout'));
const MerchantRegister = lazySuspense(() => import('../pages/merchant/Register'));
const MerchantDashboard = lazySuspense(() => import('../pages/merchant/Dashboard'));
const MerchantProducts = lazySuspense(() => import('../pages/merchant/Products'));
const MerchantOrders = lazySuspense(() => import('../pages/merchant/Orders'));
const MerchantDispatch = lazySuspense(() => import('../pages/merchant/Dispatch'));
const MerchantStatistics = lazySuspense(() => import('../pages/merchant/Statistics'));
const MerchantFinance = lazySuspense(() => import('../pages/merchant/Finance'));

const AdminLayout = lazySuspense(() => import('../components/layout/AdminLayout'));
const AdminDashboard = lazySuspense(() => import('../pages/admin/Dashboard'));
const AdminHeatmap = lazySuspense(() => import('../pages/admin/Heatmap'));
const AdminRiders = lazySuspense(() => import('../pages/admin/Riders'));
const AdminAnomaly = lazySuspense(() => import('../pages/admin/Anomaly'));
const AdminIntervention = lazySuspense(() => import('../pages/admin/Intervention'));
const AdminTickets = lazySuspense(() => import('../pages/admin/Tickets'));
const AdminCities = lazySuspense(() => import('../pages/admin/Cities'));
const AdminFinance = lazySuspense(() => import('../pages/admin/Finance'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <UserLayout />,
    children: [
      { index: true, element: <UserHome /> },
      { path: 'order/create', element: <OrderCreate /> },
      { path: 'orders', element: <OrderList /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'address', element: <Address /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
  {
    path: '/rider/register',
    element: <RiderRegister />,
  },
  {
    path: '/rider',
    element: <RiderLayout />,
    children: [
      { index: true, element: <RiderDashboard /> },
      { path: 'hall', element: <RiderHall /> },
      { path: 'tasks', element: <RiderTasks /> },
      { path: 'earnings', element: <RiderEarnings /> },
      { path: 'growth', element: <RiderGrowth /> },
      { path: 'settings', element: <RiderSettings /> },
    ],
  },
  {
    path: '/merchant/register',
    element: <MerchantRegister />,
  },
  {
    path: '/merchant',
    element: <MerchantLayout />,
    children: [
      { index: true, element: <MerchantDashboard /> },
      { path: 'products', element: <MerchantProducts /> },
      { path: 'orders', element: <MerchantOrders /> },
      { path: 'dispatch', element: <MerchantDispatch /> },
      { path: 'statistics', element: <MerchantStatistics /> },
      { path: 'finance', element: <MerchantFinance /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'heatmap', element: <AdminHeatmap /> },
      { path: 'riders', element: <AdminRiders /> },
      { path: 'anomaly', element: <AdminAnomaly /> },
      { path: 'intervention', element: <AdminIntervention /> },
      { path: 'tickets', element: <AdminTickets /> },
      { path: 'cities', element: <AdminCities /> },
      { path: 'finance', element: <AdminFinance /> },
    ],
  },
  {
    path: '/404',
    element: <NotFound />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
