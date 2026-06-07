import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DeviceList from "@/pages/DeviceList";
import DeviceDetail from "@/pages/DeviceDetail";
import LivePreview from "@/pages/LivePreview";
import AlertList from "@/pages/AlertList";
import AlertRules from "@/pages/AlertRules";
import RecordingList from "@/pages/RecordingList";
import Organizations from "@/pages/Organizations";
import Permissions from "@/pages/Permissions";
import HealthMonitor from "@/pages/HealthMonitor";
import FirmwareUpgrade from "@/pages/FirmwareUpgrade";
import AuditLogs from "@/pages/AuditLogs";
import SdkDocs from "@/pages/SdkDocs";

export default function App() {
  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/devices" element={
          <ProtectedRoute>
            <Layout><DeviceList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/devices/:id" element={
          <ProtectedRoute>
            <Layout><DeviceDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/preview" element={
          <ProtectedRoute>
            <Layout><LivePreview /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <Layout><AlertList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/alerts/rules" element={
          <ProtectedRoute adminOnly>
            <Layout><AlertRules /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/recordings" element={
          <ProtectedRoute>
            <Layout><RecordingList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/organizations" element={
          <ProtectedRoute>
            <Layout><Organizations /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/permissions" element={
          <ProtectedRoute adminOnly>
            <Layout><Permissions /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/health" element={
          <ProtectedRoute adminOnly>
            <Layout><HealthMonitor /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/firmware" element={
          <ProtectedRoute adminOnly>
            <Layout><FirmwareUpgrade /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/audit" element={
          <ProtectedRoute adminOnly>
            <Layout><AuditLogs /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/sdk" element={
          <ProtectedRoute adminOnly>
            <Layout><SdkDocs /></Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
