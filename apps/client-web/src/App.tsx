import React, { useState, useEffect } from 'react';

interface Toast {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  status: string;
  isPopular: boolean;
  estimatedTime: number;
  items: {
    id: string;
    itemName: string;
    departmentId: string;
  }[];
}

interface Reservation {
  id: string;
  patientId: string;
  packageId: string;
  reservationCode: string;
  reservationDate: string;
  reservationTime: string;
  status: string;
  checkInTime: string | null;
  totalAmount: number;
  package?: Package;
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
}

interface Report {
  id: string;
  reservationId: string;
  reportNumber: string;
  status: string;
  summary: string;
  conclusion: string;
  createdAt: string;
  reservation?: Reservation;
  patient?: { name: string };
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  token: string;
}

const API_BASE = '/api';

const apiClient = {
  get: async (url: string, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${url}`, { headers });
    if (!response.ok) throw new Error('请求失败');
    return response.json();
  },
  post: async (url: string, data: any, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('请求失败');
    return response.json();
  }
};

const ToastContext = React.createContext<{
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
}>({ showToast: () => {} });

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: string; type: string; title: string; message?: string }>>([]);

  const showToast = (type: string, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className="toast">
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '!'}
                {toast.type === 'info' && 'i'}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

const AuthContext = React.createContext<{
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}>({
  user: null,
  login: async () => {},
  logout: () => {},
  token: null,
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('medical_token');
    const savedUser = localStorage.getItem('medical_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiClient.post('/auth/login', { username, password });
    const newUser: User = {
      id: data.user.id,
      username: data.user.username,
      name: data.user.name,
      role: data.user.role,
      token: data.token,
    };
    setToken(data.token);
    setUser(newUser);
    localStorage.setItem('medical_token', data.token);
    localStorage.setItem('medical_user', JSON.stringify(newUser));
    window.location.hash = '/';
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('medical_token');
    localStorage.removeItem('medical_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('warning', '请填写用户名和密码');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      showToast('success', '登录成功', '欢迎回来！');
    } catch (error) {
      showToast('error', '登录失败', '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">医</div>
          <h1 className="login-title">体检中心</h1>
          <p className="login-subtitle">客户服务平台</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              用户名 <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              密码 <span className="required">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <span className="spinner"></span> : '登 录'}
          </button>
        </form>
        
        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>测试账号：</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#64748b' }}>
            <span>患者：patient / patient</span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span>管理员：admin / admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">
          <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="navbar-brand-icon">医</div>
            <span>体检中心</span>
          </div>
          
          <div className="navbar-nav">
            <a 
              onClick={() => navigate('/')}
              className={currentPath === '/' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              首页
            </a>
            <a 
              onClick={() => navigate('/packages')}
              className={currentPath === '/packages' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              套餐选购
            </a>
            <a 
              onClick={() => navigate('/reservations')}
              className={currentPath === '/reservations' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              我的预约
            </a>
            <a 
              onClick={() => navigate('/reports')}
              className={currentPath === '/reports' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              报告查询
            </a>
          </div>
          
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user?.name || '用户'}</div>
              <div className="navbar-user-role">
                {user?.role === 'patient' ? '患者' : user?.role === 'admin' ? '管理员' : user?.role}
              </div>
            </div>
            <div className="avatar">{user?.name?.charAt(0) || '用'}</div>
            <button className="btn btn-secondary btn-sm" onClick={logout}>
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    reservations: 0,
    reports: 0,
    waiting: 0,
  });
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesData] = await Promise.all([
          apiClient.get('/packages', token || undefined),
        ]);
        setPackages(packagesData.slice(0, 3));
        
        if (token) {
          try {
            const reservationsData = await apiClient.get('/reservations', token);
            setStats({
              reservations: reservationsData.length,
              reports: 0,
              waiting: reservationsData.filter((r: Reservation) => ['reserved', 'in_examination'].includes(r.status)).length,
            });
          } catch {
            setStats({ reservations: 0, reports: 0, waiting: 0 });
          }
        }
      } catch (error) {
        showToast('error', '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, showToast]);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">欢迎回来，{user?.name || '用户'}</h1>
        <p className="page-subtitle">今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24, marginBottom: 32 }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{stats.reservations}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>我的预约</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              📄
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{stats.reports}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>体检报告</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              ⏳
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{stats.waiting}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>进行中</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>热门套餐</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/packages')}>
          查看全部 →
        </button>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24 }}>
        {packages.map(pkg => (
          <div 
            key={pkg.id} 
            className={`package-card ${pkg.isPopular ? 'popular' : ''}`}
            onClick={() => navigate(`/reservation?package=${pkg.id}`)}
          >
            <div className="package-card-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="package-card-title">{pkg.name}</h3>
                {pkg.isPopular && <span className="badge badge-warning">热门推荐</span>}
              </div>
              <span className="package-card-category" style={{ 
                backgroundColor: pkg.category === 'basic' ? '#dbeafe' : pkg.category === 'standard' ? '#dcfce7' : '#fef3c7',
                color: pkg.category === 'basic' ? '#1e40af' : pkg.category === 'standard' ? '#166534' : '#92400e',
                display: 'inline-block',
                marginTop: 8,
              }}>
                {pkg.category === 'basic' ? '基础套餐' : pkg.category === 'standard' ? '标准套餐' : '高端套餐'}
              </span>
            </div>
            <div className="package-card-body">
              <p className="package-card-description">{pkg.description}</p>
              <div className="package-card-items">
                {pkg.items?.slice(0, 4).map((item, idx) => (
                  <span key={idx} className="package-card-item-tag">{item.itemName}</span>
                ))}
                {pkg.items?.length > 4 && <span className="package-card-item-tag">+{pkg.items.length - 4}项</span>}
              </div>
            </div>
            <div className="package-card-footer">
              <div className="package-card-price">
                <span className="package-card-price-current">¥{pkg.price}</span>
                <span className="package-card-price-original">¥{pkg.originalPrice}</span>
              </div>
              <span style={{ fontSize: 13, color: '#64748b' }}>约{pkg.estimatedTime}分钟</span>
            </div>
          </div>
        ))}
      </div>

      <div className="divider" style={{ marginTop: 32 }}></div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>快速入口</h3>
          <div className="grid grid-cols-4" style={{ gap: 16 }}>
            <button 
              className="card" 
              style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid #e2e8f0' }}
              onClick={() => navigate('/packages')}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🩺</div>
              <div style={{ fontWeight: 500 }}>套餐选购</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>选择适合您的套餐</div>
            </button>
            
            <button 
              className="card" 
              style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid #e2e8f0' }}
              onClick={() => navigate('/reservations')}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 500 }}>我的预约</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>查看预约状态</div>
            </button>
            
            <button 
              className="card" 
              style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid #e2e8f0' }}
              onClick={() => navigate('/reports')}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 500 }}>报告查询</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>查看体检报告</div>
            </button>
            
            <div className="card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid #e2e8f0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 500 }}>咨询服务</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>在线医生咨询</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PackageList: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await apiClient.get('/packages', token || undefined);
        setPackages(data);
      } catch (error) {
        showToast('error', '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [token, showToast]);

  const filteredPackages = category === 'all' 
    ? packages 
    : packages.filter(p => p.category === category);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">套餐选购</h1>
        <p className="page-subtitle">选择适合您的体检套餐</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
          {[
            { value: 'all', label: '全部套餐' },
            { value: 'basic', label: '基础套餐' },
            { value: 'standard', label: '标准套餐' },
            { value: 'premium', label: '高端套餐' },
          ].map(item => (
            <button
              key={item.value}
              className={`btn ${category === item.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPackages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3 className="empty-state-title">暂无套餐</h3>
          <p className="empty-state-description">该分类下暂无套餐</p>
        </div>
      ) : (
        <div className="grid grid-cols-3" style={{ gap: 24 }}>
          {filteredPackages.map(pkg => (
            <div 
              key={pkg.id} 
              className={`package-card ${pkg.isPopular ? 'popular' : ''}`}
              onClick={() => navigate(`/reservation?package=${pkg.id}`)}
            >
              <div className="package-card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="package-card-title">{pkg.name}</h3>
                  {pkg.isPopular && <span className="badge badge-warning">热门</span>}
                </div>
                <span className="package-card-category" style={{ 
                  backgroundColor: pkg.category === 'basic' ? '#dbeafe' : pkg.category === 'standard' ? '#dcfce7' : '#fef3c7',
                  color: pkg.category === 'basic' ? '#1e40af' : pkg.category === 'standard' ? '#166534' : '#92400e',
                  display: 'inline-block',
                  marginTop: 8,
                }}>
                  {pkg.category === 'basic' ? '基础套餐' : pkg.category === 'standard' ? '标准套餐' : '高端套餐'}
                </span>
              </div>
              <div className="package-card-body">
                <p className="package-card-description">{pkg.description}</p>
                <div className="package-card-items">
                  {pkg.items?.map((item, idx) => (
                    <span key={idx} className="package-card-item-tag">{item.itemName}</span>
                  ))}
                </div>
                <div className="divider" style={{ marginTop: 12, marginBottom: 12 }}></div>
                <div className="grid grid-cols-3" style={{ gap: 12, fontSize: 13, color: '#64748b' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{pkg.estimatedTime}分钟</div>
                    <div>预计时长</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{pkg.items?.length || 0}项</div>
                    <div>检查项目</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {pkg.applicableGender === 'all' ? '不限' : pkg.applicableGender === 'male' ? '男性' : '女性'}
                    </div>
                    <div>适用人群</div>
                  </div>
                </div>
              </div>
              <div className="package-card-footer">
                <div className="package-card-price">
                  <span className="package-card-price-current">¥{pkg.price}</span>
                  <span className="package-card-price-original">¥{pkg.originalPrice}</span>
                </div>
                <button className="btn btn-primary">
                  立即预约
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReservationForm: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    packageId: '',
    reservationDate: '',
    reservationTime: '',
    patientName: '',
    patientPhone: '',
    patientIdCard: '',
    patientGender: '',
    patientAge: '',
    patientEmail: '',
  });

  const [availableSlots, setAvailableSlots] = useState<Array<{
    date: string;
    slots: Array<{ time: string; available: boolean }>;
  }>>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await apiClient.get('/packages', token || undefined);
        setPackages(data);
        
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const packageId = params.get('package');
        if (packageId) {
          const pkg = data.find((p: Package) => p.id === packageId);
          if (pkg) {
            setSelectedPackage(pkg);
            setFormData(prev => ({ ...prev, packageId }));
            fetchSlots(pkg.id);
          }
        }
      } catch (error) {
        showToast('error', '加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [token, showToast]);

  const fetchSlots = async (packageId: string) => {
    try {
      const data = await apiClient.get(`/packages/${packageId}/available-slots`, token || undefined);
      setAvailableSlots(data);
    } catch (error) {
      showToast('error', '获取可预约时段失败');
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData(prev => ({ ...prev, packageId: pkg.id, reservationDate: '', reservationTime: '' }));
    fetchSlots(pkg.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.packageId) {
      showToast('warning', '请选择套餐');
      return;
    }
    if (!formData.reservationDate || !formData.reservationTime) {
      showToast('warning', '请选择预约日期和时间');
      return;
    }
    if (!formData.patientName || !formData.patientPhone) {
      showToast('warning', '请填写姓名和电话');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/reservations', {
        ...formData,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined,
      }, token || undefined);
      
      showToast('success', '预约成功', '您可以在"我的预约"中查看预约状态');
      
      setTimeout(() => {
        window.location.hash = '/reservations';
      }, 1500);
    } catch (error) {
      showToast('error', '预约失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">预约体检</h1>
        <p className="page-subtitle">选择套餐和时间完成预约</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleSubmit}>
            {!selectedPackage && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>选择套餐</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1" style={{ gap: 16 }}>
                    {packages.map(pkg => (
                      <div
                        key={pkg.id}
                        className="card"
                        style={{ 
                          cursor: 'pointer', 
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handlePackageSelect(pkg)}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                      >
                        <div className="card-body" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                              🩺
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>{pkg.name}</div>
                              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                {pkg.items?.length}项检查 · 约{pkg.estimatedTime}分钟
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>¥{pkg.price}</span>
                            <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>¥{pkg.originalPrice}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedPackage && (
              <>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>已选套餐</h3>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedPackage(null); setFormData(prev => ({ ...prev, packageId: '' })); }}
                    >
                      更换套餐
                    </button>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                        🩺
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedPackage.name}</div>
                        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{selectedPackage.description}</div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: '#64748b' }}>
                          <span>{selectedPackage.items?.length}项检查</span>
                          <span>约{selectedPackage.estimatedTime}分钟</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>¥{selectedPackage.price}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>¥{selectedPackage.originalPrice}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>选择预约时间</h3>
                  </div>
                  <div className="card-body">
                    <div style={{ marginBottom: 24 }}>
                      <label className="form-label">选择日期</label>
                      {availableSlots.length > 0 ? (
                        <div className="date-picker">
                          {availableSlots.map(day => (
                            <button
                              type="button"
                              key={day.date}
                              className={`date-picker-item ${formData.reservationDate === day.date ? 'selected' : ''}`}
                              onClick={() => setFormData(prev => ({ ...prev, reservationDate: day.date, reservationTime: '' }))}
                            >
                              <div className="date-picker-day">
                                {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                              </div>
                              <div className="date-picker-date">
                                {new Date(day.date).getDate()}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state" style={{ padding: 32 }}>
                          <div className="spinner"></div>
                          <p className="loading-text" style={{ marginTop: 8 }}>加载时段中...</p>
                        </div>
                      )}
                    </div>

                    {formData.reservationDate && (
                      <div>
                        <label className="form-label">选择时间</label>
                        <div className="time-slot-grid">
                          {availableSlots
                            .find(d => d.date === formData.reservationDate)
                            ?.slots.map(slot => (
                              <button
                                type="button"
                                key={slot.time}
                                className={`time-slot ${formData.reservationTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                disabled={!slot.available}
                                onClick={() => setFormData(prev => ({ ...prev, reservationTime: slot.time }))}
                              >
                                {slot.time}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header">
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>体检人信息</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-2" style={{ gap: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">
                          姓名 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="请输入姓名"
                          value={formData.patientName}
                          onChange={e => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">
                          手机号 <span className="required">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="请输入手机号"
                          value={formData.patientPhone}
                          onChange={e => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">身份证号</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="请输入身份证号"
                          value={formData.patientIdCard}
                          onChange={e => setFormData(prev => ({ ...prev, patientIdCard: e.target.value }))}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">性别</label>
                        <select
                          className="form-input form-select"
                          value={formData.patientGender}
                          onChange={e => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                        >
                          <option value="">请选择</option>
                          <option value="male">男</option>
                          <option value="female">女</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">年龄</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="请输入年龄"
                          value={formData.patientAge}
                          onChange={e => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">邮箱</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="请输入邮箱（用于接收报告）"
                          value={formData.patientEmail}
                          onChange={e => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 14, color: '#64748b' }}>预约金额：</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginLeft: 8 }}>
                        ¥{selectedPackage?.price || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => window.location.hash = '/packages'}>
                        返回
                      </button>
                      <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                        {submitting ? <span className="spinner"></span> : '确认预约'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>预约须知</h3>
            </div>
            <div className="card-body">
              <div style={{ fontSize: 14, lineHeight: 2, color: '#64748b' }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>📋 体检前准备：</span>
                </div>
                <div style={{ marginBottom: 8, paddingLeft: 8 }}>
                  • 体检前一天晚餐清淡，22:00后禁食禁水</div>
                <div style={{ marginBottom: 8, paddingLeft: 8 }}>
                  • 体检当天请空腹，不要服药者请告知医生</div>
                <div style={{ marginBottom: 16, paddingLeft: 8 }}>
                  • 女性请避开生理期</div>

                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>⏰ 签到时间：</span>
                </div>
                <div style={{ marginBottom: 16, paddingLeft: 8 }}>
                  请在预约时间前15分钟到达前台签到</div>

                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>📄 携带证件：</span>
                </div>
                <div style={{ paddingLeft: 8 }}>
                  请携带身份证原件</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReservationsPage: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, [token, status, showToast]);

  const fetchReservations = async () => {
    try {
      const url = status === 'all' ? '/reservations' : `/reservations?status=${status}`;
      const data = await apiClient.get(url, token || undefined);
      setReservations(data);
    } catch (error) {
      showToast('error', '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (s: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      created: { label: '已创建', class: 'badge-secondary' },
      reserved: { label: '已预约', class: 'badge-primary' },
      checked_in: { label: '已签到', class: 'badge-warning' },
      in_examination: { label: '检查中', class: 'badge-warning' },
      examination_completed: { label: '检查完成', class: 'badge-success' },
      report_generated: { label: '报告已出', class: 'badge-success' },
      cancelled: { label: '已取消', class: 'badge-danger' },
    };
    return statusMap[s] || { label: s, class: 'badge-secondary' };
  };

  const getStatusText = (s: string) => {
    return getStatusBadge(s).label;
  };

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    
    try {
      await apiClient.post(`/reservations/${id}/cancel`, {}, token || undefined);
      showToast('success', '取消成功');
      fetchReservations();
    } catch (error) {
      showToast('error', '取消失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">我的预约</h1>
        <p className="page-subtitle">查看和管理您的体检预约</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
          {[
            { value: 'all', label: '全部' },
            { value: 'reserved', label: '已预约' },
            { value: 'in_examination', label: '检查中' },
            { value: 'report_generated', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ].map(item => (
            <button
              key={item.value}
              className={`btn ${status === item.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">暂无预约</h3>
          <p className="empty-state-description">您还没有任何体检预约</p>
          <button className="btn btn-primary" onClick={() => navigate('/packages')}>
            去预约
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>预约编号</th>
                <th>套餐名称</th>
                <th>预约时间</th>
                <th>金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => (
              <tr key={reservation.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{reservation.reservationCode}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(reservation.createdAt).toLocaleString('zh-CN')}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{reservation.package?.name}</div>
                </td>
                <td>
                  <div>{new Date(reservation.reservationDate).toLocaleDateString('zh-CN')}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{reservation.reservationTime}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>¥{reservation.totalAmount}</span>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(reservation.status).class}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['reserved', 'checked_in'].includes(reservation.status) && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(reservation.id)}
                      >
                        取消预约
                      </button>
                    )}
                    {reservation.status === 'report_generated' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/reports')}
                      >
                        查看报告
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ReportsPage: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiClient.get('/reports', token || undefined);
        setReports(data);
      } catch (error) {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token, showToast]);

  const getStatusBadge = (s: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      draft: { label: '草稿', class: 'badge-secondary' },
      reviewed: { label: '已审核', class: 'badge-success' },
    };
    return statusMap[s] || { label: s, class: 'badge-secondary' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">报告查询</h1>
        <p className="page-subtitle">查看您的体检报告</p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3 className="empty-state-title">暂无报告</h3>
          <p className="empty-state-description">您还没有任何体检报告</p>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>
            完成体检后，报告会在3-5个工作日内生成
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: 24 }}>
          {reports.map(report => (
            <div key={report.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{report.reservation?.package?.name || '体检报告'}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    报告编号：{report.reportNumber}
                  </div>
                </div>
                <span className={`badge ${getStatusBadge(report.status).class}`}>
                  {getStatusBadge(report.status).label}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>摘要</div>
                <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
                  {report.summary}
                </div>
              </div>
              {report.conclusion && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>结论</div>
                  <div style={{ fontSize: 14, color: '#333' }}>{report.conclusion}</div>
                </div>
              )}
              <div className="divider"></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  生成时间：{new Date(report.createdAt).toLocaleString('zh-CN')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm">查看详情</button>
                  <button className="btn btn-primary btn-sm">下载PDF</button>
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HashRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    window.location.hash = '/login';
    return null;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/login');

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.slice(1) || (user ? '/' : '/login');
      setCurrentPath(path);
    };
    
    if (!window.location.hash) {
      window.location.hash = user ? '/' : '/login';
    }
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const renderPage = () => {
    if (currentPath === '/login' || !user) {
      return <LoginPage />;
    }

    const path = currentPath.split('?')[0];

    switch (path) {
      case '/':
        return <HomePage />;
      case '/packages':
        return <PackageList />;
      case '/reservation':
        return <ReservationForm />;
      case '/reservations':
        return <ReservationsPage />;
      case '/reports':
        return <ReportsPage />;
      default:
        return <HomePage />;
    }
  };

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main style={{ maxWidth: 80 * 16, margin: '0 auto', padding: '24px 16px' }}>
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
