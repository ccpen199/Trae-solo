import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ROLE_PERMISSIONS, hasPermission, MENU_ITEMS } from './utils/constants';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import PropertyNew from './pages/PropertyNew';
import ValuationReport from './pages/ValuationReport';
import ContractSign from './pages/ContractSign';
import TransactionList from './pages/TransactionList';
import TransactionDetail from './pages/TransactionDetail';
import LeaseList from './pages/LeaseList';
import LeaseDetail from './pages/LeaseDetail';
import WorkOrderList from './pages/WorkOrderList';
import WorkOrderDetail from './pages/WorkOrderDetail';
import AgentDashboard from './pages/AgentDashboard';
import PropertyHealth from './pages/PropertyHealth';
import SupplyChain from './pages/SupplyChain';
import Settings from './pages/Settings';

const ROUTE_PERMISSIONS: Record<string, { permission: string; roles?: string[] }> = {
  '/': { permission: 'dashboard' },
  '/properties': { permission: 'properties' },
  '/properties/new': { permission: 'properties_new', roles: ['admin', 'agent_self', 'agent_franchise'] },
  '/properties/:id': { permission: 'properties' },
  '/valuation/:id': { permission: 'properties' },
  '/contracts/:id': { permission: 'properties' },
  '/transactions': { permission: 'transactions' },
  '/transactions/:id': { permission: 'transactions' },
  '/leases': { permission: 'leases' },
  '/leases/:id': { permission: 'leases' },
  '/work-orders': { permission: 'work_orders' },
  '/work-orders/:id': { permission: 'work_orders' },
  '/dashboard/agents': { permission: 'agents_dashboard', roles: ['admin'] },
  '/dashboard/property-health': { permission: 'property_health', roles: ['admin', 'agent_self', 'agent_franchise'] },
  '/dashboard/supply-chain': { permission: 'supply_chain', roles: ['admin'] },
  '/settings': { permission: 'settings', roles: ['admin'] },
};

function matchRoutePermission(pathname: string): { permission: string; roles?: string[] } | null {
  for (const [pattern, config] of Object.entries(ROUTE_PERMISSIONS)) {
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');
    if (patternParts.length === pathParts.length) {
      let match = true;
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) continue;
        if (patternParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }
      if (match) return config;
    }
  }
  return null;
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const routeConfig = matchRoutePermission(location.pathname);
  if (routeConfig) {
    if (!hasPermission(user.role, routeConfig.permission, routeConfig.roles)) {
      console.warn(`权限拦截: 用户[${user.name}(${user.role})] 尝试访问 ${location.pathname}`);
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/new" element={<PropertyNew />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="valuation/:id" element={<ValuationReport />} />
        <Route path="contracts/:id" element={<ContractSign />} />
        <Route path="transactions" element={<TransactionList />} />
        <Route path="transactions/:id" element={<TransactionDetail />} />
        <Route path="leases" element={<LeaseList />} />
        <Route path="leases/:id" element={<LeaseDetail />} />
        <Route path="work-orders" element={<WorkOrderList />} />
        <Route path="work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="dashboard/agents" element={<AgentDashboard />} />
        <Route path="dashboard/property-health" element={<PropertyHealth />} />
        <Route path="dashboard/supply-chain" element={<SupplyChain />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
