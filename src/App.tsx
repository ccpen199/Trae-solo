import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/shipper/dashboard"
          element={
            <Layout>
              <ShipperDashboard />
            </Layout>
          }
        />
        <Route
          path="/shipper/cargo/publish"
          element={
            <Layout>
              <CargoPublish />
            </Layout>
          }
        />
        <Route
          path="/shipper/cargo/list"
          element={
            <Layout>
              <CargoList />
            </Layout>
          }
        />
        <Route
          path="/shipper/cargo/:id/match"
          element={
            <Layout>
              <DriverMatch />
            </Layout>
          }
        />
        <Route
          path="/shipper/waybill/track"
          element={
            <Layout>
              <WaybillTrack />
            </Layout>
          }
        />
        <Route
          path="/shipper/credit"
          element={
            <Layout>
              <CreditCenter />
            </Layout>
          }
        />

        <Route
          path="/driver/dashboard"
          element={
            <Layout>
              <DriverDashboard />
            </Layout>
          }
        />
        <Route
          path="/driver/empty-report"
          element={
            <Layout>
              <EmptyReport />
            </Layout>
          }
        />
        <Route
          path="/driver/cargo-hall"
          element={
            <Layout>
              <CargoHall />
            </Layout>
          }
        />
        <Route
          path="/driver/negotiation"
          element={
            <Layout>
              <Negotiation />
            </Layout>
          }
        />
        <Route
          path="/driver/negotiation/:id"
          element={
            <Layout>
              <Negotiation />
            </Layout>
          }
        />
        <Route
          path="/driver/points-mall"
          element={
            <Layout>
              <PointsMall />
            </Layout>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <Layout>
              <AdminDashboard />
            </Layout>
          }
        />
        <Route
          path="/admin/pricing-model"
          element={
            <Layout>
              <PricingModel />
            </Layout>
          }
        />
        <Route
          path="/admin/risk-monitor"
          element={
            <Layout>
              <RiskMonitor />
            </Layout>
          }
        />
        <Route
          path="/admin/driver-growth"
          element={
            <Layout>
              <DriverGrowth />
            </Layout>
          }
        />
        <Route
          path="/admin/traffic-control"
          element={
            <Layout>
              <TrafficControl />
            </Layout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
