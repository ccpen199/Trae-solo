import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import { orderAPI, postAPI, messageAPI } from './utils/api';
import './styles.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, isAuthenticated } = useAuthStore();

  const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/posts', icon: '💬', label: '讨论区' },
    { path: '/orders/create', icon: '➕', label: '发布' },
    { path: '/messages', icon: '📩', label: '消息', badge: isAuthenticated ? unreadCount : 0 },
    { path: '/profile', icon: '👤', label: '我的' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <div
          key={item.path}
          className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div style={{ position: 'relative' }}>
            <span className="bottom-nav-icon">{item.icon}</span>
            {item.badge > 0 && (
              <span className="badge" style={{ position: 'absolute', top: -6, right: -6 }}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>{message}</div>
  );
};

const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = '') => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
};

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('all');

  const { isAuthenticated } = useAuthStore();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { keyword: searchKeyword, search_type: searchType };
      const response = await orderAPI.getOrders(params);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postAPI.getPosts({ keyword: searchKeyword, search_type: searchType });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchPosts();
    }
  }, [activeTab, searchKeyword, searchType]);

  const handleSearch = () => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchPosts();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">壹互</h1>
      </div>

      <div className="search-bar">
        <select
          className="input"
          style={{ flex: '0 0 100px' }}
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="all">全部</option>
          <option value="topic">话题</option>
          <option value="tags">标签</option>
          {isAuthenticated && <option value="classmate">同学</option>}
        </select>
        <input
          type="text"
          className="input"
          placeholder="搜索订单或帖子..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
      </div>

      <div className="tab-bar">
        <div
          className={`tab-bar-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          接单
        </div>
        <div
          className={`tab-bar-item ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          讨论
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'orders' ? (
          orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>暂无订单</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  className="card"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-8">
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{order.topic}</h3>
                      <span className={`tag ${order.status === 'pending' ? 'tag-primary' : ''}`}>
                        {order.status === 'pending' ? '待接单' : order.status === 'accepted' ? '配送中' : '已完成'}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>
                      {order.remark}
                    </p>
                    <div className="flex flex-wrap gap-8 mb-8">
                      {order.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-8">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {order.poster_name?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {order.poster_name}
                        </span>
                      </div>
                      <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                        ¥{order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>暂无帖子</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {posts.map(post => (
                <div
                  key={post.id}
                  className="card"
                  onClick={() => navigate(`/posts/${post.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-8">
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{post.topic}</h3>
                    </div>
                    <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </p>
                    <div className="flex flex-wrap gap-8 mb-8">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-8">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {post.author_name?.charAt(0) || '?'}
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {post.author_name}
                        </span>
                      </div>
                      <div className="flex gap-16" style={{ fontSize: '12px', color: '#999' }}>
                        <span>❤️ {post.like_count}</span>
                        <span>💬 {post.comment_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('password');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, loginPhone, thirdPartyLogin, error, clearError } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    let result;
    if (loginType === 'password') {
      result = await login({ phone: formData.phone, password: formData.password });
    } else {
      result = await loginPhone({ phone: formData.phone, code: formData.code });
    }

    setLoading(false);

    if (result.success) {
      showToast('登录成功', 'success');
      setTimeout(() => navigate('/'), 500);
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleThirdParty = async (provider) => {
    setLoading(true);
    const result = await thirdPartyLogin({ provider, provider_id: `${provider}_${Date.now()}` });
    setLoading(false);

    if (result.success) {
      if (result.needComplete) {
        navigate('/complete-profile');
      } else {
        showToast('登录成功', 'success');
        setTimeout(() => navigate('/'), 500);
      }
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="page" style={{ backgroundColor: '#fff' }}>
      <div className="form-container" style={{ paddingTop: '60px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '8px' }}>壹互</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>校园配送 + 社区</p>

        <div className="tab-bar" style={{ marginBottom: '24px' }}>
          <div
            className={`tab-bar-item ${loginType === 'password' ? 'active' : ''}`}
            onClick={() => setLoginType('password')}
          >
            密码登录
          </div>
          <div
            className={`tab-bar-item ${loginType === 'code' ? 'active' : ''}`}
            onClick={() => setLoginType('code')}
          >
            验证码登录
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="input"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {loginType === 'password' ? (
            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="input"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">验证码</label>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="请输入验证码"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => showToast('验证码已发送（模拟）', 'success')}
                >
                  获取验证码
                </button>
              </div>
            </div>
          )}

          {error && <p className="form-error text-center">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span className="text-muted">还没有账号？</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>去注册</a>
        </div>

        <div style={{ marginTop: '32px' }}>
          <p className="text-muted text-center" style={{ marginBottom: '16px' }}>第三方登录</p>
          <div className="flex justify-center gap-16">
            <button
              className="btn btn-outline"
              style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px' }}
              onClick={() => handleThirdParty('wechat')}
            >
              💚
            </button>
            <button
              className="btn btn-outline"
              style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px' }}
              onClick={() => handleThirdParty('qq')}
            >
              🐧
            </button>
            <button
              className="btn btn-outline"
              style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px' }}
              onClick={() => handleThirdParty('weibo')}
            >
              📱
            </button>
          </div>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    real_name: '',
    school: '',
    student_id: '',
    phone: '',
    password: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const { register, error, clearError } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    const result = await register(formData);

    setLoading(false);

    if (result.success) {
      showToast('注册成功', 'success');
      setTimeout(() => navigate('/'), 500);
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="page" style={{ backgroundColor: '#fff' }}>
      <div className="form-container" style={{ paddingTop: '40px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '32px' }}>注册账号</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">真实姓名</label>
            <input
              type="text"
              className="input"
              placeholder="请输入真实姓名"
              value={formData.real_name}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">学校</label>
            <input
              type="text"
              className="input"
              placeholder="请输入学校名称"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">学号</label>
            <input
              type="text"
              className="input"
              placeholder="请输入学号"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="input"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="input"
              placeholder="请设置密码（至少6位）"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">验证码</label>
            <div className="input-group">
              <input
                type="text"
                className="input"
                placeholder="请输入验证码"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => showToast('验证码已发送（模拟）', 'success')}
              >
                获取验证码
              </button>
            </div>
          </div>

          {error && <p className="form-error text-center">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span className="text-muted">已有账号？</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>去登录</a>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
};

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    real_name: '',
    school: '',
    student_id: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { completeProfile } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await completeProfile(formData);

    setLoading(false);

    if (result.success) {
      showToast('资料完善成功', 'success');
      setTimeout(() => navigate('/'), 500);
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="page" style={{ backgroundColor: '#fff' }}>
      <div className="form-container" style={{ paddingTop: '40px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '8px' }}>完善资料</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>
          首次登录，请完善个人信息
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">真实姓名</label>
            <input
              type="text"
              className="input"
              placeholder="请输入真实姓名"
              value={formData.real_name}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">学校</label>
            <input
              type="text"
              className="input"
              placeholder="请输入学校名称"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">学号</label>
            <input
              type="text"
              className="input"
              placeholder="请输入学号"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">手机号</label>
            <input
              type="tel"
              className="input"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? '提交中...' : '完成'}
          </button>
        </form>
      </div>

      {ToastComponent}
    </div>
  );
};

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    topic: '',
    remark: '',
    tags: '',
    delivery_fee: '',
    item_price: ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="page-header">
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
          <h1 className="page-title">发布订单</h1>
          <span style={{ width: '40px' }}></span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <p>请先登录</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/login')}>去登录</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic || !formData.remark || !formData.tags || !formData.delivery_fee || !formData.item_price) {
      showToast('请填写完整信息', 'error');
      return;
    }

    setLoading(true);
    try {
      const tagsArray = formData.tags.split(/[,，\s]+/).filter(t => t);
      await orderAPI.createOrder({
        ...formData,
        tags: tagsArray,
        delivery_fee: parseFloat(formData.delivery_fee),
        item_price: parseFloat(formData.item_price)
      });
      showToast('发布成功', 'success');
      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      showToast(error.response?.data?.error || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (parseFloat(formData.delivery_fee) || 0) + (parseFloat(formData.item_price) || 0);

  return (
    <div className="page" style={{ backgroundColor: '#fff' }}>
      <div className="page-header">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
        <h1 className="page-title">发布订单</h1>
        <span style={{ width: '40px' }}></span>
      </div>

      <div style={{ padding: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">订单话题 *</label>
            <input
              type="text"
              className="input"
              placeholder="如：帮忙取个快递"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">订单备注 *</label>
            <textarea
              className="input"
              placeholder="详细描述你的需求"
              rows={4}
              style={{ resize: 'none' }}
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">订单标签 * <span className="text-muted">(用逗号或空格分隔)</span></label>
            <input
              type="text"
              className="input"
              placeholder="如：代取, 快递, 低价"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">配送费 * <span className="text-muted">(元)</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="如：5.00"
              value={formData.delivery_fee}
              onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">物品价格 * <span className="text-muted">(元)</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="如：29.90"
              value={formData.item_price}
              onChange={(e) => setFormData({ ...formData, item_price: e.target.value })}
            />
          </div>

          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div className="flex justify-between items-center">
              <span className="text-muted">总额</span>
              <span style={{ fontSize: '24px', fontWeight: 600, color: '#ff4d4f' }}>
                ¥{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '发布中...' : '发布订单'}
          </button>
        </form>
      </div>

      {ToastComponent}
    </div>
  );
};

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.pathname.split('/').pop();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrder(orderId);
      setOrder(response.data.order);
    } catch (error) {
      console.error('获取订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      await orderAPI.acceptOrder(orderId);
      showToast('接单成功', 'success');
      fetchOrder();
    } catch (error) {
      showToast(error.response?.data?.error || '接单失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await orderAPI.completeOrder(orderId);
      showToast('订单已完成', 'success');
      fetchOrder();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await orderAPI.cancelOrder(orderId);
      showToast('订单已取消', 'success');
      fetchOrder();
    } catch (error) {
      showToast(error.response?.data?.error || '取消失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChat = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (order.poster_id && order.poster_id !== user?.id) {
      navigate(`/messages/chat/${order.poster_id}`);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
          <h1 className="page-title">订单详情</h1>
          <span style={{ width: '40px' }}></span>
        </div>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="page-header">
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
          <h1 className="page-title">订单详情</h1>
          <span style={{ width: '40px' }}></span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <p>订单不存在</p>
        </div>
      </div>
    );
  }

  const isPoster = user?.id === order.poster_id;
  const isAccepter = user?.id === order.accepter_id;

  return (
    <div className="page">
      <div className="page-header">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
        <h1 className="page-title">订单详情</h1>
        <span style={{ width: '40px' }}></span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="card">
          <div className="card-body">
            <div className="flex justify-between items-start mb-16">
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{order.topic}</h2>
              <span className={`tag ${order.status === 'pending' ? 'tag-primary' : ''}`}>
                {order.status === 'pending' ? '待接单' : order.status === 'accepted' ? '配送中' : order.status === 'completed' ? '已完成' : '已取消'}
              </span>
            </div>

            <p style={{ color: '#666', marginBottom: '16px', lineHeight: 1.6 }}>{order.remark}</p>

            <div className="flex flex-wrap gap-8 mb-16">
              {order.tags.map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '16px' }}>
              <div className="flex justify-between items-center mb-8">
                <span className="text-muted">配送费</span>
                <span>¥{order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-8">
                <span className="text-muted">物品价格</span>
                <span>¥{order.item_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center" style={{ paddingTop: '12px', borderTop: '1px dashed #e8e8e8' }}>
                <span className="text-muted">总额</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: '#ff4d4f' }}>
                  ¥{order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-16">
          <div className="card-body">
            <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>发布人</h3>
            <div className="flex items-center gap-12" onClick={handleChat} style={{ cursor: isAuthenticated ? 'pointer' : 'default' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {order.poster_name?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>{order.poster_name}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>{order.poster_school || ''}</div>
              </div>
              {isAuthenticated && <span style={{ marginLeft: 'auto', color: '#1890ff' }}>私信 →</span>}
            </div>
          </div>
        </div>

        {order.accepter_id && (
          <div className="card mt-16">
            <div className="card-body">
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>接单人</h3>
              <div className="flex items-center gap-12">
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {order.accepter_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{order.accepter_name}</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>{order.accepter_school || ''}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '16px 0' }}>
          {order.status === 'pending' && !isPoster && isAuthenticated && (
            <button
              className="btn btn-primary btn-block"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? '接单中...' : '接单'}
            </button>
          )}

          {order.status === 'pending' && !isPoster && !isAuthenticated && (
            <button
              className="btn btn-outline btn-block"
              onClick={() => navigate('/login')}
            >
              登录后接单
            </button>
          )}

          {order.status === 'pending' && isPoster && (
            <button
              className="btn btn-outline btn-block"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? '取消中...' : '取消订单'}
            </button>
          )}

          {order.status === 'accepted' && (isPoster || isAccepter) && (
            <button
              className="btn btn-primary btn-block"
              onClick={handleComplete}
              disabled={actionLoading}
            >
              {actionLoading ? '处理中...' : '确认完成'}
            </button>
          )}
        </div>
      </div>

      {ToastComponent}
    </div>
  );
};

const PostsPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const { isAuthenticated } = useAuthStore();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postAPI.getPosts({ keyword: searchKeyword });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchKeyword]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">讨论区</h1>
        {isAuthenticated && (
          <button className="btn btn-primary" onClick={() => navigate('/posts/create')}>发帖</button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          className="input"
          placeholder="搜索帖子..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      <div style={{ padding: '12px' }}>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>暂无帖子，快来发布第一条吧</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map(post => (
              <div
                key={post.id}
                className="card"
                onClick={() => navigate(`/posts/${post.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body">
                  <div className="flex justify-between items-start mb-8">
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{post.topic}</h3>
                  </div>
                  <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </p>
                  <div className="flex flex-wrap gap-8 mb-8">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-8">
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                        {post.author_name?.charAt(0) || '?'}
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {post.author_name}
                      </span>
                    </div>
                    <div className="flex gap-16" style={{ fontSize: '12px', color: '#999' }}>
                      <span style={{ color: post.is_liked ? '#ff4d4f' : '#999' }}>❤️ {post.like_count}</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic || !formData.content || !formData.tags) {
      showToast('请填写完整信息', 'error');
      return;
    }

    setLoading(true);
    try {
      const tagsArray = formData.tags.split(/[,，\s]+/).filter(t => t);
      await postAPI.createPost({
        ...formData,
        tags: tagsArray
      });
      showToast('发布成功', 'success');
      setTimeout(() => navigate('/posts'), 500);
    } catch (error) {
      showToast(error.response?.data?.error || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ backgroundColor: '#fff' }}>
      <div className="page-header">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
        <h1 className="page-title">发布帖子</h1>
        <span style={{ width: '40px' }}></span>
      </div>

      <div style={{ padding: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">帖子话题 * <span className="text-muted">(最多50字)</span></label>
            <input
              type="text"
              className="input"
              placeholder="输入话题..."
              maxLength={50}
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />
            <div className="text-muted" style={{ textAlign: 'right', fontSize: '12px', marginTop: '4px' }}>
              {formData.topic.length}/50
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">帖子内容 * <span className="text-muted">(最多2000字)</span></label>
            <textarea
              className="input"
              placeholder="分享你的想法..."
              rows={8}
              maxLength={2000}
              style={{ resize: 'none' }}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <div className="text-muted" style={{ textAlign: 'right', fontSize: '12px', marginTop: '4px' }}>
              {formData.content.length}/2000
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">帖子标签 * <span className="text-muted">(用逗号或空格分隔)</span></label>
            <input
              type="text"
              className="input"
              placeholder="如：校园生活, 求助, 闲聊"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '发布中...' : '发布'}
          </button>
        </form>
      </div>

      {ToastComponent}
    </div>
  );
};

const PostDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const postId = location.pathname.split('/').pop();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await postAPI.getPost(postId);
      setPost(response.data.post);
      setComments(response.data.comments);
    } catch (error) {
      console.error('获取帖子详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const response = await postAPI.likePost(postId);
      setPost(response.data.post);
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const response = await postAPI.favoritePost(postId);
      setPost(response.data.post);
      showToast(post.is_favorited ? '已取消收藏' : '已收藏', 'success');
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!commentText.trim()) {
      showToast('请输入评论内容', 'error');
      return;
    }

    setCommentLoading(true);
    try {
      await postAPI.commentPost(postId, { content: commentText.trim() });
      setCommentText('');
      fetchPost();
      showToast('评论成功', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || '评论失败', 'error');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = () => {
    showToast('分享链接已复制（模拟）', 'success');
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    showToast('举报已提交（模拟）', 'success');
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
          <h1 className="page-title">帖子详情</h1>
          <span style={{ width: '40px' }}></span>
        </div>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page">
        <div className="page-header">
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
          <h1 className="page-title">帖子详情</h1>
          <span style={{ width: '40px' }}></span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <p>帖子不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
        <h1 className="page-title">帖子详情</h1>
        <span onClick={handleReport} style={{ cursor: 'pointer' }}>...</span>
      </div>

      <div className="card" style={{ margin: '12px', borderRadius: '8px' }}>
        <div className="card-body">
          <div className="flex items-center gap-12 mb-16">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              {post.author_name?.charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{post.author_name}</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>{post.author_school || ''}</div>
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{post.topic}</h2>

          <p style={{ color: '#333', lineHeight: 1.8, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>

          <div className="flex flex-wrap gap-8 mb-16">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>

          <div className="flex justify-between items-center" style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
            <div
              className="flex items-center gap-4"
              onClick={handleLike}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: '18px', color: post.is_liked ? '#ff4d4f' : '#999' }}>❤️</span>
              <span style={{ color: post.is_liked ? '#ff4d4f' : '#999' }}>{post.like_count}</span>
            </div>
            <div
              className="flex items-center gap-4"
              onClick={handleFavorite}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: '18px', color: post.is_favorited ? '#faad14' : '#999' }}>⭐</span>
              <span style={{ color: post.is_favorited ? '#faad14' : '#999' }}>收藏</span>
            </div>
            <div
              className="flex items-center gap-4"
              onClick={handleShare}
              style={{ cursor: 'pointer', color: '#999' }}
            >
              <span style={{ fontSize: '18px' }}>🔗</span>
              <span>分享</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ margin: '12px', borderRadius: '8px' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>评论 ({comments.length})</h3>

          {comments.length === 0 ? (
            <div className="text-muted text-center" style={{ padding: '20px' }}>
              暂无评论，快来抢沙发吧
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' }}>
                  <div className="flex items-center gap-8 mb-8">
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                      {comment.author_name?.charAt(0) || '?'}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{comment.author_name}</span>
                    <span className="text-muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                      {comment.created_at}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.6, paddingLeft: '36px' }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: '70px', left: 0, right: 0, padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #e8e8e8' }}>
        <div className="input-group">
          <input
            type="text"
            className="input"
            placeholder={isAuthenticated ? '写下你的评论...' : '请先登录'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!isAuthenticated}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
          />
          <button
            className="btn btn-primary"
            onClick={handleComment}
            disabled={commentLoading || !isAuthenticated}
          >
            {commentLoading ? '...' : '发送'}
          </button>
        </div>
      </div>

      <BottomNav />
      {ToastComponent}
    </div>
  );
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, fetchUnreadCount } = useAuthStore();

  const fetchMessages = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await messageAPI.getMessages();
      setMessages(response.data.messages);
      await fetchUnreadCount();
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await messageAPI.getChats();
      setChats(response.data.chats);
    } catch (error) {
      console.error('获取聊天列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchMessages();
    } else {
      fetchChats();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">消息</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <p>请先登录查看消息</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/login')}>去登录</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const markAllRead = async () => {
    try {
      await messageAPI.markAsRead({});
      fetchMessages();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">消息</h1>
        {activeTab === 'notifications' && (
          <span style={{ fontSize: '14px', color: '#1890ff', cursor: 'pointer' }} onClick={markAllRead}>
            全部已读
          </span>
        )}
      </div>

      <div className="tab-bar">
        <div
          className={`tab-bar-item ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          通知
        </div>
        <div
          className={`tab-bar-item ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          私信
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'notifications' ? (
          messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>暂无通知</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {messages.map(msg => (
                <div key={msg.id} className="card" style={{ opacity: msg.is_read ? 0.7 : 1 }}>
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-8">
                        <span style={{ fontSize: '18px' }}>
                          {msg.type === 'order_notification' ? '📦' : msg.type === 'post_like' ? '❤️' : '💬'}
                        </span>
                        <span style={{ fontWeight: 500 }}>
                          {msg.type === 'order_notification' ? '订单通知' : msg.type === 'post_like' ? '获赞通知' : '评论通知'}
                        </span>
                      </div>
                      {!msg.is_read && <span className="badge"></span>}
                    </div>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>{msg.content}</p>
                    <p className="text-muted" style={{ fontSize: '12px' }}>{msg.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          chats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>暂无私信</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              {chats.map(chat => (
                <div
                  key={chat.user_id}
                  onClick={() => navigate(`/messages/chat/${chat.user_id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {chat.user_name?.charAt(0) || '?'}
                    </div>
                    {chat.unread_count > 0 && (
                      <span className="badge" style={{ position: 'absolute', top: -2, right: -2 }}>
                        {chat.unread_count > 99 ? '99+' : chat.unread_count}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex justify-between items-center mb-4">
                      <span style={{ fontWeight: 500 }}>{chat.user_name}</span>
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        {chat.last_message_at?.slice(11, 16) || ''}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.last_message || '暂无消息'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.pathname.split('/').pop();
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [userId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getChatMessages(userId);
      setChatUser(response.data.user);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('获取聊天记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    setSending(true);
    try {
      await messageAPI.sendMessage(userId, { content: inputText.trim() });
      setInputText('');
      fetchMessages();
    } catch (error) {
      showToast(error.response?.data?.error || '发送失败', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="page-header">
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
          <h1 className="page-title">聊天</h1>
          <span style={{ width: '40px' }}></span>
        </div>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="page-header">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
        <h1 className="page-title">{chatUser?.real_name || '聊天'}</h1>
        <span style={{ width: '40px' }}></span>
      </div>

      <div style={{ padding: '16px', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>开始聊天吧</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(msg => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '70%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                      {isMine ? user?.real_name?.charAt(0) : chatUser?.real_name?.charAt(0)}
                    </div>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: isMine ? '#1890ff' : '#fff',
                        color: isMine ? '#fff' : '#333',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', backgroundColor: '#fff', borderTop: '1px solid #e8e8e8' }}>
        <div className="input-group">
          <input
            type="text"
            className="input"
            placeholder="输入消息..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
          >
            {sending ? '...' : '发送'}
          </button>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, fetchUnreadCount } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getMyOrders({ type: 'all' });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postAPI.getMyPosts({ type: 'posted' });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('获取帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await postAPI.getMyPosts({ type: 'favorited' });
      setFavorites(response.data.posts);
    } catch (error) {
      console.error('获取收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'orders') fetchOrders();
      else if (activeTab === 'posts') fetchPosts();
      else if (activeTab === 'favorites') fetchFavorites();
      fetchUnreadCount();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">我的</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <p>登录后查看个人中心</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/login')}>去登录</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">我的</h1>
        <span onClick={() => navigate('/settings')} style={{ cursor: 'pointer', fontSize: '20px' }}>⚙️</span>
      </div>

      <div className="card" style={{ margin: '12px', borderRadius: '8px' }}>
        <div className="card-body">
          <div className="flex items-center gap-12">
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              {user?.real_name?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>{user?.real_name}</h2>
              <p className="text-muted" style={{ fontSize: '13px' }}>{user?.school} · {user?.student_id}</p>
              {user?.signature && <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>{user.signature}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="tab-bar">
        <div
          className={`tab-bar-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          我的订单
        </div>
        <div
          className={`tab-bar-item ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          我的帖子
        </div>
        <div
          className={`tab-bar-item ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          我的收藏
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'orders' ? (
          orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>暂无订单</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  className="card"
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-8">
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{order.topic}</h3>
                      <span className={`tag ${order.status === 'pending' ? 'tag-primary' : ''}`}>
                        {order.status === 'pending' ? '待接单' : order.status === 'accepted' ? '配送中' : order.status === 'completed' ? '已完成' : '已取消'}
                      </span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>
                      {order.remark}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        {order.poster_id === user?.id ? '我发布的' : '我接的'}
                      </span>
                      <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                        ¥{order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>暂无帖子</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {posts.map(post => (
                <div
                  key={post.id}
                  className="card"
                  onClick={() => navigate(`/posts/${post.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{post.topic}</h3>
                    <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </p>
                    <div className="flex gap-16" style={{ fontSize: '12px', color: '#999' }}>
                      <span>❤️ {post.like_count}</span>
                      <span>💬 {post.comment_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          favorites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <p>暂无收藏</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {favorites.map(post => (
                <div
                  key={post.id}
                  className="card"
                  onClick={() => navigate(`/posts/${post.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{post.topic}</h3>
                    <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </p>
                    <div className="flex items-center gap-8">
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        {post.author_name?.charAt(0) || '?'}
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {post.author_name}
                      </span>
                      <span className="text-muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
                        ❤️ {post.like_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="card" style={{ margin: '12px', borderRadius: '8px' }}>
        <div
          onClick={() => navigate('/settings')}
          style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
        >
          <span style={{ fontSize: '18px', marginRight: '12px' }}>⚙️</span>
          <span>设置</span>
          <span style={{ marginLeft: 'auto', color: '#ccc' }}>→</span>
        </div>
        <div
          onClick={() => setShowLogoutModal(true)}
          style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '18px', marginRight: '12px' }}>🚪</span>
          <span className="text-danger">退出登录</span>
        </div>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">确认退出</h3>
              <span className="modal-close" onClick={() => setShowLogoutModal(false)}>×</span>
            </div>
            <div className="modal-body">
              <p>确定要退出登录吗？</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowLogoutModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleLogout}>退出</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    real_name: user?.real_name || '',
    school: user?.school || '',
    student_id: user?.student_id || '',
    avatar: user?.avatar || '',
    signature: user?.signature || ''
  });
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateUser(formData);
    setLoading(false);

    if (result.success) {
      showToast('保存成功', 'success');
      setTimeout(() => navigate('/profile'), 500);
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="page" style={{ backgroundColor: '#fff' }}>
      <div className="page-header">
        <span onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>← 返回</span>
        <h1 className="page-title">设置</h1>
        <span style={{ width: '40px' }}></span>
      </div>

      <div style={{ padding: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">真实姓名</label>
            <input
              type="text"
              className="input"
              value={formData.real_name}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">学校</label>
            <input
              type="text"
              className="input"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">学号</label>
            <input
              type="text"
              className="input"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">个性签名</label>
            <textarea
              className="input"
              rows={3}
              placeholder="介绍一下自己..."
              style={{ resize: 'none' }}
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </form>
      </div>

      {ToastComponent}
    </div>
  );
};

const App = () => {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/complete-profile" element={
          <ProtectedRoute><CompleteProfilePage /></ProtectedRoute>
        } />

        <Route path="/orders" element={<HomePage />} />
        <Route path="/orders/create" element={<CreateOrderPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/create" element={
          <ProtectedRoute><CreatePostPage /></ProtectedRoute>
        } />
        <Route path="/posts/:id" element={<PostDetailPage />} />

        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/chat/:userId" element={
          <ProtectedRoute><ChatPage /></ProtectedRoute>
        } />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
