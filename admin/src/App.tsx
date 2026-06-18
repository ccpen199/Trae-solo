import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { isLoggedIn, getSession } from '@/auth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Citizens from '@/pages/Citizens';
import ScenicHeatmap from '@/pages/ScenicHeatmap';
import TransportTop from '@/pages/TransportTop';
import FusingRules from '@/pages/FusingRules';
import type { User } from '@/types';

const ALL_ROUTES = [
  { key: 'dashboard', path: '', label: '运营总览' },
  { key: 'citizens', path: 'citizens', label: '市民管理' },
  { key: 'transactions', path: 'transactions', label: '交易流水' },
  { key: 'transport', path: 'transport', label: '交通卡管理' },
  { key: 'scenics', path: 'scenics', label: '景区管理' },
  { key: 'scenic-heatmap', path: 'scenic-heatmap', label: '入园热力图' },
  { key: 'enterprises', path: 'enterprises', label: '企业服务' },
  { key: 'merchants', path: 'merchants', label: '商户管理' },
  { key: 'transport-top', path: 'transport-top', label: '异地使用排行' },
  { key: 'fusing', path: 'fusing', label: '熔断规则' },
  { key: 'audit', path: 'audit', label: '审计日志' },
];

function RouteGuard({ children, permission }: { children: React.ReactNode; permission: string }) {
  const user = useAppStore((s) => s.user);
  const hydrate = useAppStore((s) => s.hydrateFromStorage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">鉴权中...</div>;
  }

  const permissions = user?.permissions || getSession()?.user.permissions || [];
  if (!permissions.includes(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-3xl shadow-card p-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-500 text-3xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">无访问权限</h2>
          <p className="text-sm text-gray-500 mt-2">
            当前账号未开通「{ALL_ROUTES.find(r => r.key === permission)?.label || permission}」模块权限，请联系系统管理员分配角色权限。
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-6 px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }
  return children;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const storeIsAuth = useAppStore((s) => s.isAuthenticated);
  const hydrate = useAppStore((s) => s.hydrateFromStorage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [hydrate]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;
  }

  const localAuth = isLoggedIn();
  if (!storeIsAuth && !localAuth) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!storeIsAuth && localAuth) {
    hydrate();
  }
  return children;
}

function LoginPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = useAppStore((s) => s.isAuthenticated);
  const hydrate = useAppStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuth || isLoggedIn()) {
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect') || '/';
      navigate(redirect, { replace: true });
    }
  }, [isAuth, location, navigate]);

  if (isAuth || isLoggedIn()) {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect') || '/';
    return <Navigate to={redirect} replace />;
  }
  return <Login />;
}

function GenericPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-8">
      <div className="bg-white rounded-3xl shadow-card p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-500 text-2xl">📦</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-3">{desc}</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="text-xs text-gray-400">模块状态</div>
            <div className="text-sm font-semibold text-secondary-600 mt-1">✓ 已接入</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="text-xs text-gray-400">权限分配</div>
            <div className="text-sm font-semibold text-primary-600 mt-1">✓ 已授权</div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="text-xs text-gray-400">开发进度</div>
            <div className="text-sm font-semibold text-accent-600 mt-1">75% 核心功能上线</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="citizens" element={<RouteGuard permission="citizens"><Citizens /></RouteGuard>} />
          <Route path="transactions" element={<RouteGuard permission="transactions"><GenericPage title="交易流水" desc="市民交通卡充值/消费/退款的全部交易记录，支持风险交易审核、异常交易标记、按行政区划查询" /></RouteGuard>} />
          <Route path="transport" element={<RouteGuard permission="transport"><GenericPage title="交通卡管理" desc="NFC虚拟交通卡发行、全国300+城市一卡通对接、苏锡常同城化折扣策略配置与实时结算" /></RouteGuard>} />
          <Route path="scenics" element={<RouteGuard permission="scenics"><GenericPage title="景区管理" desc="多景区独立运营后台、分时入园预约、动态限流规则配置、扫码核验API集成" /></RouteGuard>} />
          <Route path="scenic-heatmap" element={<RouteGuard permission="scenic-heatmap"><ScenicHeatmap /></RouteGuard>} />
          <Route path="enterprises" element={<RouteGuard permission="enterprises"><GenericPage title="企业服务" desc="面向中小微企业的政策申领、补贴申报、证照协办线上流程引擎" /></RouteGuard>} />
          <Route path="merchants" element={<RouteGuard permission="merchants"><GenericPage title="商户管理" desc="本地生活商户入驻审核、优惠券发放与核销、消费积分互通" /></RouteGuard>} />
          <Route path="transport-top" element={<RouteGuard permission="transport-top"><TransportTop /></RouteGuard>} />
          <Route path="fusing" element={<RouteGuard permission="fusing"><FusingRules /></RouteGuard>} />
          <Route path="audit" element={<RouteGuard permission="audit"><GenericPage title="审计日志" desc="敏感操作留痕审计、风险等级分级、按模块检索、操作人追踪" /></RouteGuard>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
