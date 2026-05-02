import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import './styles.css';

const API_PORT = 18443;
const API_BASE = '/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  token: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  capacity: number;
  queueLength?: number;
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
  patient?: { name: string; phone: string };
  package?: { name: string };
  createdAt: string;
}

interface QueueItem {
  reservationId: string;
  patientId: string;
  patientName: string;
  stepNumber: number;
  estimatedTime: number;
  joinedAt: string;
  priority: number;
}

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

const ToastContext = createContext<{
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

const useToast = () => useContext(ToastContext);

const AuthContext = createContext<{
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

const useAuth = () => useContext(AuthContext);

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
          <div className="login-logo">前</div>
          <h1 className="login-title">前台管理</h1>
          <p className="login-subtitle">体检中心前台服务平台</p>
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
          <div style={{ fontSize: 12, color: '#64748b' }}>
            前台：reception / reception
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
            <div className="navbar-brand-icon">前</div>
            <span>前台管理</span>
          </div>
          
          <div className="navbar-nav">
            <a 
              onClick={() => navigate('/')}
              className={currentPath === '/' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              签到
            </a>
            <a 
              onClick={() => navigate('/queue')}
              className={currentPath === '/queue' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              队列管理
            </a>
            <a 
              onClick={() => navigate('/reservations')}
              className={currentPath === '/reservations' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              预约查询
            </a>
          </div>
          
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user?.name || '用户'}</div>
              <div className="navbar-user-role">前台接待</div>
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

const CheckInPage: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reservationCode, setReservationCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState('');

  const searchReservation = async () => {
    if (!reservationCode.trim()) {
      setError('请输入预约码');
      return;
    }

    try {
      setSearching(true);
      setError('');
      
      const data = await apiClient.get(`/reservations`, token || undefined);
      const found = data.find((r: Reservation) => 
        r.reservationCode.toUpperCase() === reservationCode.toUpperCase()
      );
      
      if (found) {
        setReservation(found);
        showToast('success', '查询成功');
      } else {
        setError('预约不存在，请检查预约码');
        setReservation(null);
      }
    } catch (err: any) {
      setError(err.message || '查询失败');
      setReservation(null);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!reservation) return;

    try {
      await apiClient.post(`/reservations/${reservation.id}/checkin`, {}, token || undefined);
      
      showToast('success', '签到成功', '已为患者生成导检路径并加入队列。');
      setReservation(null);
      setReservationCode('');
    } catch (err: any) {
      showToast('error', err.message || '签到失败');
    }
  };

  const getStatusBadge = (s: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      created: { label: '已创建', class: 'badge-secondary' },
      reserved: { label: '已预约', class: 'badge-primary' },
      checked_in: { label: '已签到', class: 'badge-warning' },
      in_examination: { label: '体检中', class: 'badge-warning' },
      report_generated: { label: '已完成', class: 'badge-success' },
      cancelled: { label: '已取消', class: 'badge-danger' },
    };
    return statusMap[s] || { label: s, class: 'badge-secondary' };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">患者签到</h1>
        <p className="page-subtitle">通过预约码查询并为患者签到</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>预约码查询</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value.toUpperCase())}
                  placeholder="请输入预约码 (如: RV26042812)"
                  className="form-input"
                  style={{ fontSize: 18, padding: '12px 16px' }}
                  onKeyDown={(e) => e.key === 'Enter' && searchReservation()}
                />
                <button
                  onClick={searchReservation}
                  disabled={searching}
                  className="btn btn-primary btn-lg"
                  style={{ minWidth: 120 }}
                >
                  {searching ? <span className="spinner"></span> : '查询'}
                </button>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 12 }}>{error}</p>}
            </div>
          </div>

          {reservation && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                      {reservation.patient?.name}
                    </h3>
                    <p style={{ fontSize: 14, color: '#64748b' }}>
                      {reservation.package?.name}
                    </p>
                  </div>
                  <span className={`badge ${getStatusBadge(reservation.status).class}`}>
                    {getStatusBadge(reservation.status).label}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-2" style={{ gap: 24, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>预约码</div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#1e293b' }}>
                      {reservation.reservationCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>联系电话</div>
                    <div style={{ fontWeight: 500 }}>{reservation.patient?.phone || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>预约日期</div>
                    <div style={{ fontWeight: 500 }}>
                      {new Date(reservation.reservationDate).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>预约时间</div>
                    <div style={{ fontWeight: 500 }}>{reservation.reservationTime}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>套餐金额</div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: '#ef4444' }}>
                      ¥{reservation.totalAmount}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>创建时间</div>
                    <div style={{ fontWeight: 500 }}>
                      {new Date(reservation.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>

                <div className="divider"></div>

                <div style={{ display: 'flex', gap: 12 }}>
                  {reservation.status === 'reserved' && (
                    <button
                      onClick={handleCheckIn}
                      className="btn btn-success btn-lg"
                      style={{ flex: 1 }}
                    >
                      📋 确认签到
                    </button>
                  )}
                  {reservation.status === 'reserved' && (
                    <button
                      onClick={() => {
                        setReservation(null);
                        setReservationCode('');
                      }}
                      className="btn btn-secondary btn-lg"
                      style={{ minWidth: 100 }}
                    >
                      取消
                    </button>
                  )}
                  {reservation.status !== 'reserved' && (
                    <button
                      onClick={() => {
                        setReservation(null);
                        setReservationCode('');
                      }}
                      className="btn btn-secondary btn-lg"
                      style={{ flex: 1 }}
                    >
                      关闭
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>快捷操作</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                className="card" 
                style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: '2px solid #e2e8f0' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                onClick={() => window.location.hash = '/queue'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📊</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>队列管理</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>查看各科室排队情况</div>
                  </div>
                </div>
              </button>

              <button 
                className="card" 
                style={{ padding: 16, textAlign: 'left', cursor: 'pointer', border: '2px solid #e2e8f0' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                onClick={() => window.location.hash = '/reservations'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>📋</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>预约查询</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>查看所有预约记录</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>签到流程</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>查询预约</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      输入患者预约码进行查询
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>确认信息</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      核对患者姓名、套餐等信息
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>确认签到</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      点击签到，系统自动生成导检路径
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    backgroundColor: '#22c55e', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>4</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>完成签到</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      患者自动加入各科室队列
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QueueManagementPage: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [queues, setQueues] = useState<Record<string, QueueItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const deptsData = await apiClient.get('/departments', token || undefined);
        setDepartments(deptsData);
        
        const s = io(`http://localhost:${API_PORT}`);
        s.on('connect', () => {
          console.log('Connected to socket server');
        });
        s.on('queue:update', (data: any) => {
          console.log('Queue updated:', data);
          setQueues(prev => ({ ...prev, [data.departmentId]: data.queue }));
        });
        setSocket(s);
        
        setLoading(false);
      } catch (error) {
        showToast('error', '加载失败');
        setLoading(false);
      }
    };
    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, showToast]);

  const totalWaiting = Object.values(queues).reduce((sum, q) => sum + q.length, 0);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">队列管理</h1>
            <p className="page-subtitle">实时监控各科室排队情况</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dcfce7', 
              color: '#166534', 
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ width: 8, height: 8, backgroundColor: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
              <span style={{ fontWeight: 500 }}>实时连接</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🏥
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{departments.length}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>科室数量</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{totalWaiting}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>等待患者</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              ✅
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>0</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>今日完成</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: 24 }}>
        {departments.map(dept => {
          const queue = queues[dept.id] || [];
          
          return (
            <div key={dept.id} className="card">
              <div className="card-header" style={{ 
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'white' }}>
                      {dept.name}
                    </h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                      容量: {dept.capacity}人
                    </p>
                  </div>
                  <div style={{ 
                    padding: '4px 12px', 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    borderRadius: 20 
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      等待: {queue.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {queue.length === 0 ? (
                  <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-state-icon" style={{ width: 48, height: 48, fontSize: 20 }}>✓</div>
                    <h3 className="empty-state-title" style={{ fontSize: 14, marginBottom: 4 }}>暂无等待患者</h3>
                    <p className="empty-state-description" style={{ fontSize: 12 }}>该科室当前无等待患者</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {queue.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: 12, 
                          backgroundColor: idx === 0 ? '#f0fdf4' : '#f8fafc', 
                          borderRadius: 8,
                          border: `2px solid ${idx === 0 ? '#86efac' : '#e2e8f0'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: 8, 
                              backgroundColor: idx === 0 ? '#22c55e' : '#64748b',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 14
                            }}>
                              {idx + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {item.patientName}
                                {idx === 0 && (
                                  <span className="badge badge-success">当前</span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                预约码: {item.reservationId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, color: '#64748b' }}>
                              预计时长: {item.estimatedTime}分钟
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
  const [searchText, setSearchText] = useState('');

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

  const filteredReservations = reservations.filter(r => 
    searchText === '' || 
    r.reservationCode.toLowerCase().includes(searchText.toLowerCase()) ||
    r.patient?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusBadge = (s: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      created: { label: '已创建', class: 'badge-secondary' },
      reserved: { label: '已预约', class: 'badge-primary' },
      checked_in: { label: '已签到', class: 'badge-warning' },
      in_examination: { label: '体检中', class: 'badge-warning' },
      report_generated: { label: '已完成', class: 'badge-success' },
      cancelled: { label: '已取消', class: 'badge-danger' },
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
        <h1 className="page-title">预约查询</h1>
        <p className="page-subtitle">查看和管理所有预约记录</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            {[
              { value: 'all', label: '全部' },
              { value: 'reserved', label: '已预约' },
              { value: 'checked_in', label: '已签到' },
              { value: 'in_examination', label: '体检中' },
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
          <input
            type="text"
            className="form-input"
            placeholder="搜索预约码/患者姓名..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: 250 }}
          />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>预约码</th>
              <th>患者姓名</th>
              <th>套餐</th>
              <th>预约时间</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <div style={{ padding: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>暂无预约记录</div>
                    <div style={{ fontSize: 14, color: '#64748b' }}>
                      {searchText ? '没有找到匹配的预约' : '该状态下暂无预约记录'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReservations.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {r.reservationCode}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.patient?.name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {r.patient?.phone || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.package?.name || '-'}</div>
                  </td>
                  <td>
                    <div>{new Date(r.reservationDate).toLocaleDateString('zh-CN')}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.reservationTime}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>¥{r.totalAmount}</span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(r.status).class}`}>
                      {getStatusBadge(r.status).label}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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
        return <CheckInPage />;
      case '/queue':
        return <QueueManagementPage />;
      case '/reservations':
        return <ReservationsPage />;
      default:
        return <CheckInPage />;
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
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
