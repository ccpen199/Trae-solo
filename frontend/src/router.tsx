import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Users from '@/pages/Users';
import Tasks from '@/pages/Tasks';
import TaskDetail from '@/pages/TaskDetail';
import AppLayout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Role } from '@/types';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard/tasks" replace />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="tasks" replace />,
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute allowedRoles={[Role.ADMIN]}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'tasks/:id',
        element: <TaskDetail />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard/tasks" replace />,
  },
]);

export default router;
