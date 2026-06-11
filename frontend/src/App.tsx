import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAppStore } from "./store";
import { authAPI } from "./api";
import Login from "./pages/Login";
import MainLayout from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import PositionList from "./pages/Position/PositionList";
import PositionDetail from "./pages/Position/PositionDetail";
import CandidateKanban from "./pages/Candidate/CandidateKanban";
import CandidateList from "./pages/Candidate/CandidateList";
import CandidateDetail from "./pages/Candidate/CandidateDetail";
import InterviewList from "./pages/Interview/InterviewList";
import InterviewRoom from "./pages/Interview/InterviewRoom";
import IMChat from "./pages/IM/IMChat";
import ApprovalList from "./pages/Approval/ApprovalList";
import Analytics from "./pages/Analytics/Analytics";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setUser = useAppStore((state) => state.setUser);
  const login = useAppStore((state) => state.login);
  const [demoLoginChecked, setDemoLoginChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const response = await authAPI.getCurrentUser();
          if (!cancelled && response?.user) {
            setUser(response.user);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      }
    };

    const loginDemoUser = async () => {
      if (isAuthenticated || !import.meta.env.DEV || demoLoginChecked) {
        return;
      }

      try {
        const response = await authAPI.login("admin", "admin123");
        if (!cancelled && response?.token && response?.user) {
          login(response.token, response.user);
        }
      } catch (error) {
        console.error("Failed to login demo user:", error);
      } finally {
        if (!cancelled) {
          setDemoLoginChecked(true);
        }
      }
    };

    fetchUser();
    loginDemoUser();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setUser, login, demoLoginChecked]);

  if (!isAuthenticated) {
    if (import.meta.env.DEV && !demoLoginChecked) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          正在进入招聘协同工作台...
        </div>
      );
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="positions" element={<PositionList />} />
        <Route path="positions/:id" element={<PositionDetail />} />
        <Route path="candidates" element={<CandidateList />} />
        <Route path="candidates/kanban" element={<CandidateKanban />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="interviews" element={<InterviewList />} />
        <Route path="interviews/room/:roomId" element={<InterviewRoom />} />
        <Route path="im" element={<IMChat />} />
        <Route path="approvals" element={<ApprovalList />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
