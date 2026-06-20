import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import Orders from './pages/Orders'
import Dispatch from './pages/Dispatch'
import Heatmap from './pages/Heatmap'
import Exceptions from './pages/Exceptions'
import Credit from './pages/Credit'
import SupplyDemand from './pages/SupplyDemand'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'drivers',
        element: <Drivers />
      },
      {
        path: 'orders',
        element: <Orders />
      },
      {
        path: 'dispatch',
        element: <Dispatch />
      },
      {
        path: 'heatmap',
        element: <Heatmap />
      },
      {
        path: 'exceptions',
        element: <Exceptions />
      },
      {
        path: 'credit',
        element: <Credit />
      },
      {
        path: 'supply-demand',
        element: <SupplyDemand />
      }
    ]
  }
])

const App: React.FC = () => {
  return <RouterProvider router={router} />
}

export default App
