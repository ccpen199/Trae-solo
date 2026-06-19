import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ToastProvider } from "@/components/ui/ToastProvider";
import HomePage from "@/pages/user/HomePage";
import SubmitPage from "@/pages/user/SubmitPage";
import ConsultationListPage from "@/pages/user/ConsultationListPage";
import GrabHallPage from "@/pages/lawyer/GrabHallPage";
import CaseManagePage from "@/pages/lawyer/CaseManagePage";
import LegalOpinionPage from "@/pages/lawyer/LegalOpinionPage";
import ChatPage from "@/pages/shared/ChatPage";
import LoginPage from "@/pages/shared/LoginPage";
import NotFoundPage from "@/pages/shared/NotFoundPage";
import VerifyCenterPage from "@/pages/admin/VerifyCenterPage";
import DisputeCenterPage from "@/pages/admin/DisputeCenterPage";
import MonitorDashboardPage from "@/pages/admin/MonitorDashboardPage";

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <AppLayout>
                <Navigate to="/home" replace />
              </AppLayout>
            }
          />
          <Route
            path="/home"
            element={
              <AppLayout>
                <HomePage />
              </AppLayout>
            }
          />
          <Route
            path="/submit"
            element={
              <AppLayout>
                <SubmitPage />
              </AppLayout>
            }
          />
          <Route
            path="/consultations"
            element={
              <AppLayout>
                <ConsultationListPage />
              </AppLayout>
            }
          />
          <Route
            path="/consultation/:id"
            element={
              <AppLayout showFooter={false}>
                <ChatPage />
              </AppLayout>
            }
          />
          <Route
            path="/lawyer-hall"
            element={
              <AppLayout showFooter={false}>
                <GrabHallPage />
              </AppLayout>
            }
          />
          <Route
            path="/lawyer-cases"
            element={
              <AppLayout showFooter={false}>
                <CaseManagePage />
              </AppLayout>
            }
          />
          <Route
            path="/lawyer-opinion/:id"
            element={
              <AppLayout showFooter={false}>
                <LegalOpinionPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/verify"
            element={
              <AppLayout showFooter={false}>
                <VerifyCenterPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/disputes"
            element={
              <AppLayout showFooter={false}>
                <DisputeCenterPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin/monitor"
            element={
              <AppLayout showFooter={false}>
                <MonitorDashboardPage />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
