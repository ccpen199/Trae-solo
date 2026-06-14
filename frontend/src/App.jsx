import React, { useEffect, useMemo, useState, createContext, useContext } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  FileCheck2,
  Gavel,
  Landmark,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  LogOut,
  Settings,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Camera,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Lock,
  Globe,
  Layers,
  Calendar,
  BookOpen,
  Tags,
  TrendingUp,
  Activity,
  Database,
  Eye,
  X
} from 'lucide-react';
import api, { http } from './api.js';
import { useAuthStore } from './store.js';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

const ToastContext = createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  return useContext(ToastContext);
}

function useAsync(loader, fallback, deps = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loader()
      .then((value) => {
        if (mounted) setData(value);
      })
      .catch(() => {
        if (mounted) setData(fallback);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, deps);

  return { data, loading };
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

const nav = [
  ['/', '服务大厅', Landmark],
  ['/profile', '个人中心', UserRound],
  ['/contracts', '劳动合同', FileCheck2],
  ['/rights', '劳动维权', Gavel],
  ['/jobs', '招考平台', Briefcase],
  ['/institutions', '机构地图', MapPin],
  ['/policies', '政策中心', Building2],
  ['/consult', '咨询中心', MessageCircle]
];

function Shell() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const handleLogout = async () => {
    await logout();
    showToast('已安全退出', 'success');
    navigate('/login');
  };
  
  return (
    <div className="app-layout">
      <header className="topbar">
        <Link to="/" className="brand">
          <Landmark size={26} />
          <span>云南省人力资源和社会保障公共服务数字底座</span>
        </Link>
        <nav className="main-nav">
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              <Settings size={16} />
              <span>管理后台</span>
            </NavLink>
          )}
        </nav>
        <div className="topbar-right">
          <Bell size={20} className="icon-btn" />
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-info">
                <div className="avatar">{user?.name?.charAt(0) || '用'}</div>
                <div className="user-details">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{user?.role === 'admin' ? '管理员' : '参保人员'}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="icon-btn" title="退出登录">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="primary small">
              登录
            </button>
          )}
        </div>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
          <Route path="/rights" element={<ProtectedRoute><Rights /></ProtectedRoute>} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/consult" element={<Consult />} />
          <Route path="/admin/*" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>© 2026 云南省人力资源和社会保障厅 · 公共服务数字底座 v1.0.0</p>
        <p>技术支持：云南省人社信息中心 · 服务热线：12333</p>
      </footer>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { data: summary } = useAsync(
    () => isAuthenticated
      ? api.get('/insurance/summary')
      : Promise.resolve({ totalPaymentMonths: 86, totalAccountBalance: 186420.5 }),
    {},
    [isAuthenticated]
  );
  const services = [
    ['个人权益查询', '五险参保状态、缴费明细、账户余额', '/profile', ShieldCheck],
    ['劳动合同管理', '在线签署、变更记录、存证查询', '/contracts', FileCheck2],
    ['待遇资格认证', '人脸活体检测、认证历史、亲友代办', '/profile', BadgeCheck],
    ['劳动维权服务', '在线举证、材料上传、进度查询', '/rights', Gavel],
    ['招考招聘平台', '岗位搜索、智能匹配、简历投递', '/jobs', Briefcase],
    ['服务机构地图', '机构检索、距离排序、窗口预约', '/institutions', MapPin],
    ['政策法规库', '政策查询、智能标签、关联推送', '/policies', Building2],
    ['咨询问答中心', '智能客服、高频问题、语义搜索', '/consult', MessageCircle]
  ];

  return (
    <div className="stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">电子社保卡统一身份认证</p>
          <h1>一网通办、跨省通办、全程网办</h1>
          <p>集成五险权益、劳动合同、待遇资格认证、劳动维权、招考匹配和机构检索。</p>
        </div>
        <button onClick={() => navigate('/login')} className="primary">电子社保卡登录</button>
      </section>

      <section className="stats-grid">
        <Metric label="总缴费月数" value={summary.totalPaymentMonths || 86} suffix="月" />
        <Metric label="账户权益余额" value={summary.totalAccountBalance || 186420.5} suffix="元" />
        <Metric label="待办提醒" value={3} suffix="项" />
        <Metric label="可办服务" value={42} suffix="项" />
      </section>

      <section className="module-grid">
        {services.map(([title, desc, to, Icon]) => (
          <Link to={to} className="module-card" key={title}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value, suffix }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{suffix}</em>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const { showToast } = useToast();
  const [form, setForm] = useState({ idCard: '530102199001011234', password: 'password123', authType: 'password' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    const result = await login(form.idCard, form.password, form.authType);
    setLoading(false);
    
    if (result.success) {
      showToast('登录成功', 'success');
      setTimeout(() => {
        navigate('/profile');
      }, 500);
    } else {
      showToast(result.message || '登录失败', 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Landmark size={48} className="brand-icon" />
          <h1>云南省人力资源和社会保障</h1>
          <h2>公共服务数字底座</h2>
          <p className="login-subtitle">电子社保卡统一身份认证</p>
        </div>
        
        <div className="login-tabs">
          <button 
            className={activeTab === 'password' ? 'active' : ''} 
            onClick={() => setActiveTab('password')}
          >
            密码登录
          </button>
          <button 
            className={activeTab === 'social' ? 'active' : ''}
            onClick={() => setActiveTab('social')}
          >
            电子社保卡
          </button>
          <button 
            className={activeTab === 'face' ? 'active' : ''}
            onClick={() => setActiveTab('face')}
          >
            人脸识别
          </button>
        </div>

        {activeTab === 'password' && (
          <form className="form" onSubmit={submit}>
            <div className="form-group">
              <label>身份证号 / 管理账号</label>
              <input 
                value={form.idCard} 
                onChange={(e) => setForm({ ...form, idCard: e.target.value })}
                placeholder="请输入身份证号或管理员账号"
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input 
                type="password" 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="primary full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        {activeTab === 'social' && (
          <div className="social-login">
            <div className="qr-placeholder">
              <BadgeCheck size={64} />
              <p>请打开电子社保卡APP扫码</p>
              <p className="hint">或使用微信/支付宝扫一扫</p>
            </div>
          </div>
        )}

        {activeTab === 'face' && (
          <div className="face-login">
          <div className="face-placeholder">
            <Camera size={64} />
            <p>人脸识别认证</p>
            <p className="hint">请将面部置于取景框内</p>
            <button className="primary" onClick={submit}>开始认证</button>
          </div>
          </div>
        )}

        <div className="login-hint">
          <p>测试账号：</p>
          <p>• 个人用户：身份证 530102199001011234 / 密码 password123</p>
          <p>• 管理员：admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { data: profile } = useAsync(() => api.get('/user/profile'), { user: {} }, []);
  const { data: summary } = useAsync(() => api.get('/insurance/summary'), {}, []);
  const { data: certifications } = useAsync(() => api.get('/certification'), [], []);
  const { data: transferRecords } = useAsync(() => api.get('/insurance/transfer'), [], []);
  const [activeTab, setActiveTab] = useState('overview');
  const [certifying, setCertifying] = useState(false);
  const [billYear, setBillYear] = useState('2026');
  const [paymentType, setPaymentType] = useState('pension');
  const [paymentPage, setPaymentPage] = useState(1);
  const { data: paymentData } = useAsync(
    () => api.get(`/insurance/${paymentType}/payments?page=${paymentPage}&pageSize=12`),
    { list: [], total: 0 },
    [paymentType, paymentPage]
  );

  const insurance = ['pension', 'medical', 'unemployment', 'injury', 'maternity'];
  const labels = { pension: '养老保险', medical: '医疗保险', unemployment: '失业保险', injury: '工伤保险', maternity: '生育保险' };
  const colors = ['#1E40AF', '#0D9488', '#D97706', '#DC2626', '#7C3AED'];

  const handleCertification = async () => {
    setCertifying(true);
    try {
      const result = await http.post('/certification', { type: 'pension' });
      showToast(`认证成功！活体检测 ${result.livenessScore}%，人脸匹配 ${result.faceMatchScore}%`, 'success');
    } catch (e) {
      showToast(e.message || '认证失败', 'error');
    } finally {
      setCertifying(false);
    }
  };

  const chartData = useMemo(() => {
    if (!summary.pension?.paymentMonths) return [];
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      data.push({
        month,
        养老: 800 + Math.floor(Math.random() * 200),
        医疗: 300 + Math.floor(Math.random() * 100),
        失业: 50 + Math.floor(Math.random() * 30)
      });
    }
    return data;
  }, [summary]);

  const pieData = insurance.map((key, i) => ({
    name: labels[key],
    value: summary[key]?.personalAccountBalance || 0,
    color: colors[i]
  }));

  return (
    <div className="stack">
      <section className="section-title">
        <UserRound />
        <div>
          <h2>个人中心 / 权益总览</h2>
          <p>{user?.name || profile.user?.name || '张三'} · 电子社保卡 {user?.socialSecurityCardNo || profile.user?.social_card_no || '已认证'}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button 
            className="primary" 
            onClick={handleCertification}
            disabled={certifying}
          >
            <Camera size={16} />
            {certifying ? '认证中...' : '待遇资格认证'}
          </button>
        </div>
      </section>

      <div className="tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>权益总览</button>
        <button className={activeTab === 'certification' ? 'active' : ''} onClick={() => setActiveTab('certification')}>资格认证</button>
        <button className={activeTab === 'transfer' ? 'active' : ''} onClick={() => setActiveTab('transfer')}>转移接续</button>
        <button className={activeTab === 'bill' ? 'active' : ''} onClick={() => setActiveTab('bill')}>权益账单</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <StatCard label="总缴费月数" value={summary.totalPaymentMonths || 0} suffix="月" icon={Clock} color="#1E40AF" />
            <StatCard label="账户权益余额" value={summary.totalAccountBalance || 0} suffix="元" icon={ShieldCheck} color="#0D9488" />
            <StatCard label="认证记录" value={certifications.length || 0} suffix="次" icon={BadgeCheck} color="#D97706" />
            <StatCard label="待办事项" value={3} suffix="项" icon={Bell} color="#DC2626" />
          </div>

          <div className="module-grid five">
            {insurance.map((key, i) => (
              <div className="card insurance-card" key={key}>
                <div className="insurance-header">
                  <span className="pill success">正常参保</span>
                </div>
                <h3 style={{ color: colors[i] }}>{labels[key]}</h3>
                <p className="muted">累计缴费 {summary[key]?.paymentMonths || 0} 月</p>
                <p className="muted">最后缴费 {summary[key]?.lastPaymentDate || '-'}</p>
                <div className="insurance-balance">
                  <span className="label">个人账户</span>
                  <span className="value">¥ {Number(summary[key]?.personalAccountBalance || 0).toLocaleString()}</span>
                </div>
                <div className="insurance-balance">
                  <span className="label">统筹账户</span>
                  <span className="value muted">¥ {Number(summary[key]?.overallAccountBalance || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-two">
            <div className="card">
              <h3>近12个月缴费趋势</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="养老" stroke="#1E40AF" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="医疗" stroke="#0D9488" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="失业" stroke="#D97706" strokeWidth={2} dot={{ r: 4 }} />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3>账户构成</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥ ${Number(value).toLocaleString()}`} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'certification' && (
        <div className="stack">
          <div className="card">
            <h3>待遇资格人脸识别认证</h3>
            <p className="muted">通过活体检测+人脸比对完成身份认证，确保待遇发放安全</p>
            <div className="certification-panel">
              <div className="certification-steps">
                <div className="step done">
                  <CheckCircle size={24} />
                  <span>信息采集</span>
                </div>
                <div className="step active">
                  <Camera size={24} />
                  <span>活体检测</span>
                </div>
                <div className="step">
                  <BadgeCheck size={24} />
                  <span>背景比对</span>
                </div>
                <div className="step">
                  <ShieldCheck size={24} />
                  <span>认证完成</span>
                </div>
              </div>
              <div className="certification-action">
                <div className="face-placeholder large">
                  <Camera size={80} />
                  <p>点击开始人脸识别</p>
                </div>
                <button className="primary large" onClick={handleCertification} disabled={certifying}>
                  {certifying ? '认证进行中...' : '开始人脸识别认证'}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>认证历史记录</h3>
            <ListTable 
              rows={certifications} 
              columns={['certification_type', 'status', 'liveness_score', 'face_match_score', 'certified_at', 'expiry_date']}
            />
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="stack">
          <div className="card">
            <h3>社保转移接续轨迹</h3>
            <div className="transfer-summary">
              <StatCard label="累计转移次数" value={transferRecords?.length || 1} suffix="次" icon={Activity} color="#1E40AF" />
              <StatCard label="转移基金总额" value={transferRecords?.reduce((sum, t) => sum + (t.transferAmount || 128650), 0) || 128650} suffix="元" icon={Database} color="#0D9488" />
              <StatCard label="累计缴费月数" value={summary.totalPaymentMonths || 86} suffix="月" icon={Clock} color="#D97706" />
            </div>
            <div className="timeline">
              {(transferRecords?.length > 0 ? transferRecords : [
                { status: 'done', type: '转出', location: '上海市社保中心', date: '2023-03-15', amount: null },
                { status: 'done', type: '基金划转', location: '上海市社保中心', date: '2023-03-20', amount: 128650 },
                { status: 'done', type: '转入', location: '昆明市社保中心', date: '2023-03-25', amount: null },
                { status: 'active', type: '账户合并', location: '昆明市社保中心', date: '2023-04-05', amount: null }
              ]).map((record, idx) => (
                <div className={`timeline-item ${record.status}`} key={idx}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>{record.type || record.step}</h4>
                    <p className="muted">{record.date || record.createdAt?.substring(0, 10)} · {record.location || record.organization}</p>
                    {record.amount && <p className="amount">转移基金：¥ {Number(record.amount).toLocaleString()}</p>}
                    {record.remark && <p className="remark">{record.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bill' && (
        <div className="stack">
          <div className="card">
            <h3>个人权益账单</h3>
            <div className="bill-header">
              <div className="bill-year">
                <label>账单年度</label>
                <select value={billYear} onChange={(e) => setBillYear(e.target.value)}>
                  <option value="2026">2026年</option>
                  <option value="2025">2025年</option>
                  <option value="2024">2024年</option>
                </select>
              </div>
              <div className="bill-type">
                <label>险种</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                  {insurance.map((key) => (
                    <option key={key} value={key}>{labels[key]}</option>
                  ))}
                </select>
              </div>
              <button className="primary">
                <FileText size={16} />
                下载权益单
              </button>
            </div>
            <div className="bill-content">
              <div className="bill-section">
                <h4>基本信息</h4>
                <div className="bill-grid">
                  <div><span className="label">姓名</span><span>{user?.name || '张三'}</span></div>
                  <div><span className="label">身份证</span><span>{user?.idCard || '530102********1234'}</span></div>
                  <div><span className="label">个人编号</span><span>YN530100202000123456</span></div>
                  <div><span className="label">参保状态</span><span className="pill success">正常参保</span></div>
                  <div><span className="label">参保单位</span><span>{profile.user?.company_name || '云南省数字政务有限公司'}</span></div>
                  <div><span className="label">账单年度</span><span>{billYear}年度</span></div>
                </div>
              </div>

              <div className="bill-section">
                <h4>账户余额构成（{labels[paymentType]}）</h4>
                <div className="bill-grid">
                  <div><span className="label">期初个人账户余额</span><span>¥ {Number(summary[paymentType]?.personalAccountBalance || 0).toLocaleString()}</span></div>
                  <div><span className="label">本年个人缴费</span><span>¥ {Number(summary[paymentType]?.yearlyPersonal || 9600).toLocaleString()}</span></div>
                  <div><span className="label">本年单位缴费</span><span>¥ {Number(summary[paymentType]?.yearlyCompany || 19200).toLocaleString()}</span></div>
                  <div><span className="label">本年利息</span><span>¥ {Number(summary[paymentType]?.yearlyInterest || 1280.56).toLocaleString()}</span></div>
                  <div><span className="label">本年支出</span><span>¥ {Number(summary[paymentType]?.yearlyExpense || 0).toLocaleString()}</span></div>
                  <div><span className="label strong">期末个人账户余额</span><span className="strong">¥ {Number((summary[paymentType]?.personalAccountBalance || 0) + (summary[paymentType]?.yearlyPersonal || 9600) + (summary[paymentType]?.yearlyInterest || 1280.56)).toLocaleString()}</span></div>
                </div>
              </div>

              <div className="bill-section">
                <h4>缴费明细（{labels[paymentType]}）</h4>
                <div className="bill-type-tabs">
                  {insurance.map((key) => (
                    <button
                      key={key}
                      className={paymentType === key ? 'active' : ''}
                      onClick={() => { setPaymentType(key); setPaymentPage(1); }}
                    >
                      {labels[key]}
                    </button>
                  ))}
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>缴费月份</th>
                        <th>缴费基数</th>
                        <th>个人缴费</th>
                        <th>单位缴费</th>
                        <th>合计</th>
                        <th>缴费状态</th>
                        <th>缴费单位</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentData.list?.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td>{row.payment_month}</td>
                          <td className="mono">¥ {Number(row.payment_base || 0).toLocaleString()}</td>
                          <td className="mono">¥ {Number(row.personal_amount || 0).toLocaleString()}</td>
                          <td className="mono">¥ {Number(row.company_amount || 0).toLocaleString()}</td>
                          <td className="mono">¥ {Number(row.total_amount || 0).toLocaleString()}</td>
                          <td>
                            <span className={`pill ${row.payment_status === 'paid' ? 'success' : 'warning'}`}>
                              {row.payment_status === 'paid' ? '已缴' : '欠缴'}
                            </span>
                          </td>
                          <td className="small">{row.company_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {paymentData.total > 12 && (
                  <div className="pagination">
                    <button 
                      onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                      disabled={paymentPage === 1}
                    >
                      上一页
                    </button>
                    <span>第 {paymentPage} 页 / 共 {Math.ceil(paymentData.total / 12)} 页</span>
                    <button 
                      onClick={() => setPaymentPage(paymentPage + 1)}
                      disabled={paymentPage * 12 >= paymentData.total}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, suffix, icon: Icon, color }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="stat-suffix">{suffix}</span>
        </span>
      </div>
    </div>
  );
}

function Contracts() {
  const { showToast } = useToast();
  const { data } = useAsync(() => api.get('/contract'), [], []);
  const { data: historyData } = useAsync(() => api.get('/contract/history'), [], []);
  const [activeTab, setActiveTab] = useState('list');
  const [signingId, setSigningId] = useState(null);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showTerminateForm, setShowTerminateForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [changeForm, setChangeForm] = useState({ changeType: 'salary', changeContent: '', effectiveDate: '' });
  const [terminateForm, setTerminateForm] = useState({ reason: '', effectiveDate: '' });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSign = async (id) => {
    setSigningId(id);
    try {
      const result = await http.post(`/contract/${id}/sign`);
      showToast(`签署成功！区块链存证哈希：${result.blockchainHash.substring(0, 16)}...`, 'success');
    } catch (e) {
      showToast(e.message || '签署失败', 'error');
    } finally {
      setSigningId(null);
    }
  };

  const handleChange = async () => {
    if (!selectedContract) return;
    setProcessing(true);
    try {
      const result = await http.post(`/contract/${selectedContract.id}/change`, changeForm);
      showToast(`变更成功！区块链存证哈希：${result.blockchainHash.substring(0, 16)}...`, 'success');
      setShowChangeForm(false);
      setChangeForm({ changeType: 'salary', changeContent: '', effectiveDate: '' });
      setAgreeTerms(false);
    } catch (e) {
      showToast(e.message || '变更失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleTerminate = async () => {
    if (!selectedContract) return;
    setProcessing(true);
    try {
      const result = await http.post(`/contract/${selectedContract.id}/terminate`, terminateForm);
      showToast(`终止成功！区块链存证哈希：${result.blockchainHash.substring(0, 16)}...`, 'success');
      setShowTerminateForm(false);
      setTerminateForm({ reason: '', effectiveDate: '' });
      setAgreeTerms(false);
    } catch (e) {
      showToast(e.message || '终止失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const statusMap = {
    active: { label: '已生效', class: 'success' },
    pending: { label: '待签署', class: 'warning' },
    terminated: { label: '已终止', class: 'danger' },
    expired: { label: '已到期', class: 'muted' }
  };

  const typeMap = {
    fixed: '固定期限',
    no_fixed: '无固定期限',
    project: '以完成一定工作任务为期限'
  };

  return (
    <div className="stack">
      <section className="section-title">
        <FileCheck2 />
        <div>
          <h2>劳动合同全生命周期管理</h2>
          <p>在线签署、变更、终止、存证上链、全程可追溯</p>
        </div>
      </section>

      <div className="tabs">
        <button className={activeTab === 'list' ? 'active' : ''} onClick={() => setActiveTab('list')}>合同列表</button>
        <button className={activeTab === 'sign' ? 'active' : ''} onClick={() => setActiveTab('sign')}>待我签署</button>
        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>变更历史</button>
        <button className={activeTab === 'verify' ? 'active' : ''} onClick={() => setActiveTab('verify')}>存证验证</button>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>合同编号</th>
                  <th>用人单位</th>
                  <th>岗位</th>
                  <th>合同类型</th>
                  <th>合同期限</th>
                  <th>薪资</th>
                  <th>状态</th>
                  <th>存证哈希</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const status = statusMap[row.status] || { label: row.status, class: 'muted' };
                  return (
                    <tr key={row.id}>
                      <td><strong>{row.contract_no}</strong></td>
                      <td>{row.employer_name}</td>
                      <td>{row.position}</td>
                      <td>{typeMap[row.contract_type] || row.contract_type}</td>
                      <td>{row.start_date} ~ {row.end_date || '无固定'}</td>
                      <td>¥{row.salary?.toLocaleString()}</td>
                      <td><span className={`pill ${status.class}`}>{status.label}</span></td>
                      <td className="mono small">{row.blockchain_hash ? `${row.blockchain_hash.substring(0, 12)}...` : '-'}</td>
                      <td>
                        {row.status === 'pending' && (
                          <button 
                            className="primary small" 
                            onClick={() => handleSign(row.id)}
                            disabled={signingId === row.id}
                          >
                            {signingId === row.id ? '签署中...' : '立即签署'}
                          </button>
                        )}
                        {row.status === 'active' && (
                          <div className="action-buttons">
                            <button 
                              className="small" 
                              onClick={() => {
                                setSelectedContract(row);
                                setShowChangeForm(true);
                              }}
                            >
                              变更
                            </button>
                            <button 
                              className="danger small" 
                              onClick={() => {
                                setSelectedContract(row);
                                setShowTerminateForm(true);
                              }}
                            >
                              终止
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sign' && (
        <div className="card">
          <h3>待签署合同</h3>
          <div className="contract-detail">
            <div className="contract-header">
              <div>
                <h4>劳动合同（固定期限）</h4>
                <p className="muted">用人单位：云南数字政务科技有限公司</p>
              </div>
              <span className="pill warning">待签署</span>
            </div>
            <div className="contract-content">
              <div className="contract-section">
                <h5>第一条 合同期限</h5>
                <p>本合同为固定期限劳动合同，合同期从2024年01月01日起至2027年01月01日止。其中试用期从2024年01月01日起至2024年03月31日止。</p>
              </div>
              <div className="contract-section">
                <h5>第二条 工作内容和工作地点</h5>
                <p>甲方安排乙方从事高级前端工程师岗位工作，工作地点为昆明市五华区。</p>
              </div>
              <div className="contract-section">
                <h5>第三条 工作时间和休息休假</h5>
                <p>甲方执行国家规定的工时制度，保证乙方每周至少休息一日。</p>
              </div>
              <div className="contract-section">
                <h5>第四条 劳动报酬</h5>
                <p>乙方月工资为人民币18,000元整，甲方于每月15日前以货币形式支付。</p>
              </div>
            </div>
            <div className="contract-sign">
              <label className="checkbox">
                <input type="checkbox" />
                <span>我已仔细阅读并理解合同全部内容，同意签署</span>
              </label>
              <button className="primary large">
                <BadgeCheck size={18} />
                电子签名并上链存证
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3>合同变更历史</h3>
          <div className="timeline">
            <div className="timeline-item done">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>合同签订</h4>
                <p className="muted">2024-01-01 · 签订固定期限劳动合同</p>
                <p className="muted">存证哈希：0x8a3b...7f2c</p>
              </div>
            </div>
            <div className="timeline-item done">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>岗位变更</h4>
                <p className="muted">2025-03-15 · 由前端工程师变更为高级前端工程师</p>
                <p className="muted">存证哈希：0x2d5e...9a1b</p>
              </div>
            </div>
            <div className="timeline-item active">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>薪资调整</h4>
                <p className="muted">2026-01-01 · 月薪由15,000元调整为18,000元</p>
                <p className="muted">待确认 · 存证哈希：0x5c7f...3e8d</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="card">
          <h3>区块链存证验证</h3>
          <p className="muted">输入合同编号或存证哈希进行验证</p>
          <div className="search-panel">
            <input placeholder="请输入合同编号或存证哈希" />
            <button className="primary">验证</button>
          </div>
          <div className="verify-result">
            <div className="verify-item">
              <span className="label">验证结果</span>
              <span className="pill success"><CheckCircle size={14} /> 验证通过，存证真实有效</span>
            </div>
            <div className="verify-item">
              <span className="label">存证时间</span>
              <span>2024-01-01 09:30:00</span>
            </div>
            <div className="verify-item">
              <span className="label">区块高度</span>
              <span>1,234,567</span>
            </div>
            <div className="verify-item">
              <span className="label">交易哈希</span>
              <span className="mono">0x8a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b</span>
            </div>
          </div>
        </div>
      )}

      {showChangeForm && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowChangeForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>劳动合同变更</h3>
              <button className="icon-btn" onClick={() => setShowChangeForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>合同编号</label>
                <input value={selectedContract.contract_no} disabled />
              </div>
              <div className="form-group">
                <label>变更类型</label>
                <select 
                  value={changeForm.changeType} 
                  onChange={(e) => setChangeForm({ ...changeForm, changeType: e.target.value })}
                >
                  <option value="salary">薪资调整</option>
                  <option value="position">岗位变更</option>
                  <option value="term">合同期限变更</option>
                  <option value="workplace">工作地点变更</option>
                  <option value="other">其他变更</option>
                </select>
              </div>
              <div className="form-group">
                <label>变更内容</label>
                <textarea 
                  rows={4} 
                  placeholder="请详细描述变更内容"
                  value={changeForm.changeContent}
                  onChange={(e) => setChangeForm({ ...changeForm, changeContent: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>生效日期</label>
                <input 
                  type="date" 
                  value={changeForm.effectiveDate}
                  onChange={(e) => setChangeForm({ ...changeForm, effectiveDate: e.target.value })}
                />
              </div>
              <label className="checkbox">
                <input 
                  type="checkbox" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>我已仔细阅读并理解变更内容，同意签署变更协议</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="small" onClick={() => setShowChangeForm(false)}>取消</button>
              <button 
                className="primary small" 
                onClick={handleChange}
                disabled={!agreeTerms || processing}
              >
                {processing ? '处理中...' : '确认变更并上链'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTerminateForm && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowTerminateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>劳动合同终止</h3>
              <button className="icon-btn" onClick={() => setShowTerminateForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>合同编号</label>
                <input value={selectedContract.contract_no} disabled />
              </div>
              <div className="form-group">
                <label>终止原因</label>
                <select 
                  value={terminateForm.reason} 
                  onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
                >
                  <option value="">请选择终止原因</option>
                  <option value="resignation">劳动者提出辞职</option>
                  <option value="dismissal">用人单位解除</option>
                  <option value="expiry">合同期满</option>
                  <option value="retirement">劳动者退休</option>
                  <option value="agreement">双方协商一致</option>
                  <option value="other">其他原因</option>
                </select>
              </div>
              <div className="form-group">
                <label>详细说明</label>
                <textarea 
                  rows={4} 
                  placeholder="请详细说明终止原因"
                  value={terminateForm.reason}
                  onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>终止日期</label>
                <input 
                  type="date" 
                  value={terminateForm.effectiveDate}
                  onChange={(e) => setTerminateForm({ ...terminateForm, effectiveDate: e.target.value })}
                />
              </div>
              <div className="warning-box">
                <AlertTriangle size={18} />
                <p>劳动合同终止后，相关权益将按照国家法律法规执行。请确认所有手续已办理完毕。</p>
              </div>
              <label className="checkbox">
                <input 
                  type="checkbox" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>我已了解终止后果，同意办理劳动合同终止手续</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="small" onClick={() => setShowTerminateForm(false)}>取消</button>
              <button 
                className="danger small" 
                onClick={handleTerminate}
                disabled={!agreeTerms || processing}
              >
                {processing ? '处理中...' : '确认终止并上链'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Rights() {
  const { showToast } = useToast();
  const { data, loading } = useAsync(() => api.get('/rights'), [], []);
  const [activeTab, setActiveTab] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caseDetail, setCaseDetail] = useState(null);
  const { data: historyData } = useAsync(() => api.get('/contract/history'), [], []);
  const [formData, setFormData] = useState({
    title: '',
    type: 'wage',
    description: ''
  });

  const statusMap = {
    pending: { label: '待受理', class: 'warning' },
    reviewing: { label: '审查中', class: 'info' },
    transferred: { label: '已转办', class: 'info' },
    processing: { label: '处理中', class: 'primary' },
    resolved: { label: '已解决', class: 'success' },
    closed: { label: '已结案', class: 'muted' }
  };

  const typeMap = {
    wage: '工资拖欠',
    social_security: '社保缴纳',
    overtime: '加班工资',
    dismissal: '违法解除',
    leave: '休假权益',
    other: '其他'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await http.post('/rights', formData);
      showToast(`提交成功！案件编号：${result.caseNo}`, 'success');
      setShowForm(false);
      setFormData({ title: '', type: 'wage', description: '' });
    } catch (error) {
      showToast(error.message || '提交失败', 'error');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadEvidence = async (caseId) => {
    if (selectedFiles.length === 0) {
      showToast('请先选择要上传的文件', 'warning');
      return;
    }
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const form = new FormData();
        form.append('file', file);
        await http.post(`/rights/${caseId}/evidence`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      showToast(`成功上传 ${selectedFiles.length} 个证据文件`, 'success');
      setSelectedFiles([]);
      if (caseId) {
        const detail = await api.get(`/rights/${caseId}`);
        setCaseDetail(detail);
        if (selectedCase?.id === caseId) {
          setSelectedCase(detail);
        }
      }
    } catch (error) {
      showToast(error.message || '上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleViewCase = async (caseItem) => {
    setSelectedCase(caseItem);
    try {
      const detail = await api.get(`/rights/${caseItem.id}`);
      setCaseDetail(detail);
    } catch (e) {
      setCaseDetail(caseItem);
    }
  };

  const getTimelineData = (caseItem) => {
    const timeline = [
      { status: 'done', title: '申请提交', time: caseItem.created_at, desc: '维权申请已提交，等待受理' }
    ];
    
    if (caseItem.status !== 'pending') {
      timeline.push({ status: 'done', title: '材料审核', time: caseItem.updated_at || caseItem.created_at, desc: '证据材料审核通过' });
    }
    
    if (caseItem.status === 'transferred' || caseItem.status === 'processing' || caseItem.status === 'resolved' || caseItem.status === 'closed') {
      timeline.push({ status: 'done', title: '案件转办', time: caseItem.updated_at, desc: `已转办至${caseItem.current_handler}` });
    }
    
    if (caseItem.status === 'processing' || caseItem.status === 'resolved' || caseItem.status === 'closed') {
      timeline.push({ status: caseItem.status === 'processing' ? 'active' : 'done', title: '案件处理', time: caseItem.updated_at, desc: '案件正在处理中' });
    }
    
    if (caseItem.status === 'resolved' || caseItem.status === 'closed') {
      timeline.push({ status: 'done', title: '处理完成', time: caseItem.updated_at, desc: '案件已处理完成' });
    }
    
    if (caseItem.status === 'closed') {
      timeline.push({ status: 'done', title: '结案归档', time: caseItem.updated_at, desc: '案件已结案归档' });
    }
    
    return timeline;
  };

  return (
    <div className="stack">
      <section className="section-title">
        <Gavel />
        <div>
          <h2>劳动维权服务</h2>
          <p>在线举证、材料上传、时间戳存证、进度查询</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="primary" onClick={() => setShowForm(true)}>
            <FileText size={16} />
            提交维权申请
          </button>
        </div>
      </section>

      <div className="tabs">
        <button className={activeTab === 'list' ? 'active' : ''} onClick={() => setActiveTab('list')}>我的维权</button>
        <button className={activeTab === 'evidence' ? 'active' : ''} onClick={() => setActiveTab('evidence')}>证据管理</button>
        <button className={activeTab === 'laws' ? 'active' : ''} onClick={() => setActiveTab('laws')}>法规依据</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>提交维权申请</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>维权类型</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {Object.entries(typeMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>标题</label>
                <input 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请简要描述您的维权事项"
                  required
                />
              </div>
              <div className="form-group">
                <label>详细描述</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请详细描述您的维权情况，包括时间、地点、涉及人员、相关证据等"
                  rows={5}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="primary">提交申请</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>案件编号</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>证据数</th>
                  <th>当前处理方</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const status = statusMap[row.status] || { label: row.status, class: 'muted' };
                  return (
                    <tr key={row.id}>
                      <td><strong>{row.case_no}</strong></td>
                      <td>{row.title}</td>
                      <td>{typeMap[row.type] || row.type}</td>
                      <td>{row.evidence_count || 0} 件</td>
                      <td>{row.current_handler}</td>
                      <td><span className={`pill ${status.class}`}>{status.label}</span></td>
                      <td>{row.created_at?.substring(0, 10)}</td>
                      <td>
                        <button className="small" onClick={() => handleViewCase(row)}>查看详情</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evidence' && selectedCase && (
        <div className="card">
          <h3>证据上传 - {selectedCase.case_no}</h3>
          <div className="evidence-upload">
            <div 
              className={`upload-area ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('multi-file-upload')?.click()}
            >
              <Upload size={48} />
              <p>拖拽文件到此处或点击上传</p>
              <p className="muted">支持图片、视频、音频、PDF等格式，单文件不超过50MB</p>
              <p className="muted small">已选择 {selectedFiles.length} 个文件</p>
              <input 
                id="multi-file-upload"
                type="file" 
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>待上传文件</h4>
              {selectedFiles.map((file, idx) => (
                <div className="evidence-item" key={idx}>
                  <div className="evidence-icon">
                    {file.type.startsWith('image/') && <Camera size={20} />}
                    {file.type.startsWith('video/') && <FileText size={20} />}
                    {file.type.startsWith('audio/') && <FileText size={20} />}
                    {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && <FileText size={20} />}
                  </div>
                  <div className="evidence-info">
                    <span className="evidence-name">{file.name}</span>
                    <span className="muted small">
                      {(file.size / 1024).toFixed(2)} KB · {file.type || '未知类型'}
                    </span>
                  </div>
                  <button className="icon-btn" onClick={() => removeFile(idx)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="case-actions">
                <button 
                  className="primary" 
                  onClick={() => handleUploadEvidence(selectedCase.id)}
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : `批量上传 ${selectedFiles.length} 个文件`}
                </button>
                <button 
                  className="secondary" 
                  onClick={() => setSelectedFiles([])}
                  disabled={uploading}
                >
                  清空选择
                </button>
              </div>
            </div>
          )}

          <div className="evidence-list">
            <h4>已上传证据（区块链存证）</h4>
            {((caseDetail?.evidences || selectedCase.evidences || []).length === 0) ? (
              <p className="muted">暂无上传证据</p>
            ) : (
              (caseDetail?.evidences || selectedCase.evidences || []).map((ev, idx) => (
                <div className="evidence-item" key={idx}>
                  <div className="evidence-icon">
                    {ev.file_type === 'image' && <Camera size={20} />}
                    {ev.file_type === 'video' && <FileText size={20} />}
                    {ev.file_type === 'audio' && <FileText size={20} />}
                    {ev.file_type === 'document' && <FileText size={20} />}
                  </div>
                  <div className="evidence-info">
                    <span className="evidence-name">{ev.file_name}</span>
                    <span className="muted small">
                      上传时间：{ev.uploaded_at || ev.timestamp}
                    </span>
                    <span className="muted small mono">
                      SHA256: {ev.file_hash?.substring(0, 24) || '未知'}...
                    </span>
                  </div>
                  <span className="pill success">时间戳已固化</span>
                </div>
              ))
            )}
          </div>

          <div className="blockchain-evidence">
            <h4>区块链存证信息</h4>
            <div className="info-grid">
              <div>
                <span className="label">存证平台</span>
                <span>云南省人社区块链存证系统</span>
              </div>
              <div>
                <span className="label">存证时间</span>
                <span>{selectedCase.created_at}</span>
              </div>
              <div>
                <span className="label">案件哈希</span>
                <span className="mono small">{`0x${selectedCase.id.toString().padStart(40, '0')}`.substring(0, 20)}...</span>
              </div>
              <div>
                <span className="label">证据数量</span>
                <span>{caseDetail?.evidences?.length || selectedCase.evidence_count || 0} 件</span>
              </div>
            </div>
            <div className="warning-box">
              <ShieldCheck size={18} />
              <p>所有证据材料已通过SHA256哈希算法进行区块链存证，确保数据不可篡改、可追溯、可验证。</p>
            </div>
          </div>
        </div>
      )}

      {selectedCase && activeTab === 'list' && (
        <div className="card">
          <div className="section-header">
            <h3>案件详情 - {selectedCase.case_no}</h3>
            <button className="icon-btn" onClick={() => { setSelectedCase(null); setCaseDetail(null); }}>
              <X size={20} />
            </button>
          </div>
          <div className="case-detail">
            <div className="case-info">
              <div className="info-row">
                <span className="label">案件标题</span>
                <span>{caseDetail?.title || selectedCase.title}</span>
              </div>
              <div className="info-row">
                <span className="label">维权类型</span>
                <span>{typeMap[caseDetail?.type || selectedCase.type] || caseDetail?.type || selectedCase.type}</span>
              </div>
              <div className="info-row">
                <span className="label">当前状态</span>
                <span className={`pill ${statusMap[caseDetail?.status || selectedCase.status]?.class || 'muted'}`}>
                  {statusMap[caseDetail?.status || selectedCase.status]?.label || caseDetail?.status || selectedCase.status}
                </span>
              </div>
              <div className="info-row">
                <span className="label">当前处理方</span>
                <span>{caseDetail?.current_handler || selectedCase.current_handler}</span>
              </div>
              <div className="info-row">
                <span className="label">问题描述</span>
                <span>{caseDetail?.description || selectedCase.description}</span>
              </div>
            </div>
            <div className="case-timeline">
              <h4>处理进度时间线</h4>
              <div className="timeline small">
                {getTimelineData(caseDetail || selectedCase).map((item, idx) => (
                  <div className={`timeline-item ${item.status}`} key={idx}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h5>{item.title}</h5>
                      <p className="muted">{item.time}</p>
                      <p className="small">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="case-actions">
              <button 
                className="primary" 
                onClick={() => { 
                  setActiveTab('evidence');
                  setSelectedFiles([]);
                }}
              >
                <Upload size={16} />
                补充证据
              </button>
              <input 
                type="file" 
                multiple
                style={{ display: 'none' }} 
                id="evidence-upload-quick"
                onChange={handleFileSelect}
              />
              <label htmlFor="evidence-upload-quick" className="secondary">
                <Upload size={16} />
                选择文件
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'laws' && (
        <div className="card">
          <h3>相关法律法规</h3>
          <div className="policy-list">
            {[
              { title: '中华人民共和国劳动法', desc: '规范劳动关系，保护劳动者合法权益', date: '2018-12-29' },
              { title: '中华人民共和国劳动合同法', desc: '完善劳动合同制度，明确双方权利义务', date: '2012-12-28' },
              { title: '劳动保障监察条例', desc: '规范劳动保障监察行为，维护劳动者合法权益', date: '2004-11-01' },
              { title: '中华人民共和国劳动争议调解仲裁法', desc: '公正及时解决劳动争议，保护当事人合法权益', date: '2008-05-01' }
            ].map((law, idx) => (
              <div className="policy-card" key={idx}>
                <div className="policy-card-header">
                  <h3>{law.title}</h3>
                  <span className="pill primary">现行有效</span>
                </div>
                <p className="policy-meta">{law.date}</p>
                <p className="policy-summary">{law.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Jobs() {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyPage, setApplyPage] = useState(1);
  const [myApplications, setMyApplications] = useState([
    { id: 1, jobTitle: '社保经办窗口专员', company: '昆明市公共就业和人才服务中心', status: 'pending', appliedAt: '2026-06-01' },
    { id: 2, jobTitle: '劳动合同电子签署运营', company: '云南数字人社科技有限公司', status: 'reviewing', appliedAt: '2026-05-28' },
    { id: 3, jobTitle: '社保数据治理工程师', company: '云南省人社数据中心', status: 'accepted', appliedAt: '2026-05-20' }
  ]);
  const { data: matchedJobs } = useAsync(
    () => (isAuthenticated && activeTab === 'match' ? api.get('/jobs/match') : Promise.resolve([])),
    [],
    [activeTab, isAuthenticated]
  );
  const { data: allJobs, loading } = useAsync(
    () => api.get('/jobs', { params: { keyword, location, education, experience } }),
    { list: [], total: 0 },
    [keyword, location, education, experience]
  );

  const applicationStatusMap = {
    pending: { label: '待处理', class: 'warning' },
    reviewing: { label: '审核中', class: 'info' },
    accepted: { label: '已通过', class: 'success' },
    rejected: { label: '未通过', class: 'danger' }
  };

  const handleApply = async (jobId) => {
    if (!isAuthenticated) {
      showToast('请先登录后再投递简历', 'warning');
      return;
    }
    try {
      await http.post(`/jobs/${jobId}/apply`);
      showToast('简历投递成功！', 'success');
    } catch (e) {
      showToast(e.message || '投递失败', 'error');
    }
  };

  const educationMap = {
    high_school: '高中',
    college: '大专',
    bachelor: '本科',
    master: '硕士',
    doctor: '博士'
  };

  const experienceMap = {
    '0-1': '1年以内',
    '1-3': '1-3年',
    '3-5': '3-5年',
    '5-10': '5-10年',
    '10+': '10年以上'
  };

  return (
    <div className="stack">
      <section className="section-title">
        <Briefcase />
        <div>
          <h2>招考招聘平台</h2>
          <p>职位搜索、智能匹配、条件筛选、简历投递</p>
        </div>
      </section>

      <div className="tabs">
        <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>全部岗位</button>
        <button className={activeTab === 'match' ? 'active' : ''} onClick={() => setActiveTab('match')}>智能匹配</button>
        <button className={activeTab === 'applied' ? 'active' : ''} onClick={() => setActiveTab('applied')}>我的投递</button>
      </div>

      <div className="search-panel">
        <Search size={20} />
        <input 
          placeholder="搜索岗位、单位、专业标签" 
          value={keyword} 
          onChange={(e) => setKeyword(e.target.value)} 
        />
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">全部地区</option>
          <option value="昆明">昆明市</option>
          <option value="曲靖">曲靖市</option>
          <option value="玉溪">玉溪市</option>
          <option value="大理">大理州</option>
          <option value="红河">红河州</option>
        </select>
        <select value={education} onChange={(e) => setEducation(e.target.value)}>
          <option value="">不限学历</option>
          {Object.entries(educationMap).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={experience} onChange={(e) => setExperience(e.target.value)}>
          <option value="">不限经验</option>
          {Object.entries(experienceMap).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">加载中...</div>}

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedJob.title}</h3>
              <button className="close-btn" onClick={() => setSelectedJob(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="policy-meta">
                <span className="pill primary">{selectedJob.company_name}</span>
                <span className="muted">{selectedJob.location}</span>
                <span className="muted">{educationMap[selectedJob.education] || selectedJob.education}</span>
                <span className="muted">{experienceMap[selectedJob.experience] || selectedJob.experience}</span>
                <span className="muted">截止：{selectedJob.deadline}</span>
              </div>
              <div className="tags">
                {(selectedJob.job_tags || '').split(',').filter(Boolean).map((tag, i) => (
                  <span key={i} className="pill">{tag}</span>
                ))}
              </div>
              <div className="policy-summary">
                <h4>薪资范围</h4>
                <p>{selectedJob.salary_min}-{selectedJob.salary_max}K</p>
              </div>
              <div className="policy-content">
                <h4>岗位详情</h4>
                <p>{selectedJob.description || '岗位职责、任职要求和报名流程请以招聘单位公告为准。'}</p>
              </div>
              <div className="institution-actions">
                <button className="primary" onClick={() => handleApply(selectedJob.id)}>
                  投递简历
                </button>
                <button className="secondary" onClick={() => setSelectedJob(null)}>
                  返回列表
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'match' && matchedJobs.length > 0 && (
        <div className="match-section">
          <div className="section-header">
            <h3>为您智能匹配的岗位</h3>
            <span className="muted">基于您的专业、学历、经验标签</span>
          </div>
          <div className="job-list">
            {matchedJobs.map((job) => (
              <div className="job-card" key={job.id} onClick={() => setSelectedJob(job)}>
                <div className="job-header">
                  <h4>{job.title}</h4>
                  <div className="match-score">
                    <BadgeCheck size={16} />
                    <span>匹配度 {job.matchScore || 92}%</span>
                  </div>
                </div>
                <p className="job-company">{job.company_name}</p>
                <p className="job-meta">
                  <span>{job.location}</span>
                  <span>·</span>
                  <span>{educationMap[job.education] || job.education}</span>
                  <span>·</span>
                  <span>{experienceMap[job.experience] || job.experience}</span>
                </p>
                <div className="job-tags">
                  {(job.job_tags || '').split(',').slice(0, 4).map((tag, i) => (
                    <span key={i} className="pill">{tag}</span>
                  ))}
                </div>
                <div className="job-footer">
                  <span className="job-salary">{job.salary_min}-{job.salary_max}K</span>
                  <button className="secondary small" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                    查看详情
                  </button>
                  <button className="primary small" onClick={(e) => { e.stopPropagation(); handleApply(job.id); }}>
                    立即投递
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="job-list">
          {allJobs.list?.map((job) => (
            <div className="job-card" key={job.id} onClick={() => setSelectedJob(job)}>
              <div className="job-header">
                <h4>{job.title}</h4>
                <span className="job-salary">{job.salary_min}-{job.salary_max}K</span>
              </div>
              <p className="job-company">{job.company_name}</p>
              <p className="job-meta">
                <span>{job.location}</span>
                <span>·</span>
                <span>{educationMap[job.education] || job.education}</span>
                <span>·</span>
                <span>{experienceMap[job.experience] || job.experience}</span>
              </p>
              <div className="job-tags">
                {(job.job_tags || '').split(',').slice(0, 4).map((tag, i) => (
                  <span key={i} className="pill">{tag}</span>
                ))}
              </div>
              <div className="job-footer">
                <span className="muted">浏览 {job.view_count || 0} 次 · 发布于 {job.posted_at?.substring(0, 10) || '近期'}</span>
                <div className="action-buttons">
                  <button className="small" onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                    查看详情
                  </button>
                  <button className="primary small" onClick={(e) => { e.stopPropagation(); handleApply(job.id); }}>
                    投递简历
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'applied' && (
        <div className="card">
          <div className="section-header">
            <h3>我的投递记录</h3>
            <span className="muted">共 {myApplications.length} 条投递记录</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>岗位名称</th>
                  <th>用人单位</th>
                  <th>投递时间</th>
                  <th>当前状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {myApplications.map((app) => {
                  const status = applicationStatusMap[app.status] || { label: app.status, class: 'muted' };
                  return (
                    <tr key={app.id}>
                      <td><strong>{app.jobTitle}</strong></td>
                      <td>{app.company}</td>
                      <td>{app.appliedAt}</td>
                      <td>
                        <span className={`pill ${status.class}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="small">查看进度</button>
                          {app.status === 'pending' && (
                            <button className="danger small">撤回申请</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {myApplications.length > 5 && (
            <div className="pagination">
              <button 
                onClick={() => setApplyPage(Math.max(1, applyPage - 1))}
                disabled={applyPage === 1}
              >
                上一页
              </button>
              <span>第 {applyPage} 页 / 共 {Math.ceil(myApplications.length / 5)} 页</span>
              <button 
                onClick={() => setApplyPage(applyPage + 1)}
                disabled={applyPage * 5 >= myApplications.length}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Institutions() {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    service: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    idCard: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const { data } = useAsync(
    () => api.get('/institutions', { params: { keyword, type } }),
    { list: [] },
    [keyword, type]
  );
  const { data: nearby } = useAsync(() => api.get('/institutions/nearby'), [], []);

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('请先登录后再预约', 'warning');
      return;
    }
    if (!bookingForm.service || !bookingForm.date || !bookingForm.time) {
      showToast('请填写完整预约信息', 'warning');
      return;
    }
    setBookingLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('预约成功！请按时前往办理', 'success');
      setShowBooking(false);
      setBookingForm({ service: '', date: '', time: '', name: '', phone: '', idCard: '' });
    } catch (e) {
      showToast(e.message || '预约失败', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const typeMap = {
    social_security: '社保经办',
    medical_insurance: '医保经办',
    employment: '就业服务',
    talent: '人才服务',
    labor_inspection: '劳动监察',
    training: '职业培训'
  };

  const institutionList = viewMode === 'nearby' ? nearby : data.list;
  const center = selectedInstitution 
    ? [selectedInstitution.lat, selectedInstitution.lng]
    : [25.0389, 102.7183];

  return (
    <div className="stack">
      <section className="section-title">
        <MapPin />
        <div>
          <h2>服务机构 GIS 地图</h2>
          <p>机构检索、距离排序、窗口预约、导航路线</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className={viewMode === 'map' ? 'primary small' : 'small'} onClick={() => setViewMode('map')}>
            <Globe size={14} />
            地图视图
          </button>
          <button className={viewMode === 'list' ? 'primary small' : 'small'} onClick={() => setViewMode('list')}>
            <Layers size={14} />
            列表视图
          </button>
          <button className={viewMode === 'nearby' ? 'primary small' : 'small'} onClick={() => setViewMode('nearby')}>
            <MapPin size={14} />
            附近机构
          </button>
        </div>
      </section>

      <div className="search-panel">
        <Search size={20} />
        <input 
          placeholder="搜索机构名称、地址或服务事项" 
          value={keyword} 
          onChange={(e) => setKeyword(e.target.value)} 
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">全部类型</option>
          {Object.entries(typeMap).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="primary">检索</button>
      </div>

      {viewMode === 'map' && (
        <div className="card">
          <div className="map-container">
            <MapContainer 
              center={center} 
              zoom={12} 
              style={{ height: '500px', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {institutionList.map((inst) => (
                <Marker 
                  key={inst.id} 
                  position={[inst.lat, inst.lng]}
                  eventHandlers={{
                    click: () => setSelectedInstitution(inst)
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <h4>{inst.name}</h4>
                      <p className="muted">{inst.address}</p>
                      <p><strong>电话：</strong>{inst.phone}</p>
                      <p><strong>服务时间：</strong>{inst.working_hours}</p>
                      <button className="primary small" style={{ marginTop: '8px', width: '100%' }}>
                        查看详情
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {selectedInstitution && (
        <div className="card">
          <div className="institution-detail">
            <div className="institution-header">
              <div>
                <h3>{selectedInstitution.name}</h3>
                <p className="muted">
                  <MapPin size={14} />
                  {selectedInstitution.address}
                </p>
              </div>
              <span className="pill primary">{typeMap[selectedInstitution.type] || selectedInstitution.type}</span>
            </div>
            <div className="institution-info">
              <div className="info-grid">
                <div>
                  <span className="label">联系电话</span>
                  <span>{selectedInstitution.phone}</span>
                </div>
                <div>
                  <span className="label">工作时间</span>
                  <span>{selectedInstitution.working_hours}</span>
                </div>
                <div>
                  <span className="label">距离</span>
                  <span>{selectedInstitution.distance} km</span>
                </div>
                <div>
                  <span className="label">可办事项</span>
                  <span>{(selectedInstitution.services || []).length} 项</span>
                </div>
              </div>
              <div className="services-list">
                <h4>可办服务事项</h4>
                <div className="tags">
                  {(selectedInstitution.services || []).map((s, i) => (
                    <span key={i} className="pill">{s}</span>
                  ))}
                </div>
              </div>
              <div className="institution-actions">
                <button className="primary">
                  <MapPin size={16} />
                  导航前往
                </button>
                <button className="secondary" onClick={() => setShowBooking(true)}>
                  <Calendar size={16} />
                  窗口预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>服务机构列表</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>机构名称</th>
                <th>类型</th>
                <th>地址</th>
                <th>电话</th>
                <th>工作时间</th>
                <th>距离</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {institutionList.map((inst) => (
                <tr key={inst.id} onClick={() => setSelectedInstitution(inst)} style={{ cursor: 'pointer' }}>
                  <td><strong>{inst.name}</strong></td>
                  <td>{typeMap[inst.type] || inst.type}</td>
                  <td>{inst.address}</td>
                  <td>{inst.phone}</td>
                  <td>{inst.working_hours}</td>
                  <td>{inst.distance} km</td>
                  <td>
                    <button className="small" onClick={(e) => { e.stopPropagation(); setSelectedInstitution(inst); }}>
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBooking && selectedInstitution && (
        <div className="modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>窗口预约 - {selectedInstitution.name}</h3>
              <button className="icon-btn" onClick={() => setShowBooking(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="form" onSubmit={handleBooking}>
              <div className="modal-body">
                <div className="warning-box">
                  <AlertTriangle size={18} />
                  <p>请提前15分钟到达办理地点，携带本人身份证及相关材料。</p>
                </div>
                <div className="form-group">
                  <label>办理事项</label>
                  <select 
                    value={bookingForm.service}
                    onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                    required
                  >
                    <option value="">请选择办理事项</option>
                    {(selectedInstitution.services || []).map((s, i) => (
                      <option key={i} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>预约日期</label>
                  <input 
                    type="date" 
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>预约时段</label>
                  <select 
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    required
                  >
                    <option value="">请选择预约时段</option>
                    {timeSlots.map((slot, i) => (
                      <option key={i} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>姓名</label>
                  <input 
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    placeholder="请输入您的姓名"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input 
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    placeholder="请输入您的联系电话"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>身份证号</label>
                  <input 
                    value={bookingForm.idCard}
                    onChange={(e) => setBookingForm({ ...bookingForm, idCard: e.target.value })}
                    placeholder="请输入您的身份证号"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="small" onClick={() => setShowBooking(false)}>取消</button>
                <button type="submit" className="primary small" disabled={bookingLoading}>
                  {bookingLoading ? '提交中...' : '确认预约'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Policies() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const { data: recommend } = useAsync(() => api.get('/policies/recommend'), [], []);
  const { data } = useAsync(
    () => api.get('/policies', { params: { keyword, category, tag: selectedTag } }),
    { list: [] },
    [keyword, category, selectedTag]
  );

  const categoryMap = {
    pension: '养老保险',
    medical: '医疗保险',
    unemployment: '失业保险',
    employment: '就业创业',
    labor: '劳动关系',
    talent: '人才人事'
  };

  const allTags = useMemo(() => {
    const tags = new Set();
    (data.list || []).forEach(p => (p.tags || []).forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [data]);

  return (
    <div className="stack">
      <section className="section-title">
        <BookOpen />
        <div>
          <h2>政策法规库</h2>
          <p>政策查询、智能标签、关联推送、收藏管理</p>
        </div>
      </section>

      {recommend.length > 0 && (
        <div className="card">
          <div className="section-header">
            <h3>为您推荐</h3>
            <span className="muted">基于您的浏览记录和标签匹配</span>
          </div>
          <div className="policy-recommend">
            {recommend.slice(0, 4).map((p) => (
              <div key={p.id} className="policy-card small" onClick={() => setSelectedPolicy(p)}>
                <h4>{p.title}</h4>
                <p className="muted small">{p.issuing_department} · {p.issue_date}</p>
                <div className="tags">
                  {(p.tags || []).slice(0, 3).map((t, i) => (
                    <span key={i} className="pill small">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-panel">
        <Search size={20} />
        <input 
          placeholder="搜索政策标题、文号、标签" 
          value={keyword} 
          onChange={(e) => setKeyword(e.target.value)} 
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">全部类别</option>
          {Object.entries(categoryMap).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button className="primary">查询</button>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <Tags size={16} />
          <span className="muted">热门标签：</span>
          <div className="tags">
            {allTags.slice(0, 12).map((tag, i) => (
              <button
                key={i}
                className={`pill tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedPolicy && (
        <div className="modal-overlay" onClick={() => setSelectedPolicy(null)}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPolicy.title}</h3>
              <button className="close-btn" onClick={() => setSelectedPolicy(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="policy-meta">
                <span className="pill">{categoryMap[selectedPolicy.category] || selectedPolicy.category}</span>
                <span className="muted">文号：{selectedPolicy.document_no}</span>
                <span className="muted">发布部门：{selectedPolicy.issuing_department}</span>
                <span className="muted">发布日期：{selectedPolicy.issue_date}</span>
                <span className="muted">实施日期：{selectedPolicy.effective_date}</span>
                <span className="muted">浏览：{selectedPolicy.view_count || 0} 次</span>
              </div>
              <div className="tags">
                {(selectedPolicy.tags || []).map((t, i) => (
                  <span key={i} className="pill">{t}</span>
                ))}
              </div>
              <div className="policy-summary">
                <h4>政策摘要</h4>
                <p>{selectedPolicy.summary}</p>
              </div>
              <div className="policy-content">
                <h4>政策内容</h4>
                <div className="rich-text" dangerouslySetInnerHTML={{ __html: selectedPolicy.content || '<p>政策详细内容...</p>' }} />
              </div>
              {selectedPolicy.relatedPolicies?.length > 0 && (
                <div className="related-policies">
                  <h4>关联政策</h4>
                  <ul>
                    {selectedPolicy.relatedPolicies.map((rp, i) => (
                      <li key={i} onClick={() => {
                        const found = data.list.find(p => p.id === rp.id);
                        if (found) setSelectedPolicy(found);
                      }}>
                        {rp.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="policy-list">
        {data.list?.map((policy) => (
          <div className="policy-card" key={policy.id} onClick={() => setSelectedPolicy(policy)}>
            <div className="policy-card-header">
              <h3>{policy.title}</h3>
              <span className="pill">{categoryMap[policy.category] || policy.category}</span>
            </div>
            <p className="policy-meta">
              {policy.document_no} · {policy.issuing_department} · {policy.issue_date}
            </p>
            <p className="policy-summary">{policy.summary}</p>
            <div className="policy-card-footer">
              <div className="tags">
                {(policy.tags || []).slice(0, 4).map((t, i) => (
                  <span key={i} className="pill small">{t}</span>
                ))}
              </div>
              <div className="policy-stats">
                <Eye size={14} />
                <span>{policy.view_count || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Consult() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [confidence, setConfidence] = useState(0);
  const { data } = useAsync(() => api.get('/consult/qa', { params: { category } }), [], [category]);

  const ask = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer('');
    try {
      const result = await api.post('/consult/ask', { question });
      setAnswer(result.answer);
      setConfidence(result.confidence || 0);
    } catch (e) {
      setAnswer('抱歉，暂时无法回答您的问题，请稍后重试或拨打12333服务热线。');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = {
    pension: '养老保险',
    medical: '医疗保险',
    unemployment: '失业保险',
    contract: '劳动合同',
    rights: '劳动维权',
    policy: '政策咨询',
    other: '其他'
  };

  return (
    <div className="stack">
      <section className="section-title">
        <MessageCircle />
        <div>
          <h2>咨询问答中心</h2>
          <p>智能客服、高频问题、语义搜索、在线咨询</p>
        </div>
      </section>

      <div className="card">
        <h3>智能问答</h3>
        <p className="muted">请输入您想咨询的人社问题，我将为您提供智能解答</p>
        <form className="ask-form" onSubmit={ask}>
          <textarea 
            placeholder="例如：养老保险缴费满多少年可以领取养老金？"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          <div className="ask-actions">
            <div className="quick-questions">
              <span className="muted">快捷问题：</span>
              {['养老保险怎么转移', '社保卡丢了怎么办', '退休年龄是多少'].map((q, i) => (
                <button
                  key={i}
                  type="button"
                  className="pill small"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <button type="submit" className="primary" disabled={loading || !question.trim()}>
              {loading ? '思考中...' : '提问'}
            </button>
          </div>
        </form>

        {answer && (
          <div className="answer-box">
            <div className="answer-header">
              <BadgeCheck size={20} className="text-success" />
              <span>智能答复</span>
              <span className="muted small">置信度 {(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="answer-content">
              {answer}
            </div>
            <div className="answer-footer">
              <span className="muted small">
                以上答复仅供参考，具体以政策文件和经办机构答复为准。
              </span>
              <button className="link">
                这个回答有帮助吗？
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        {Object.entries(categoryMap).map(([key, label]) => (
          <button
            key={key}
            className={category === key ? 'active' : ''}
            onClick={() => setCategory(category === key ? '' : key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="qa-list">
        {data.map((qa, idx) => (
          <div className="qa-item" key={qa.id || idx}>
            <div className="qa-question">
              <span className="qa-index">Q</span>
              <span>{qa.question}</span>
              <div className="qa-stats">
                <Eye size={14} />
                <span>{qa.view_count || 0}</span>
              </div>
            </div>
            <div className="qa-answer">
              <span className="qa-index">A</span>
              <span>{qa.answer}</span>
            </div>
            <div className="qa-footer">
              <div className="tags">
                {(qa.tags || []).map((t, i) => (
                  <span key={i} className="pill small">{t}</span>
                ))}
              </div>
              <span className="muted small">{qa.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();
  const activeTab = window.location.pathname.replace('/admin', '') || '/dashboard';
  
  const adminNav = [
    ['/admin/dashboard', '运营总览', BarChart3],
    ['/admin/supervise', '督办中心', AlertTriangle],
    ['/admin/knowledge', '知识图谱', Layers],
    ['/admin/city', '地市接入', Globe],
    ['/admin/security', '安全中心', Lock],
    ['/admin/statistics', '数据统计', TrendingUp]
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Landmark size={24} />
          <span>管理后台</span>
        </div>
        <nav className="admin-nav">
          {adminNav.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <Routes>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="supervise" element={<AdminSupervise />} />
          <Route path="knowledge" element={<AdminKnowledge />} />
          <Route path="city" element={<AdminCity />} />
          <Route path="security" element={<AdminSecurity />} />
          <Route path="statistics" element={<AdminStatistics />} />
        </Routes>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data } = useAsync(() => api.get('/admin/dashboard'), { stats: {}, alerts: [], trends: [] }, []);
  const stats = data.stats || {};

  const statLabels = {
    users: '参保用户',
    payments: '缴费记录',
    contracts: '劳动合同',
    rightsCases: '维权案件',
    jobs: '招考岗位',
    institutions: '服务机构',
    policies: '政策文件',
    qa: '咨询问答',
    todayLogins: '今日登录',
    pendingCases: '待处理案件'
  };

  const trendData = data.trends?.map(t => ({
    ...t,
    count: t.count || 0
  })) || [];

  return (
    <div className="stack">
      <section className="section-title">
        <BarChart3 />
        <div>
          <h2>运营总览</h2>
          <p>实时监控平台整体运行状态</p>
        </div>
      </section>

      <div className="stats-grid">
        {Object.entries(stats).map(([key, value]) => (
          <StatCard
            key={key}
            label={statLabels[key] || key}
            value={value || 0}
            suffix=""
            icon={Database}
            color="#1E40AF"
          />
        ))}
      </div>

      <div className="grid-two">
        <div className="card">
          <h3>业务办理趋势</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>预警提醒</h3>
          <ListTable rows={data.alerts || []} columns={['level', 'title', 'owner']} />
        </div>
      </div>
    </div>
  );
}

function AdminSupervise() {
  const { showToast } = useToast();
  const { data, loading } = useAsync(() => api.get('/admin/supervise'), { tasks: [], overdue: 0, warning: 0 }, []);
  const [statusFilter, setStatusFilter] = useState('');
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [handleForm, setHandleForm] = useState({
    handleResult: '',
    handleRemark: '',
    nextStep: ''
  });
  const [handleLoading, setHandleLoading] = useState(false);

  const handleUrge = async (id) => {
    try {
      await http.post(`/admin/supervise/${id}/urge`);
      showToast('催办通知已发送', 'success');
    } catch (e) {
      showToast(e.message || '操作失败', 'error');
    }
  };

  const handleComplete = async (id) => {
    try {
      await http.post(`/admin/supervise/${id}/complete`);
      showToast('任务已标记完成', 'success');
    } catch (e) {
      showToast(e.message || '操作失败', 'error');
    }
  };

  const handleHandle = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!handleForm.handleResult) {
      showToast('请填写处理结果', 'warning');
      return;
    }
    setHandleLoading(true);
    try {
      await http.post(`/admin/supervise/${selectedTask.id}/handle`, handleForm);
      showToast('督办处理已提交', 'success');
      setShowHandleModal(false);
      setHandleForm({ handleResult: '', handleRemark: '', nextStep: '' });
    } catch (e) {
      showToast(e.message || '操作失败', 'error');
    } finally {
      setHandleLoading(false);
    }
  };

  const levelMap = {
    normal: { label: '正常', class: 'success' },
    warning: { label: '预警', class: 'warning' },
    overdue: { label: '超期', class: 'danger' },
    completed: { label: '已完成', class: 'muted' }
  };

  const filteredTasks = statusFilter 
    ? data.tasks?.filter(t => t.level === statusFilter) 
    : data.tasks;

  return (
    <div className="stack">
      <section className="section-title">
        <AlertTriangle />
        <div>
          <h2>业务办理超时督办</h2>
          <p>自动督办、超时预警、催办记录</p>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard label="超期任务" value={data.overdue || 0} suffix="件" icon={AlertTriangle} color="#DC2626" />
        <StatCard label="预警任务" value={data.warning || 0} suffix="件" icon={Clock} color="#D97706" />
        <StatCard label="正常任务" value={(data.total || 0) - (data.overdue || 0) - (data.warning || 0)} suffix="件" icon={CheckCircle} color="#0D9488" />
        <StatCard label="任务总数" value={data.total || 0} suffix="件" icon={Layers} color="#1E40AF" />
      </div>

      <div className="tag-filter">
        <span className="muted">状态筛选：</span>
        <div className="tags">
          <button 
            className={`pill tag-btn ${statusFilter === '' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('')}
          >
            全部
          </button>
          <button 
            className={`pill tag-btn ${statusFilter === 'overdue' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('overdue')}
          >
            超期
          </button>
          <button 
            className={`pill tag-btn ${statusFilter === 'warning' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('warning')}
          >
            预警
          </button>
          <button 
            className={`pill tag-btn ${statusFilter === 'normal' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('normal')}
          >
            正常
          </button>
          <button 
            className={`pill tag-btn ${statusFilter === 'completed' ? 'active' : ''}`} 
            onClick={() => setStatusFilter('completed')}
          >
            已完成
          </button>
        </div>
      </div>

      <div className="card">
        {loading && <div className="loading">加载中...</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
              <th>任务编号</th>
              <th>任务标题</th>
              <th>业务类型</th>
              <th>申请人</th>
              <th>经办单位</th>
              <th>截止日期</th>
              <th>剩余天数</th>
              <th>催办次数</th>
              <th>督办状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks?.map((task) => {
              const level = levelMap[task.level] || { label: task.status, class: 'muted' };
              return (
                <tr key={task.id}>
                  <td><strong>{task.business_no}</strong></td>
                  <td>{task.title}</td>
                  <td>{task.business_type}</td>
                  <td>{task.applicant}</td>
                  <td>{task.handler}</td>
                  <td>{task.deadline}</td>
                  <td>
                    {task.remainingDays < 0 ? (
                      <span className="text-danger">已超期 {Math.abs(task.remainingDays)} 天</span>
                    ) : (
                      <span>{task.remainingDays} 天</span>
                    )}
                  </td>
                  <td>{task.remind_count || 0} 次</td>
                  <td>
                    <span className={`pill ${level.class}`}>{level.label}</span>
                  </td>
                  <td>
                    {task.status !== 'completed' && (
                      <div className="action-buttons">
                        <button className="primary small" onClick={() => handleUrge(task.id)}>
                          催办
                        </button>
                        <button className="small" onClick={() => { 
                          setSelectedTask(task); 
                          setShowHandleModal(true); 
                        }}>
                          处理
                        </button>
                        <button className="secondary small" onClick={() => handleComplete(task.id)}>
                          办结
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

      {showHandleModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowHandleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>督办处理 - {selectedTask.business_no}</h3>
              <button className="icon-btn" onClick={() => setShowHandleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="form" onSubmit={handleHandle}>
              <div className="modal-body">
                <div className="info-grid">
                  <div>
                    <span className="label">任务标题</span>
                    <span>{selectedTask.title}</span>
                  </div>
                  <div>
                    <span className="label">申请人</span>
                    <span>{selectedTask.applicant}</span>
                  </div>
                  <div>
                    <span className="label">经办单位</span>
                    <span>{selectedTask.handler}</span>
                  </div>
                  <div>
                    <span className="label">截止日期</span>
                    <span>{selectedTask.deadline}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>处理结果</label>
                  <select 
                    value={handleForm.handleResult}
                    onChange={(e) => setHandleForm({ ...handleForm, handleResult: e.target.value })}
                    required
                  >
                    <option value="">请选择处理结果</option>
                    <option value="completed">已完成</option>
                    <option value="transferred">已转办</option>
                    <option value="delayed">申请延期</option>
                    <option value="rejected">驳回申请</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>处理说明</label>
                  <textarea 
                    rows={4}
                    value={handleForm.handleRemark}
                    onChange={(e) => setHandleForm({ ...handleForm, handleRemark: e.target.value })}
                    placeholder="请详细说明处理情况"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>下一步计划</label>
                  <textarea 
                    rows={3}
                    value={handleForm.nextStep}
                    onChange={(e) => setHandleForm({ ...handleForm, nextStep: e.target.value })}
                    placeholder="请说明下一步工作计划"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="small" onClick={() => setShowHandleModal(false)}>取消</button>
                <button type="submit" className="primary small" disabled={handleLoading}>
                  {handleLoading ? '提交中...' : '确认处理'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminKnowledge() {
  const { data: graphData } = useAsync(() => api.get('/admin/knowledge/graph'), { nodes: [], links: [] }, []);
  const { data: clusters } = useAsync(() => api.get('/admin/knowledge/cluster'), [], []);

  const COLORS = ['#1E40AF', '#0D9488', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

  return (
    <div className="stack">
      <section className="section-title">
        <Layers />
        <div>
          <h2>知识图谱与语义聚类</h2>
          <p>高频咨询语义聚类、知识图谱可视化</p>
        </div>
      </section>

      <div className="grid-two">
        <div className="card">
          <h3>咨询语义聚类</h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusters || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="label" type="category" stroke="#6b7280" fontSize={12} width={120} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {clusters?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>高频问题分布</h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={clusters || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {clusters?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>知识图谱</h3>
        <div className="knowledge-graph">
          <div className="graph-placeholder">
            <div className="graph-center">
              {graphData.nodes?.slice(0, 20).map((node, idx) => {
                const size = Math.max(40, node.value || 30);
                return (
                  <div
                    key={idx}
                    className="graph-node"
                    style={{
                      width: size,
                      height: size,
                      left: `${10 + (idx % 5) * 18}%`,
                      top: `${5 + Math.floor(idx / 5) * 22}%`,
                      background: node.category === 'root' ? '#1E40AF' :
                                  node.category === 'category' ? '#0D9488' : '#D97706'
                    }}
                  >
                    <span className="graph-node-label">{node.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="graph-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#1E40AF' }}></span>
              <span>核心领域</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#0D9488' }}></span>
              <span>业务分类</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#D97706' }}></span>
              <span>具体问题</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCity() {
  const { showToast } = useToast();
  const { data } = useAsync(() => api.get('/admin/city'), [], []);

  const handleToggle = async (city) => {
    try {
      await http.post('/admin/city/config', { city: city.city, enabled: !city.enabled });
      showToast(`${city.city} 服务状态已更新`, 'success');
    } catch (e) {
      showToast(e.message || '操作失败', 'error');
    }
  };

  return (
    <div className="stack">
      <section className="section-title">
        <Globe />
        <div>
          <h2>地市定制化服务接入</h2>
          <p>16个州（市）服务接入管理、在线率监控</p>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard label="已接入地市" value={data?.filter(c => c.enabled)?.length || 0} suffix="个" icon={CheckCircle} color="#0D9488" />
        <StatCard label="待接入地市" value={data?.filter(c => !c.enabled)?.length || 0} suffix="个" icon={Clock} color="#D97706" />
        <StatCard label="服务事项总数" value={data?.reduce((sum, c) => sum + (c.services || 0), 0)} suffix="项" icon={Layers} color="#1E40AF" />
        <StatCard label="平均在线率" value="75.3%" suffix="" icon={Activity} color="#7C3AED" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>区划代码</th>
                <th>地区</th>
                <th>接入状态</th>
                <th>服务事项</th>
                <th>在线办理</th>
                <th>在线率</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((city) => (
                <tr key={city.code}>
                  <td>{city.code}</td>
                  <td><strong>{city.city}市</strong></td>
                  <td>
                    <span className={`pill ${city.enabled ? 'success' : 'muted'}`}>
                      {city.enabled ? '已接入' : '未接入'}
                    </span>
                  </td>
                  <td>{city.services} 项</td>
                  <td>{city.onlineServices || Math.floor(city.services * 0.75)} 项</td>
                  <td>{city.onlineRate || '75%'}</td>
                  <td>
                    <button
                      className={city.enabled ? 'small' : 'primary small'}
                      onClick={() => handleToggle(city)}
                    >
                      {city.enabled ? '停用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminSecurity() {
  const { data: securityStatus } = useAsync(() => api.get('/admin/security/audit'), {}, []);
  const { data: logsData } = useAsync(() => api.get('/admin/security/logs'), { list: [] }, []);

  const statusMap = {
    low: { label: '低风险', class: 'success' },
    medium: { label: '中风险', class: 'warning' },
    high: { label: '高风险', class: 'danger' }
  };

  return (
    <div className="stack">
      <section className="section-title">
        <Lock />
        <div>
          <h2>数据安全中心</h2>
          <p>人社部数据安全规范、审计日志、安全合规</p>
        </div>
      </section>

      <div className="card">
        <h3>安全审计概览</h3>
        <div className="security-status">
          <div className="security-overview">
            <div className="security-score">
              <div className="score-circle">
            <span className="score-value">98</span>
            <span className="score-label">安全评分</span>
          </div>
          <div className={`security-level ${statusMap[securityStatus?.risk || 'low']?.class}`}>
            {statusMap[securityStatus?.risk || 'low']?.label}
          </div>
          </div>
          <div className="security-stats">
            <div className="security-item">
            <div className="security-item-header">
              <CheckCircle size={20} className="text-success" />
            <span>合规项</span>
          </div>
          <strong>{securityStatus?.passed || 42} 项</strong>
          </div>
          <div className="security-item">
            <div className="security-item-header">
              <AlertTriangle size={20} className="text-warning" />
              <span>警告项</span>
            </div>
            <strong>{securityStatus?.warnings || 1} 项</strong>
          </div>
          <div className="security-item">
            <div className="security-item-header">
              <Database size={20} className="text-primary" />
              <span>备份状态</span>
            </div>
            <strong>{securityStatus?.backup || '正常'}</strong>
          </div>
          </div>
        </div>

        <div className="security-details">
          <h4>安全配置</h4>
          <div className="security-grid">
            <div>
              <span className="label">加密等级</span>
              <span>{securityStatus?.encryptionLevel || 'AES-256'}</span>
            </div>
            <div>
              <span className="label">数据分级</span>
              <span>{securityStatus?.dataClassification || '已完成'}</span>
            </div>
            <div>
              <span className="label">访问控制</span>
              <span>{securityStatus?.accessControl || 'RBAC+ABAC'}</span>
            </div>
            <div>
              <span className="label">审计覆盖</span>
              <span>{securityStatus?.auditCoverage || '100%'}</span>
            </div>
            <div>
              <span className="label">备份策略</span>
              <span>{securityStatus?.backupStatus || '每日增量'}</span>
            </div>
            <div>
              <span className="label">保留期限</span>
              <span>{securityStatus?.retentionPolicy || '10年'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

      <div className="card">
        <h3>操作审计日志</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>用户</th>
                <th>操作</th>
                <th>资源</th>
                <th>IP地址</th>
                <th>User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {logsData.list?.slice(0, 20).map((log, idx) => (
                <tr key={log.id || idx}>
                  <td className="small">{log.created_at?.substring(0, 19)}</td>
                  <td>{log.user_name}</td>
                  <td>{log.action}</td>
                  <td>{log.resource}</td>
                  <td className="mono small">{log.ip}</td>
                  <td className="muted small">{log.user_agent?.substring(0, 50) || '-'}{'...'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminStatistics() {
  const { data } = useAsync(() => api.get('/admin/statistics/overview'), { dailyVisits: [], insuranceStats: [] }, []);

  return (
    <div className="stack">
      <section className="section-title">
        <TrendingUp />
        <div>
          <h2>数据统计分析</h2>
          <p>业务数据多维度统计分析</p>
        </div>
      </section>

      <div className="card">
        <h3>近30天访问趋势</h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={data.dailyVisits || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#1E40AF" strokeWidth={2} dot={false} name="访问量" />
              <Line type="monotone" dataKey="users" stroke="#0D9488" strokeWidth={2} dot={false} name="用户数" />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>五险参保统计</h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.insuranceStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip formatter={(value) => Number(value).toLocaleString()} />
              <Legend />
              <Bar dataKey="count" name="参保人数" fill="#1E40AF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>基金收支统计</h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.insuranceStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip formatter={(value) => `¥ ${(Number(value) / 100000000).toFixed(2)} 亿元`} />
              <Legend />
              <Bar dataKey="amount" name="基金规模(亿元)" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ListPage({ title, rows, columns }) {
  return (
    <div className="stack">
      <section className="section-title">
        <FileCheck2 />
        <div>
          <h2>{title}</h2>
          <p>列表、详情、签署、变更记录与存证验证</p>
        </div>
      </section>
      <ListTable rows={rows} columns={columns} />
    </div>
  );
}

function ListTable({ rows, columns }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {safeRows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => <td key={col}>{String(row[col] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

export default App;
