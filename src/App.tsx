import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import IdentityCenter from "@/pages/IdentityCenter";
import Profile from "@/pages/Profile";
import Dashboard from "@/pages/Dashboard";
import Orchestration from "@/pages/Orchestration";

import Transportation from "@/pages/transportation/Transportation";
import BRTQRCode from "@/pages/transportation/BRTQRCode";
import Parking from "@/pages/transportation/Parking";
import Violation from "@/pages/transportation/Violation";

import Medical from "@/pages/medical/Medical";
import Appointment from "@/pages/medical/Appointment";
import Heatmap from "@/pages/medical/Heatmap";

import Education from "@/pages/education/Education";
import Enrollment from "@/pages/education/Enrollment";

import Government from "@/pages/government/Government";
import Policy from "@/pages/government/Policy";

import Urban from "@/pages/urban/Urban";
import Complaint from "@/pages/urban/Complaint";

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="identity" element={<IdentityCenter />} />
            <Route path="profile" element={<Profile />} />

            <Route path="transportation" element={<Transportation />} />
            <Route path="transportation/brt" element={<BRTQRCode />} />
            <Route path="transportation/parking" element={<Parking />} />
            <Route path="transportation/violation" element={<Violation />} />

            <Route path="medical" element={<Medical />} />
            <Route path="medical/appointment" element={<Appointment />} />
            <Route path="medical/heatmap" element={<Heatmap />} />

            <Route path="education" element={<Education />} />
            <Route path="education/enrollment" element={<Enrollment />} />

            <Route path="government" element={<Government />} />
            <Route path="government/policy" element={<Policy />} />
            <Route path="government/policy/:id" element={<Policy />} />

            <Route path="urban" element={<Urban />} />
            <Route path="urban/complaint" element={<Complaint />} />
            <Route path="urban/complaint/:id" element={<Complaint />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orchestration"
            element={
              <ProtectedRoute requireAdmin>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Orchestration />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
