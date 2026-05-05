import { Navigate, useRoutes } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import Login from '@/pages/Login';
import MainLayout from '@/components/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Organization from '@/pages/System/Organization';
import Store from '@/pages/System/Store';
import User from '@/pages/System/User';
import Role from '@/pages/System/Role';
import Module from '@/pages/System/Module';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useUserStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppRouter = () => {
  const routes = useRoutes([
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: (
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'system/organization', element: <Organization /> },
        { path: 'system/store', element: <Store /> },
        { path: 'system/user', element: <User /> },
        { path: 'system/role', element: <Role /> },
        { path: 'system/module', element: <Module /> },
      ],
    },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
  ]);

  return routes;
};
