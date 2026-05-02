import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { io, Socket } from 'socket.io-client';
import './styles.css';

const API_BASE = '/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  token: string;
  departmentId?: string;
  departmentName?: string;
}

interface QueueItem {
  reservationId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  stepNumber: number;
  estimatedTime: number;
  joinedAt: string;
  priority: number;
  reservationCode: string;
  packageName?: string;
  status?: string;
}

interface ExamValue {
  id: string;
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
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
      departmentId: data.user.departmentId,
      departmentName: data.user.departmentName,
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
          <div className="login-logo">医</div>
          <h1 className="login-title">医生工作站</h1>
          <p className="login-subtitle">体检中心医生工作平台</p>
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
            医生：doctor / doctor
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
            <span>医生工作站</span>
            {user?.departmentName && (
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>
                - {user.departmentName}
              </span>
            )}
          </div>
          
          <div className="navbar-nav">
            <a 
              onClick={() => navigate('/')}
              className={currentPath === '/' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              检查录入
            </a>
            <a 
              onClick={() => navigate('/queue')}
              className={currentPath === '/queue' ? 'active' : ''}
              style={{ cursor: 'pointer' }}
            >
              队列管理
            </a>
          </div>
          
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user?.name || '用户'}</div>
              <div className="navbar-user-role">
                {user?.role === 'doctor' ? '医生' : user?.role}
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

const ExaminationPage: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
  const [examValues, setExamValues] = useState<ExamValue[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [calling, setCalling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchQueue();
        
        const s = io('http://localhost:18443');
        s.on('connect', () => {
          console.log('Doctor connected to socket server');
        });
        s.on('queue:update', (data: any) => {
          console.log('Queue updated:', data);
          if (data.departmentId === user?.departmentId) {
            setQueue(data.queue || []);
          }
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
  }, [token, user?.departmentId]);

  const fetchQueue = async () => {
    try {
      const deptId = user?.departmentId || 'dept_001';
      const data = await apiClient.get(`/departments/${deptId}/queue`, token || undefined);
      setQueue(data.queue || []);
    } catch (error) {
      console.error('Fetch queue failed:', error);
    }
  };

  const callNextPatient = async () => {
    try {
      setCalling(true);
      const deptId = user?.departmentId || 'dept_001';
      const data = await apiClient.post(`/departments/${deptId}/call-next`, {}, token || undefined);
      
      if (data.patient) {
        setCurrentPatient(data.patient);
        setExamValues([
          { id: '1', name: '', value: '', unit: '', normalRange: '', isAbnormal: false },
        ]);
        setConclusion('');
        showToast('success', '叫号成功', `当前患者：${data.patient.patientName}`);
      } else {
        showToast('warning', '暂无等待患者', '该科室当前没有等待的患者');
      }
    } catch (error) {
      showToast('error', '叫号失败');
    } finally {
      setCalling(false);
    }
  };

  const addExamValue = () => {
    setExamValues([...examValues, {
      id: Date.now().toString(),
      name: '',
      value: '',
      unit: '',
      normalRange: '',
      isAbnormal: false,
    }]);
  };

  const updateExamValue = (index: number, field: string, value: any) => {
    const newValues = [...examValues];
    newValues[index] = { ...newValues[index], [field]: value };
    setExamValues(newValues);
  };

  const removeExamValue = (index: number) => {
    setExamValues(examValues.filter((_, i) => i !== index));
  };

  const submitResult = async () => {
    if (!currentPatient) {
      showToast('warning', '请先选择患者');
      return;
    }

    const validValues = examValues.filter(v => v.name.trim() && v.value.trim());
    if (validValues.length === 0) {
      showToast('warning', '请至少输入一项检查结果');
      return;
    }

    try {
      setSubmitting(true);
      const deptId = user?.departmentId || 'dept_001';
      
      await apiClient.post(
        `/examinations/submit`,
        {
          reservationId: currentPatient.reservationId,
          departmentId: deptId,
          values: validValues,
          conclusion,
        },
        token || undefined
      );

      showToast('success', '提交成功', '检查结果已提交，患者将自动进入下一检查科室');
      setCurrentPatient(null);
      setExamValues([{ id: '1', name: '', value: '', unit: '', normalRange: '', isAbnormal: false }]);
      setConclusion('');
      fetchQueue();
    } catch (error: any) {
      showToast('error', '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelCurrentPatient = () => {
    setCurrentPatient(null);
    setExamValues([{ id: '1', name: '', value: '', unit: '', normalRange: '', isAbnormal: false }]);
    setConclusion('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  const waitingCount = queue.filter(q => q.status !== 'in_examination').length;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">检查录入</h1>
            <p className="page-subtitle">叫号并录入患者检查结果</p>
          </div>
          <button
            onClick={callNextPatient}
            disabled={calling}
            className="btn btn-success btn-lg"
            style={{ paddingLeft: 32, paddingRight: 32 }}
          >
            {calling ? <><span className="spinner"></span> 叫号中...</> : '🔔 叫下一位患者'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24 }}>
        <div style={{ gridColumn: 'span 1' }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>当前患者</h3>
            </div>
            <div className="card-body">
              {currentPatient ? (
                <div className="patient-info-card current">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div className="current-number-display">1</div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                        {currentPatient.patientName}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        预约码：{currentPatient.reservationCode}
                      </div>
                    </div>
                  </div>
                  <div className="divider" style={{ marginTop: 12, marginBottom: 12 }}></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>预约套餐</div>
                      <div style={{ fontWeight: 500 }}>{currentPatient.packageName || '-'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>联系电话</div>
                      <div style={{ fontWeight: 500 }}>{currentPatient.patientPhone || '-'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>预计时长</div>
                      <div style={{ fontWeight: 500 }}>{currentPatient.estimatedTime}分钟</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 2 }}>优先级</div>
                      <div style={{ fontWeight: 500 }}>
                        {currentPatient.priority === 1 ? '普通' : currentPatient.priority === 2 ? '优先' : '加急'}
                      </div>
                    </div>
                  </div>
                  <div className="divider" style={{ marginTop: 16, marginBottom: 16 }}></div>
                  <button
                    onClick={cancelCurrentPatient}
                    className="btn btn-secondary btn-full"
                  >
                    取消当前患者
                  </button>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div className="empty-state-icon" style={{ width: 48, height: 48, fontSize: 18 }}>🩺</div>
                  <h3 className="empty-state-title" style={{ fontSize: 14 }}>暂无当前患者</h3>
                  <p className="empty-state-description" style={{ fontSize: 12 }}>
                    请点击上方"叫下一位患者"开始检查
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>等待队列</h3>
                <span className="badge badge-warning">等待: {waitingCount}</span>
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {queue.length === 0 ? (
                <div className="empty-state" style={{ padding: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>暂无等待患者</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {queue.map((item, idx) => (
                    <div 
                      key={item.reservationId}
                      className="card"
                      style={{ 
                        padding: 12, 
                        border: item.status === 'in_examination' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                        backgroundColor: item.status === 'in_examination' ? '#f0fdf4' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 6, 
                          backgroundColor: item.status === 'in_examination' ? '#22c55e' : '#f1f5f9',
                          color: item.status === 'in_examination' ? '#fff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 13
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {item.patientName}
                            {item.status === 'in_examination' && (
                              <span className="badge badge-success" style={{ marginLeft: 8 }}>检查中</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {item.reservationCode}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          {currentPatient ? (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>检查结果录入</h3>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <label className="form-label" style={{ marginBottom: 0, fontSize: 14 }}>检查指标</label>
                    <button
                      onClick={addExamValue}
                      className="btn btn-primary btn-sm"
                    >
                      + 添加指标
                    </button>
                  </div>

                  <div className="exam-header-row">
                    <div>指标名称</div>
                    <div>检测值</div>
                    <div>单位</div>
                    <div>参考范围</div>
                    <div>异常</div>
                    <div>操作</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {examValues.map((item, index) => (
                      <div key={item.id} className="exam-item-row">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateExamValue(index, 'name', e.target.value)}
                          placeholder="如: 血压"
                          className="form-input"
                          style={{ marginBottom: 0 }}
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => updateExamValue(index, 'value', e.target.value)}
                          placeholder="如: 120/80"
                          className="form-input"
                          style={{ marginBottom: 0 }}
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateExamValue(index, 'unit', e.target.value)}
                          placeholder="单位"
                          className="form-input"
                          style={{ marginBottom: 0, paddingRight: 8 }}
                        />
                        <input
                          type="text"
                          value={item.normalRange}
                          onChange={(e) => updateExamValue(index, 'normalRange', e.target.value)}
                          placeholder="如: 90-140/60-90"
                          className="form-input"
                          style={{ marginBottom: 0 }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={item.isAbnormal}
                              onChange={(e) => updateExamValue(index, 'isAbnormal', e.target.checked)}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            onClick={() => removeExamValue(index)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 12px' }}
                            disabled={examValues.length === 1}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {examValues.length === 0 && (
                    <div className="empty-state" style={{ padding: 32, border: '2px dashed #e2e8f0', borderRadius: 8 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                      <div style={{ fontSize: 14, color: '#94a3b8' }}>点击上方"添加指标"按钮开始录入检查结果</div>
                    </div>
                  )}
                </div>

                <div className="divider"></div>

                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">检查结论</label>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="请输入检查结论（可选）..."
                    rows={4}
                    className="form-input form-textarea"
                  />
                </div>

                <div className="divider"></div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    onClick={cancelCurrentPatient}
                    className="btn btn-secondary btn-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitResult}
                    disabled={submitting}
                    className="btn btn-primary btn-lg"
                    style={{ paddingLeft: 32, paddingRight: 32 }}
                  >
                    {submitting ? <><span className="spinner"></span> 提交中...</> : '提交结果'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ padding: 80, textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🩺</div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>请先叫号选择患者</h2>
                <p style={{ fontSize: 14, color: '#64748b' }}>
                  点击左上角"叫下一位患者"按钮开始检查工作
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QueueManagementPage: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchQueue();
        
        const s = io('http://localhost:18443');
        s.on('connect', () => {
          console.log('Doctor connected to socket server');
        });
        s.on('queue:update', (data: any) => {
          console.log('Queue updated:', data);
          if (data.departmentId === user?.departmentId) {
            setQueue(data.queue || []);
          }
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
  }, [token, user?.departmentId]);

  const fetchQueue = async () => {
    try {
      const deptId = user?.departmentId || 'dept_001';
      const data = await apiClient.get(`/departments/${deptId}/queue`, token || undefined);
      setQueue(data.queue || []);
    } catch (error) {
      console.error('Fetch queue failed:', error);
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

  const inExaminationCount = queue.filter(q => q.status === 'in_examination').length;
  const waitingCount = queue.filter(q => q.status !== 'in_examination').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">队列管理</h1>
        <p className="page-subtitle">实时监控本科室排队情况</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{queue.length}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>总队列数</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              🏥
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{inExaminationCount}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>检查中</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
              ⏳
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{waitingCount}</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>等待中</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>
            {user?.departmentName || '本科室'}队列详情
          </h3>
        </div>
        {queue.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">✓</div>
              <h3 className="empty-state-title">暂无患者</h3>
              <p className="empty-state-description">该科室当前没有等待的患者</p>
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>序号</th>
                <th>患者姓名</th>
                <th>预约码</th>
                <th>套餐</th>
                <th>状态</th>
                <th>预计时长</th>
                <th>优先级</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item, idx) => (
                <tr key={item.reservationId} style={{ backgroundColor: item.status === 'in_examination' ? '#f0fdf4' : undefined }}>
                  <td>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 8, 
                      backgroundColor: item.status === 'in_examination' ? '#22c55e' : '#f1f5f9',
                      color: item.status === 'in_examination' ? '#fff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: 14
                    }}>
                      {idx + 1}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.patientName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.patientPhone}</div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace' }}>{item.reservationCode}</div>
                  </td>
                  <td>
                    <div>{item.packageName || '-'}</div>
                  </td>
                  <td>
                    {item.status === 'in_examination' ? (
                      <span className="badge badge-success">检查中</span>
                    ) : (
                      <span className="badge badge-warning">等待中</span>
                    )}
                  </td>
                  <td>
                    <div>{item.estimatedTime}分钟</div>
                  </td>
                  <td>
                    <div>
                      {item.priority === 1 ? (
                        <span className="badge badge-secondary">普通</span>
                      ) : item.priority === 2 ? (
                        <span className="badge badge-warning">优先</span>
                      ) : (
                        <span className="badge badge-danger">加急</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
        return <ExaminationPage />;
      case '/queue':
        return <QueueManagementPage />;
      default:
        return <ExaminationPage />;
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
