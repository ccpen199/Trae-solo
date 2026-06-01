import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

export default function Admin() {
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <Link to="/admin">📊 数据概览</Link>
        <Link to="/admin/orders">📋 订单管理</Link>
        <Link to="/admin/products">🎫 商品管理</Link>
        <Link to="/admin/users">👥 用户管理</Link>
      </div>
      <div className="admin-content">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
        </Routes>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/statistics').then(r => r.json()).then(res => {
      if (res.success) setStats(res.data);
    });
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>📊 数据概览</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_orders || 0}</div>
          <div className="stat-label">总订单数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{stats?.total_revenue || 0}</div>
          <div className="stat-label">总营收</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_products || 6}</div>
          <div className="stat-label">商品总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_users || 100}</div>
          <div className="stat-label">用户总数</div>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const res = await fetch('/api/orders').then(r => r.json());
    if (res.success) setOrders(res.data.list || []);
  }

  async function handleConfirm(id) {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' })
    });
    loadOrders();
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>📋 订单管理</h2>
      {orders.length === 0 ? (
        <div className="empty">暂无订单数据，请先去首页下单体验</div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <span>订单号：{order.order_no}</span>
              <span>用户：{order.traveler_name || '测试用户'}</span>
            </div>
            <div className="order-product">
              <div></div>
              <div className="order-product-info">
                <h4>三亚5日4晚自由行</h4>
                <p>{order.traveler_count || 1}人出行</p>
              </div>
            </div>
            <div className="order-footer">
              <div className="order-total">¥{order.total_price || order.price}</div>
              {order.status === 'paid' && (
                <button className="btn btn-primary" onClick={() => handleConfirm(order.id)} style={{ padding: '8px 16px', width: 'auto' }}>
                  确认订单
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({ title: '', subtitle: '', price: '', original_price: '', tags: '' });

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const res = await fetch('/api/admin/products').then(r => r.json());
    if (res.success) setProducts(res.data.list || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (confirm('确定删除此商品吗？')) {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      loadProducts();
    }
  }

  function handleEdit(product) {
    setEditProduct(product);
    setFormData({ title: product.title, subtitle: product.subtitle, price: product.price, original_price: product.original_price, tags: product.tags?.join(',') || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = { ...formData, price: Number(formData.price), original_price: Number(formData.original_price), tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean), images: 'https://picsum.photos/400/300?random=' + Date.now() };
    
    if (editProduct) {
      await fetch(`/api/admin/products/${editProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    loadProducts();
    setShowForm(false);
    setEditProduct(null);
    setFormData({ title: '', subtitle: '', price: '', original_price: '', tags: '' });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>🎫 商品管理</h2>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => { setEditProduct(null); setFormData({ title: '', subtitle: '', price: '', original_price: '', tags: '' }); setShowForm(true); }}>
          + 添加商品
        </button>
      </div>

      {showForm && (
        <div className="order-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>{editProduct ? '编辑商品' : '添加商品'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>商品名称</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>副标题</label>
                <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>销售价格</label>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>原价</label>
                <input type="number" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>标签（逗号分隔）</label>
              <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="如: 海岛,亲子,网红" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>保存</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>取消</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">加载中...</div> : (
        <div>
          {products.map(product => (
            <div key={product.id} className="product-card" style={{ display: 'flex', marginBottom: '12px', height: '120px', padding: 0 }}>
              <img src={product.images} alt="" style={{ width: '160px', height: '120px', objectFit: 'cover' }} />
              <div style={{ flex: 1, padding: '12px' }}>
                <h4 style={{ marginBottom: '4px' }}>{product.title}</h4>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>{product.subtitle}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#ff6b35', fontWeight: 'bold', fontSize: '18px' }}>¥{product.price}</span>
                  {product.original_price && <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '13px' }}>¥{product.original_price}</span>}
                  <span style={{ fontSize: '12px', color: '#999', marginLeft: 'auto' }}>已售 {product.sales}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {product.tags?.map((tag, i) => <span key={i} style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{tag}</span>)}
                </div>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-outline" style={{ padding: '6px 16px' }} onClick={() => handleEdit(product)}>编辑</button>
                <button className="btn btn-outline" style={{ padding: '6px 16px', borderColor: '#f5222d', color: '#f5222d' }} onClick={() => handleDelete(product.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ nickname: '', phone: '', role: 'user' });

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await fetch('/api/admin/users').then(r => r.json());
    if (res.success) setUsers(res.data.list || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (confirm('确定删除此用户吗？')) {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      loadUsers();
    }
  }

  function handleEdit(user) {
    setEditUser(user);
    setFormData({ nickname: user.nickname, phone: user.phone, role: user.role });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editUser) {
      await fetch(`/api/admin/users/${editUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    loadUsers();
    setShowForm(false);
    setEditUser(null);
    setFormData({ nickname: '', phone: '', role: 'user' });
  }

  const roleMap = { user: '普通用户', service: '客服', operation: '运营', admin: '管理员' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>👥 用户管理</h2>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => { setEditUser(null); setFormData({ nickname: '', phone: '', role: 'user' }); setShowForm(true); }}>
          + 添加用户
        </button>
      </div>

      {showForm && (
        <div className="order-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>{editUser ? '编辑用户' : '添加用户'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>用户昵称</label>
                <input value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>手机号</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>角色</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="user">普通用户</option>
                <option value="service">客服</option>
                <option value="operation">运营</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>保存</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>取消</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="loading">加载中...</div> : (
        <div>
          {users.map(user => (
            <div key={user.id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
              <img src={user.avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ marginBottom: '4px' }}>{user.nickname}</h4>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>{user.phone} · 注册于 {user.created_at}</p>
              </div>
              <div style={{ textAlign: 'right', marginRight: '16px' }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>订单: <span style={{ fontWeight: 'bold', color: '#ff6b35' }}>{user.orders}</span></div>
                <div style={{ fontSize: '14px' }}>消费: <span style={{ fontWeight: 'bold', color: '#52c41a' }}>¥{user.spend}</span></div>
              </div>
              <div style={{ background: user.role === 'user' ? '#e6f7ff' : '#f6ffed', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', marginRight: '16px', color: user.role === 'user' ? '#1890ff' : '#52c41a' }}>
                {roleMap[user.role]}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ padding: '6px 16px' }} onClick={() => handleEdit(user)}>编辑</button>
                {user.role === 'user' && (
                  <button className="btn btn-outline" style={{ padding: '6px 16px', borderColor: '#f5222d', color: '#f5222d' }} onClick={() => handleDelete(user.id)}>删除</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
