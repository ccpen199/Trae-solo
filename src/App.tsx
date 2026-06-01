import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import Teachers from "@/pages/Teachers";
import Classes from "@/pages/Classes";
import Classrooms from "@/pages/Classrooms";
import Schedules from "@/pages/Schedules";
import Adjustments from "@/pages/Adjustments";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import { useAuthStore } from "@/store/authStore";

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="/courses" element={
              <PrivateRoute roles={['admin', 'dean']}>
                <Courses />
              </PrivateRoute>
            } />
            <Route path="/teachers" element={
              <PrivateRoute roles={['admin', 'dean']}>
                <Teachers />
              </PrivateRoute>
            } />
            <Route path="/classes" element={
              <PrivateRoute roles={['admin', 'dean']}>
                <Classes />
              </PrivateRoute>
            } />
            <Route path="/classrooms" element={
              <PrivateRoute roles={['admin', 'dean']}>
                <Classrooms />
              </PrivateRoute>
            } />
            <Route path="/schedules" element={
              <PrivateRoute>
                <Schedules />
              </PrivateRoute>
            } />
            <Route path="/adjustments" element={
              <PrivateRoute>
                <Adjustments />
              </PrivateRoute>
            } />
            <Route path="/notifications" element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute roles={['admin', 'dean']}>
                <Reports />
              </PrivateRoute>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
