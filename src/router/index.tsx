import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from '@/pages/user/HomePage';
import PublishOrderPage from '@/pages/user/PublishOrderPage';
import OrderTrackPage from '@/pages/user/OrderTrackPage';
import OrdersPage from '@/pages/user/OrdersPage';
import WalletPage from '@/pages/user/WalletPage';
import ProfilePage from '@/pages/user/ProfilePage';

import WorkbenchPage from '@/pages/rider/WorkbenchPage';
import OrderDetailPage from '@/pages/rider/OrderDetailPage';
import RiderWalletPage from '@/pages/rider/RiderWalletPage';
import RiderProfilePage from '@/pages/rider/RiderProfilePage';

import DashboardPage from '@/pages/dispatch/DashboardPage';
import ConflictsPage from '@/pages/dispatch/ConflictsPage';
import FusionPage from '@/pages/dispatch/FusionPage';

import OverviewPage from '@/pages/finance/OverviewPage';
import UserBalancesPage from '@/pages/finance/UserBalancesPage';
import RiderPayoutPage from '@/pages/finance/RiderPayoutPage';
import ChannelsPage from '@/pages/finance/ChannelsPage';

import AppLayout from './AppLayout';
import { useAppStore } from '@/stores/appStore';

const AppRouter: React.FC = () => {
  const currentRole = useAppStore(s => s.currentRole);

  const getDefaultRoute = () => {
    switch (currentRole) {
      case 'rider': return '/rider';
      case 'dispatcher': return '/dispatch';
      case 'finance': return '/finance';
      default: return '/';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/publish" element={<PublishOrderPage />} />
          <Route path="/order/:id" element={<OrderTrackPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/rider" element={<WorkbenchPage />} />
          <Route path="/rider/order/:id" element={<OrderDetailPage />} />
          <Route path="/rider/wallet" element={<RiderWalletPage />} />
          <Route path="/rider/profile" element={<RiderProfilePage />} />

          <Route path="/dispatch" element={<DashboardPage />} />
          <Route path="/dispatch/conflicts" element={<ConflictsPage />} />
          <Route path="/dispatch/fusion" element={<FusionPage />} />

          <Route path="/finance" element={<OverviewPage />} />
          <Route path="/finance/users" element={<UserBalancesPage />} />
          <Route path="/finance/riders" element={<RiderPayoutPage />} />
          <Route path="/finance/channels" element={<ChannelsPage />} />

          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
