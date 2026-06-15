import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Settlements from './pages/Settlements';
import RiskControl from './pages/RiskControl';
import Users from './pages/Users';
import CardPool from './pages/CardPool';
import Sidebar from './components/Sidebar';

const AppContext = createContext<any>(null);
export const useApp = () => useContext(AppContext);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const showToast = (msg: string, type: string = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const info = localStorage.getItem('admin_info');
    if (token && info) {
      try { setAdmin(JSON.parse(info)); } catch {}
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const isLoginPage = location.pathname === '/login';
    if (!admin && !isLoginPage) navigate('/login');
    if (admin && isLoginPage) navigate('/');
  }, [location.pathname, admin, authChecked, navigate]);

  if (!authChecked) return null;

  return (
    <AppContext.Provider value={{ admin, setAdmin, showToast, logout: () => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_info'); setAdmin(null); navigate('/login'); } }}>
      {admin ? (
        <div className="admin-layout">
          <Sidebar />
          <div className="main-content">
            <div className="top-bar">
              <div className="title">
                {getPageTitle(location.pathname)}
              </div>
              <div className="user">
                <span className="avatar-sm">A</span>
                <span style={{ fontWeight: 500 }}>{admin.username || '管理员'}</span>
                <button className="btn btn-default btn-sm" onClick={() => {
                  if (confirm('确定要退出登录吗？')) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_info');
                    setAdmin(null);
                    navigate('/login');
                  }
                }}>退出</button>
              </div>
            </div>
            <div className="content-body">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/settlements" element={<Settlements />} />
                <Route path="/risk" element={<RiskControl />} />
                <Route path="/users" element={<Users />} />
                <Route path="/card-pool" element={<CardPool />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </AppContext.Provider>
  );
}

function getPageTitle(path: string) {
  const map: Record<string, string> = {
    '/': '📊 运营概览',
    '/products': '📦 商品管理',
    '/orders': '📋 订单管理',
    '/suppliers': '🏭 供应商管理',
    '/settlements': '💰 结算中心',
    '/risk': '🛡️ 风控中心',
    '/users': '👥 用户管理',
    '/card-pool': '🎫 卡密池管理'
  };
  return map[path] || '管理后台';
}
