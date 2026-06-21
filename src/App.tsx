import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useCallback, useState } from "react";
import Login from "@/pages/Login";
import StudentHome from "@/pages/student/Home";
import StudentDevices from "@/pages/student/Devices";
import StudentWatering from "@/pages/student/Watering";
import StudentBills from "@/pages/student/Bills";
import StudentRecharge from "@/pages/student/Recharge";
import InvestorDashboard from "@/pages/investor/Dashboard";
import InvestorDevices from "@/pages/investor/Devices";
import InvestorAnalytics from "@/pages/investor/Analytics";
import InvestorRevenue from "@/pages/investor/Revenue";
import AdminHome from "@/pages/admin/Home";
import AdminUsers from "@/pages/admin/Users";
import { Loader2 } from 'lucide-react';
import type { UserRole } from '../shared/types.js';
import { useAuthStore } from "@/store/auth.ts";

interface AuthSession {
  token: string;
  user: { id: string; name: string; role: UserRole; phone: string; avatar?: string };
}

const ROLE_ROUTES: Record<UserRole, string> = {
  student: '/student',
  investor: '/investor',
  admin: '/admin',
};

/**
 * 从 localStorage 读取当前会话。这是唯一可信源。
 * 不依赖 Zustand 的内存状态，避免跨组件时序问题。
 */
function getSessionFromStorage(): AuthSession | null {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return null;
    const user = JSON.parse(userStr);
    if (!user || !user.role || !ROLE_ROUTES[user.role]) return null;
    return { token, user };
  } catch {
    return null;
  }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-water-texture-dark flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="text-aqua-400 animate-spin mx-auto mb-4" />
        <p className="text-aqua-200 font-medium">正在加载...</p>
      </div>
    </div>
  );
}

/**
 * 守卫：校验访问受保护页面的权限
 * 直接从 localStorage 读取会话，不依赖 Zustand action 时序
 */
function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: UserRole[] }) {
  const navigate = useNavigate();
  // 每次组件渲染时都检查 localStorage，并使用 version 触发重渲染
  const [, forceRefresh] = useState(0);
  const syncToStore = useAuthStore((s) => s.login);

  const session = getSessionFromStorage();
  const authorized = session && allowedRoles.includes(session.user.role);

  const checkAndRedirect = useCallback(() => {
    const currentSession = getSessionFromStorage();

    // 情况1：没有登录信息 → 跳登录
    if (!currentSession) {
      navigate('/login', { replace: true });
      return;
    }

    // 情况2：登录了但角色不匹配 → 跳对应工作台
    if (!allowedRoles.includes(currentSession.user.role)) {
      const target = ROLE_ROUTES[currentSession.user.role] || '/login';
      navigate(target, { replace: true });
    }

    // 情况3：一切正常 → 同步到 Zustand store（确保布局组件能拿到 user）
    syncToStore(currentSession.token, currentSession.user);
  }, [allowedRoles, navigate, syncToStore]);

  // 初次挂载 + 每 300ms 轮询一次（防止跨 tab/跨导航时序问题）
  useEffect(() => {
    checkAndRedirect();
    const interval = setInterval(() => {
      const latest = getSessionFromStorage();
      if ((!latest && session) || (latest && session?.token !== latest.token)) {
        forceRefresh((v) => v + 1);
        checkAndRedirect();
      }
    }, 300);
    return () => clearInterval(interval);
  }, [checkAndRedirect, session]);

  // 未授权时先渲染 loading 保持一致，让跳转逻辑在 useEffect 中完成
  if (!session || !authorized) return <LoadingScreen />;
  return children;
}

/**
 * 根路径重定向器
 * 读取 localStorage 中会话 → 跳转到对应角色工作台，否则去登录页
 */
function RoleRedirect() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const session = getSessionFromStorage();
    if (session) {
      navigate(ROLE_ROUTES[session.user.role], { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
    setMounted(true);
  }, [navigate]);

  return <LoadingScreen />;
}

export default function App() {
  // 应用级初始化：尝试把 localStorage 中的会话同步到 Zustand
  const storeInit = useAuthStore((s) => s.init);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storeInit();
    // 给 50ms 让 store 完成，避免首帧闪 Loading 太长
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [storeInit]);

  if (!ready) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />

        {/* 学生端 */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
        <Route path="/student/devices" element={<ProtectedRoute allowedRoles={['student']}><StudentDevices /></ProtectedRoute>} />
        <Route path="/student/watering/:deviceId" element={<ProtectedRoute allowedRoles={['student']}><StudentWatering /></ProtectedRoute>} />
        <Route path="/student/bills" element={<ProtectedRoute allowedRoles={['student']}><StudentBills /></ProtectedRoute>} />
        <Route path="/student/recharge" element={<ProtectedRoute allowedRoles={['student']}><StudentRecharge /></ProtectedRoute>} />

        {/* 投资商端 */}
        <Route path="/investor" element={<ProtectedRoute allowedRoles={['investor']}><InvestorDashboard /></ProtectedRoute>} />
        <Route path="/investor/devices" element={<ProtectedRoute allowedRoles={['investor']}><InvestorDevices /></ProtectedRoute>} />
        <Route path="/investor/analytics" element={<ProtectedRoute allowedRoles={['investor']}><InvestorAnalytics /></ProtectedRoute>} />
        <Route path="/investor/revenue" element={<ProtectedRoute allowedRoles={['investor']}><InvestorRevenue /></ProtectedRoute>} />

        {/* 管理员端 */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
