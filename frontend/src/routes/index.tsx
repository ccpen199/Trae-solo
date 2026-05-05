import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'

const MainLayout = lazy(() => import('../layouts/MainLayout/MainLayout'))
const Login = lazy(() => import('../pages/Login/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'))

// 系统管理
const UserManagement = lazy(() => import('../pages/UserManagement/UserManagement'))
const RoleManagement = lazy(() => import('../pages/RoleManagement/RoleManagement'))
const MenuManagement = lazy(() => import('../pages/PermissionManagement/MenuManagement'))
const DepartmentManagement = lazy(() => import('../pages/PermissionManagement/DepartmentManagement'))

// 基础设置
const CityManagement = lazy(() => import('../pages/SystemSettings/CityManagement'))
const NodeManagement = lazy(() => import('../pages/SystemSettings/NodeManagement'))
const VehicleTypeManagement = lazy(() => import('../pages/SystemSettings/VehicleTypeManagement'))
const VehicleManagement = lazy(() => import('../pages/SystemSettings/VehicleManagement'))
const DriverManagement = lazy(() => import('../pages/SystemSettings/DriverManagement'))
const CargoTypeManagement = lazy(() => import('../pages/SystemSettings/CargoTypeManagement'))
const BusinessTypeManagement = lazy(() => import('../pages/SystemSettings/BusinessTypeManagement'))
const GpsManagement = lazy(() => import('../pages/SystemSettings/GpsManagement'))

// 运输网络
const CarrierManagement = lazy(() => import('../pages/TransportNetwork/CarrierManagement'))
const TransportTypeManagement = lazy(() => import('../pages/TransportNetwork/TransportTypeManagement'))
const TransportRouteManagement = lazy(() => import('../pages/TransportNetwork/TransportRouteManagement'))
const FreightRateManagement = lazy(() => import('../pages/TransportNetwork/FreightRateManagement'))

// 发运管理
const TransportPlanManagement = lazy(() => import('../pages/ShipmentManagement/TransportPlanManagement'))
const TransportOrderManagement = lazy(() => import('../pages/ShipmentManagement/TransportOrderManagement'))
const InTransitMonitoringManagement = lazy(() => import('../pages/ShipmentManagement/InTransitMonitoringManagement'))
const ExceptionRecordManagement = lazy(() => import('../pages/ShipmentManagement/ExceptionRecordManagement'))

// 到货管理
const ArrivalForecastManagement = lazy(() => import('../pages/ArrivalManagement/ArrivalForecastManagement'))
const OrderSignManagement = lazy(() => import('../pages/ArrivalManagement/OrderSignManagement'))
const ClaimManagement = lazy(() => import('../pages/ArrivalManagement/ClaimManagement'))

// 财务管理
const FreightCalculationManagement = lazy(
  () => import('../pages/FinanceManagement/FreightCalculationManagement')
)
const ReconciliationManagement = lazy(() => import('../pages/FinanceManagement/ReconciliationManagement'))
const AuditLogManagement = lazy(() => import('../pages/FinanceManagement/AuditLogManagement'))

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    }
  >
    {children}
  </Suspense>
)

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <Login />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <MainLayout />
      </SuspenseWrapper>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      // 系统管理
      {
        path: 'system/users',
        element: (
          <SuspenseWrapper>
            <UserManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'system/roles',
        element: (
          <SuspenseWrapper>
            <RoleManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'system/menus',
        element: (
          <SuspenseWrapper>
            <MenuManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'system/departments',
        element: (
          <SuspenseWrapper>
            <DepartmentManagement />
          </SuspenseWrapper>
        ),
      },
      // 基础设置
      {
        path: 'setting/cities',
        element: (
          <SuspenseWrapper>
            <CityManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/nodes',
        element: (
          <SuspenseWrapper>
            <NodeManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/vehicle-types',
        element: (
          <SuspenseWrapper>
            <VehicleTypeManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/vehicles',
        element: (
          <SuspenseWrapper>
            <VehicleManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/drivers',
        element: (
          <SuspenseWrapper>
            <DriverManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/cargo-types',
        element: (
          <SuspenseWrapper>
            <CargoTypeManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/business-types',
        element: (
          <SuspenseWrapper>
            <BusinessTypeManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'setting/gps',
        element: (
          <SuspenseWrapper>
            <GpsManagement />
          </SuspenseWrapper>
        ),
      },
      // 运输网络
      {
        path: 'network/carriers',
        element: (
          <SuspenseWrapper>
            <CarrierManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'network/transport-types',
        element: (
          <SuspenseWrapper>
            <TransportTypeManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'network/routes',
        element: (
          <SuspenseWrapper>
            <TransportRouteManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'network/rates',
        element: (
          <SuspenseWrapper>
            <FreightRateManagement />
          </SuspenseWrapper>
        ),
      },
      // 发运管理
      {
        path: 'shipping/plans',
        element: (
          <SuspenseWrapper>
            <TransportPlanManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'shipping/orders',
        element: (
          <SuspenseWrapper>
            <TransportOrderManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'shipping/monitoring',
        element: (
          <SuspenseWrapper>
            <InTransitMonitoringManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'shipping/exceptions',
        element: (
          <SuspenseWrapper>
            <ExceptionRecordManagement />
          </SuspenseWrapper>
        ),
      },
      // 到货管理
      {
        path: 'arrival/forecasts',
        element: (
          <SuspenseWrapper>
            <ArrivalForecastManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'arrival/signs',
        element: (
          <SuspenseWrapper>
            <OrderSignManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'arrival/claims',
        element: (
          <SuspenseWrapper>
            <ClaimManagement />
          </SuspenseWrapper>
        ),
      },
      // 财务管理
      {
        path: 'finance/calculations',
        element: (
          <SuspenseWrapper>
            <FreightCalculationManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'finance/reconciliations',
        element: (
          <SuspenseWrapper>
            <ReconciliationManagement />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'finance/logs',
        element: (
          <SuspenseWrapper>
            <AuditLogManagement />
          </SuspenseWrapper>
        ),
      },
    ],
  },
])

export default router
