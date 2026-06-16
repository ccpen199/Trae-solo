import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import Home from './pages/Home';
import Category from './pages/Category';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import OrderDetail from './pages/OrderDetail';
import Share from './pages/Share';
import Commission from './pages/Commission';
import AdminPortal from './pages/AdminPortal';
import TabBar from './components/TabBar';

const UserContext = createContext<any>(null);
export const useUser = () => useContext(UserContext);

const ToastContext = createContext<{ show: (msg: string, type?: string) => void }>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: string; visible: boolean }>({ msg: '', type: '', visible: false });
  const [authChecked, setAuthChecked] = useState(false);

  const showToast = (msg: string, type: string = 'info') => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(s => ({ ...s, visible: false })), 2000);
  };

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const info = localStorage.getItem('user_info');
    if (token && info) {
      try {
        setUser(JSON.parse(info));
      } catch {}
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const protectedRoutes = ['/orders', '/profile', '/commission', '/share'];
    const orderDetail = location.pathname.startsWith('/order/');
    if ((protectedRoutes.includes(location.pathname) || orderDetail) && !user) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [location.pathname, user, authChecked, navigate]);

  const tabRoutes = ['/', '/category', '/orders', '/profile'];
  const showTabBar = tabRoutes.includes(location.pathname);

  return (
    <UserContext.Provider value={{ user, setUser, logout: () => { localStorage.removeItem('user_token'); localStorage.removeItem('user_info'); setUser(null); navigate('/'); } }}>
      <ToastContext.Provider value={{ show: showToast }}>
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category" element={<Category />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/share" element={<Share />} />
            <Route path="/commission" element={<Commission />} />
            <Route path="/admin-portal" element={<AdminPortal />} />
          </Routes>
          {showTabBar && <TabBar />}
          {toast.visible && (
            <div className="toast" style={toast.type === 'error' ? { background: '#ff4d4f' } : toast.type === 'success' ? { background: '#52c41a' } : {}}>
              {toast.msg}
            </div>
          )}
        </div>
      </ToastContext.Provider>
    </UserContext.Provider>
  );
}
