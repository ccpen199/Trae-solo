import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";

import ShipperDashboard from "@/pages/shipper/Dashboard";
import CargoPublish from "@/pages/shipper/CargoPublish";
import CargoList from "@/pages/shipper/CargoList";
import DriverMatch from "@/pages/shipper/DriverMatch";
import WaybillTrack from "@/pages/shipper/WaybillTrack";
import CreditCenter from "@/pages/shipper/CreditCenter";

import DriverDashboard from "@/pages/driver/Dashboard";
import EmptyReport from "@/pages/driver/EmptyReport";
import CargoHall from "@/pages/driver/CargoHall";
import Negotiation from "@/pages/driver/Negotiation";
import PointsMall from "@/pages/driver/PointsMall";

import AdminDashboard from "@/pages/admin/Dashboard";
import PricingModel from "@/pages/admin/PricingModel";
import RiskMonitor from "@/pages/admin/RiskMonitor";
import DriverGrowth from "@/pages/admin/DriverGrowth";
import TrafficControl from "@/pages/admin/TrafficControl";

import { useAuthStore } from "@/store";
import { useEffect, ReactNode } from "react";

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) {
      window.location.href = "/login";
    } else if (!allowedRoles.includes(user.role)) {
      const redirectMap: Record<string, string> = {
        shipper: "/shipper/dashboard",
        driver: "/driver/dashboard",
        admin: "/admin/dashboard",
      };
      window.location.href = redirectMap[user.role] || "/login";
    }
  }, [token, user, allowedRoles]);

  if (!token || !user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <Layout>{children}</Layout>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/shipper/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["shipper"]}>
        <ShipperDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/shipper/cargo/publish",
    element: (
      <ProtectedRoute allowedRoles={["shipper"]}>
        <CargoPublish />
      </ProtectedRoute>
    ),
  },
  {
    path: "/shipper/cargo/list",
    element: (
      <ProtectedRoute allowedRoles={["shipper"]}>
        <CargoList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/shipper/cargo/:id/match",
    element: (
      <ProtectedRoute allowedRoles={["shipper"]}>
        <DriverMatch />
      </ProtectedRoute>
    ),
  },
  {
    path: "/shipper/waybill/track",
    element: (
      <ProtectedRoute allowedRoles={["shipper"]}>
        <WaybillTrack />
      </ProtectedRoute>
    ),
  },
  {
    path: "/shipper/credit",
    element: (
      <ProtectedRoute allowedRoles={["shipper"]}>
        <CreditCenter />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <DriverDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/empty-report",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <EmptyReport />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/cargo-hall",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <CargoHall />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/negotiation",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <Negotiation />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/negotiation/:id",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <Negotiation />
      </ProtectedRoute>
    ),
  },
  {
    path: "/driver/points-mall",
    element: (
      <ProtectedRoute allowedRoles={["driver"]}>
        <PointsMall />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/pricing-model",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <PricingModel />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/risk-monitor",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <RiskMonitor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/driver-growth",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DriverGrowth />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/traffic-control",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <TrafficControl />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
