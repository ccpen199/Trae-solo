import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { companyAPI, orderAPI, userAPI } from '../services/api';

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, transit: 0, pending: 0, exception: 0 });
  const [companies, setCompanies] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('personal');
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ phone: '', code: '', name: '', role: 'personal' });
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    loadCompanies();
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        setRole(u.role || 'personal');
      } catch {}
    }
    if (searchParams.get('login') === '1') {
      setShowLogin(true);
    }
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderAPI.getByUser(1);
      setOrders(data);
      setStats({
        total: data.length,
        delivered: data.filter(o => o.status === 'delivered').length,
        transit: data.filter(o => o.status === 'transit').length,
        pending: data.filter(o => o.status === 'pending').length,
        exception: data.filter(o => o.status === 'exception').length,
      });
    } catch {}
    setLoading(false);
  };

  const loadCompanies = async () => {
    try {
      const list = await companyAPI.list();
      setCompanies(list.slice(0, 6));
    } catch {}
  };

  const handleSendCode = () => {
    if (!loginForm.phone) {
      setError('请输入手机号');
      return;
    }
    setCodeSent(true);
    setError('');
  };

  const handleLogin = async () => {
    if (!loginForm.phone) {
      setError('请输入手机号');
      return;
    }
    if (loginMode === 'login') {
      if (!loginForm.code || !/^\d{4}$/.test(loginForm.code)) {
        setError('请输入4位数字验证码');
        return;
      }
      try {
        const res = await userAPI.login({ phone: loginForm.phone, code: loginForm.code });
        const userData = res.user || res;
        setUser(userData);
        setRole(userData.role || 'personal');
        localStorage.setItem('user', JSON.stringify(userData));
        setShowLogin(false);
        setError('');
        loadOrders();
      } catch (err) {
        setError(err.response?.data?.error || '登录失败');
      }
    } else {
      if (!loginForm.name) {
        setError('请输入姓名');
        return;
      }
      try {
        const res = await userAPI.register({
          phone: loginForm.phone,
          name: loginForm.name,
          code: loginForm.code,
          role: loginForm.role,
        });
        const userData = res.user || res;
        setUser(userData);
        setRole(userData.role || 'personal');
        localStorage.setItem('user', JSON.stringify(userData));
        setShowLogin(false);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || '注册失败');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  const parseJSON = (str) => {
    try { return JSON.parse(str); } catch { return {}; }
  };

  const statusLabel = (s) => {
    const m = { delivered: '已送达', transit: '运输中', pending: '待揽收', exception: '异常' };
    return m[s] || s;
  };

  const statusColor = (s) => {
    const m = {
      delivered: 'bg-green-100 text-green-800',
      transit: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      exception: 'bg-red-100 text-red-800',
    };
    return m[s] || 'bg-gray-100 text-gray-800';
  };

  const roleLabels = { personal: '个人用户', merchant: '商家', company: '快递公司' };

  const quickActions = [
    { to: '/tracking', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', title: '查快递', desc: '输入单号或扫描查询', bg: 'bg-blue-50', iconBg: 'bg-primary' },
    { to: '/shipping', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', title: '寄快递', desc: '跨公司比价下单', bg: 'bg-green-50', iconBg: 'bg-secondary' },
    { to: '/urgent', icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: '同城急送', desc: '20分钟极速响应', bg: 'bg-orange-50', iconBg: 'bg-warning' },
    { to: '/international', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '国际件', desc: '清关指引1v1顾问', bg: 'bg-purple-50', iconBg: 'bg-purple-600' },
  ];

  return (
    <div className="animate-fade-in">
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{loginMode === 'login' ? '登录' : '注册'}</h2>
              <button onClick={() => { setShowLogin(false); setError(''); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex space-x-4 mb-6">
              <button onClick={() => { setLoginMode('login'); setError(''); }} className={`flex-1 py-2 rounded-lg font-medium ${loginMode === 'login' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>登录</button>
              <button onClick={() => { setLoginMode('register'); setError(''); }} className={`flex-1 py-2 rounded-lg font-medium ${loginMode === 'register' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>注册</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
                <input type="tel" value={loginForm.phone} onChange={(e) => setLoginForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="请输入手机号" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">验证码</label>
                <div className="flex space-x-3">
                  <input type="text" maxLength={4} value={loginForm.code} onChange={(e) => setLoginForm(p => ({ ...p, code: e.target.value }))} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="4位数字验证码" />
                  <button onClick={handleSendCode} className="px-4 py-3 bg-primary-50 text-primary rounded-lg hover:bg-primary-100 font-medium text-sm whitespace-nowrap">
                    {codeSent ? '重新发送' : '获取验证码'}
                  </button>
                </div>
                {codeSent && <div className="mt-2 text-xs text-gray-400">模拟验证码：任意4位数字即可</div>}
              </div>

              {loginMode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                    <input type="text" value={loginForm.name} onChange={(e) => setLoginForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="请输入姓名" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <button key={key} onClick={() => setLoginForm(p => ({ ...p, role: key }))} className={`py-2 rounded-lg text-sm font-medium ${loginForm.role === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

              <button onClick={handleLogin} className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-bold">
                {loginMode === 'login' ? '登录' : '注册'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-r from-primary via-primary-700 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                快递物流全链路<br /><span className="text-secondary">数智化</span>服务平台
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                覆盖个人用户、中小商家、快递公司三方协同场景，提供从下单、比价、追踪到售后的全流程数字化服务
              </p>
              <div className="flex flex-wrap gap-4">
                {quickActions.map(a => (
                  <button key={a.to} onClick={() => navigate(a.to)} className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} /></svg>
                    <span>{a.title}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              {user ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{user.name || '用户'}</div>
                      <div className="text-blue-200">{user.phone}</div>
                      <div className="text-blue-300 text-sm">{roleLabels[user.role || role]}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-blue-200 mb-2">切换角色</div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <button key={key} onClick={() => handleRoleSwitch(key)} className={`py-2 rounded-lg text-sm font-medium transition-colors ${role === key ? 'bg-white text-primary' : 'bg-white/10 text-white hover:bg-white/20'}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleLogout} className="text-sm text-blue-300 hover:text-white">退出登录</button>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center"><div className="text-4xl font-bold text-secondary mb-2">3000+</div><div className="text-blue-100">合作快递公司</div></div>
                    <div className="text-center"><div className="text-4xl font-bold text-secondary mb-2">99.9%</div><div className="text-blue-100">轨迹准确率</div></div>
                    <div className="text-center"><div className="text-4xl font-bold text-secondary mb-2">20分钟</div><div className="text-blue-100">同城响应SLA</div></div>
                    <div className="text-center"><div className="text-4xl font-bold text-secondary mb-2">AI驱动</div><div className="text-blue-100">智能预测送达</div></div>
                  </div>
                  <button onClick={() => setShowLogin(true)} className="mt-6 w-full bg-white text-primary py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">立即登录</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: '总订单', value: stats.total, color: 'text-primary', bg: 'bg-primary-50' },
              { label: '已送达', value: stats.delivered, color: 'text-green-600', bg: 'bg-green-50' },
              { label: '运输中', value: stats.transit, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: '待揽收', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: '异常', value: stats.exception, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-5 text-center`}>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {user && (
        <section className="py-4 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <div className="font-bold">{user.name || '用户'}</div>
                  <div className="text-sm text-gray-500">{user.phone} · {roleLabels[user.role || role]}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                {Object.entries(roleLabels).map(([key, label]) => (
                  <button key={key} onClick={() => handleRoleSwitch(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${role === key ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {role === 'personal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">我的订单</h2>
                    <Link to="/tracking" className="text-primary hover:text-primary-600 font-medium">查看全部</Link>
                  </div>
                  {loading ? (
                    <div className="text-center py-12 text-gray-400">加载中...</div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.map(order => {
                        const receiver = parseJSON(order.receiver_info);
                        const item = parseJSON(order.item_info);
                        return (
                          <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <span className="font-mono text-sm font-semibold text-gray-900">{order.tracking_no}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {receiver.name && <span>{receiver.name}</span>}
                                {receiver.address && <span className="ml-2">{receiver.address}</span>}
                                {item.name && <span className="ml-2">· {item.name}</span>}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(order.created_at).toLocaleDateString()} · ¥{order.price}
                                {order.estimated_delivery && <span className="ml-2">预计 {new Date(order.estimated_delivery).toLocaleDateString()} 送达</span>}
                              </div>
                            </div>
                            <button onClick={() => navigate('/tracking')} className="ml-4 text-primary hover:text-primary-600 text-sm font-medium whitespace-nowrap">追踪</button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      <p>暂无订单记录</p>
                      <button onClick={() => navigate('/shipping')} className="mt-4 text-primary hover:text-primary-600 font-medium">立即下单</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-lg font-bold mb-4">快捷操作</h3>
                  <div className="space-y-3">
                    <button onClick={() => navigate('/tracking')} className="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <span className="font-medium text-gray-700">查快递</span>
                    </button>
                    <button onClick={() => navigate('/shipping')} className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      <span className="font-medium text-gray-700">寄快递</span>
                    </button>
                    <button onClick={() => navigate('/urgent')} className="w-full flex items-center space-x-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span className="font-medium text-gray-700">同城急送</span>
                    </button>
                    <button onClick={() => navigate('/international')} className="w-full flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-medium text-gray-700">国际件</span>
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-lg font-bold mb-4">合作快递</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {companies.map(c => (
                      <div key={c.id} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-1">
                          <span className="text-primary font-bold text-xs">{c.code}</span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">{c.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {role === 'merchant' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">批量寄件概览</h2>
                    <button onClick={() => navigate('/shipping')} className="bg-secondary text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary-600">批量下单</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-green-50 rounded-lg p-5 text-center">
                      <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
                      <div className="text-sm text-gray-600 mt-1">已签收</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-5 text-center">
                      <div className="text-3xl font-bold text-blue-600">{stats.transit}</div>
                      <div className="text-sm text-gray-600 mt-1">在途中</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-5 text-center">
                      <div className="text-3xl font-bold text-red-600">{stats.exception}</div>
                      <div className="text-sm text-gray-600 mt-1">异常件</div>
                    </div>
                  </div>
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.slice(0, 8).map(order => {
                        const sender = parseJSON(order.sender_info);
                        const receiver = parseJSON(order.receiver_info);
                        return (
                          <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <span className="font-mono text-sm font-semibold">{order.order_no}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {sender.name} → {receiver.name} {receiver.address}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold">¥{order.price}</div>
                              <div className="text-xs text-gray-400">{order.weight}kg</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">暂无订单</div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-lg font-bold mb-4">API 调用统计</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">今日调用</span>
                      <span className="text-2xl font-bold text-primary">1,284</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">成功率</span>
                      <span className="text-2xl font-bold text-green-600">99.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">平均响应</span>
                      <span className="text-2xl font-bold text-secondary">46ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: '78%' }}></div>
                    </div>
                    <div className="text-xs text-gray-400">本月配额使用 78%</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-lg font-bold mb-4">运费分摊</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-600">本月运费</span><span className="font-bold">¥12,580</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">已分摊</span><span className="font-bold text-green-600">¥10,230</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">待分摊</span><span className="font-bold text-yellow-600">¥2,350</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {role === 'company' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">快递员绩效看板</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-primary-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">24</div>
                      <div className="text-xs text-gray-600 mt-1">在岗快递员</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">186</div>
                      <div className="text-xs text-gray-600 mt-1">今日派件</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">142</div>
                      <div className="text-xs text-gray-600 mt-1">今日取件</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">4.8</div>
                      <div className="text-xs text-gray-600 mt-1">平均评分</div>
                    </div>
                  </div>
                  <h3 className="font-bold mb-3">快递员排行</h3>
                  <div className="space-y-2">
                    {['张明 · 东区 · 派件32件 · 评分4.9', '李强 · 南区 · 派件28件 · 评分4.8', '王刚 · 西区 · 派件26件 · 评分4.7', '赵伟 · 北区 · 派件24件 · 评分4.9', '刘洋 · 中心区 · 派件22件 · 评分4.6'].map((c, i) => (
                      <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mr-3 ${i < 3 ? 'bg-warning text-white' : 'bg-gray-300 text-white'}`}>{i + 1}</span>
                        <span className="text-sm text-gray-700">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-lg font-bold mb-4">网关状态</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">API网关</span>
                      <span className="flex items-center text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">追踪服务</span>
                      <span className="flex items-center text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">比价引擎</span>
                      <span className="flex items-center text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">短信推送</span>
                      <span className="flex items-center text-yellow-600 font-medium"><span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>延迟</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">AI预测</span>
                      <span className="flex items-center text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>正常</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h3 className="text-lg font-bold mb-4">运单管理</h3>
                  <div className="space-y-3">
                    {[
                      { label: '待揽收', value: stats.pending, color: 'text-yellow-600' },
                      { label: '运输中', value: stats.transit, color: 'text-blue-600' },
                      { label: '已送达', value: stats.delivered, color: 'text-green-600' },
                      { label: '异常件', value: stats.exception, color: 'text-red-600' },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between items-center">
                        <span className="text-gray-600">{s.label}</span>
                        <span className={`font-bold ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">快捷服务</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {quickActions.map(a => (
              <Link key={a.to} to={a.to} className={`card-hover bg-gradient-to-br ${a.bg} to-white p-8 rounded-xl text-center`}>
                <div className={`w-16 h-16 ${a.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-gray-600">{a.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">核心优势</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">AI智能预测</h3>
              <p className="text-gray-600">基于历史数据和实时路况，AI模型精准预测送达时间，准确率达99%以上</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">跨公司比价</h3>
              <p className="text-gray-600">实时聚合3000+快递公司报价，一键比较价格和时效，选择最优方案</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">同城急送</h3>
              <p className="text-gray-600">20分钟响应SLA，智能调度最近的快递员，实时位置追踪</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
