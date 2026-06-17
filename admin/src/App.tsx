import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Citizens from '@/pages/Citizens';
import ScenicHeatmap from '@/pages/ScenicHeatmap';
import TransportTop from '@/pages/TransportTop';
import FusingRules from '@/pages/FusingRules';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
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
          <Route index element={<Dashboard />} />
          <Route path="citizens" element={<Citizens />} />
          <Route path="transactions" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold text-gray-800">交易流水</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
          <Route path="transport" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold text-gray-800">交通卡管理</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
          <Route path="scenics" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold text-gray-800">景区管理</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
          <Route path="scenic-heatmap" element={<ScenicHeatmap />} />
          <Route path="enterprises" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold text-gray-800">企业服务</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
          <Route path="merchants" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold text-gray-800">商户管理</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
          <Route path="transport-top" element={<TransportTop />} />
          <Route path="fusing" element={<FusingRules />} />
          <Route path="audit" element={<div className="p-8 text-center"><h2 className="text-xl font-semibold text-gray-800">审计日志</h2><p className="text-gray-500 mt-2">功能开发中...</p></div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
