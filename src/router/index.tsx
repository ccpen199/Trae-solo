import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Holder from '@/pages/Holder';
import Market from '@/pages/Market';
import Contract from '@/pages/Contract';
import Partner from '@/pages/Partner';
import Merchant from '@/pages/Merchant';
import Blockchain from '@/pages/Blockchain';
import Health from '@/pages/Health';
import ArFence from '@/pages/ArFence';
import Verify from '@/pages/Verify';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'holder', element: <Holder /> },
      { path: 'market', element: <Market /> },
      { path: 'contract', element: <Contract /> },
      { path: 'partner', element: <Partner /> },
      { path: 'merchant', element: <Merchant /> },
      { path: 'blockchain', element: <Blockchain /> },
      { path: 'health', element: <Health /> },
      { path: 'ar-fence', element: <ArFence /> },
      { path: 'verify', element: <Verify /> },
    ],
  },
]);
