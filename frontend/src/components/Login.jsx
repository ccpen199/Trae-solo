
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE from '../apiConfig';

const VEHICLE_TYPES = [
  '小型货车', '中型货车', '大型货车', '平板车', '冷藏车',
  '危险品车', '高栏车', '厢式货车', '自卸车', '半挂车', '全挂车', '轿运车'
];

const ROLE_NAMES = { shipper: '货主', driver: '司机', admin: '管理员' };
const ROLE_DESCS = {
  shipper: '发布货源、筛选司机、追踪订单全流程',
  driver: '接单议价、更新运输状态、管理个人资质',
  admin: '审核司机资质、查看运营数据、管理全部订单'
};
const ROLE_COLORS = { shipper: '#e8f4fc', driver: '#e8f8f0', admin: '#fdf2e9' };

const Login = () => {
  const [activeTab, setActiveTab] = useState('shipper');
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [extraFields, setExtraFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsLogin(tab === 'admin' ? true : isLogin);
    setUsername('');
    setPassword('');
    setExtraFields({});
    setMsg({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!username.trim()) { setMsg({ type: 'error', text: '请输入用户名' }); return; }
    if (password.length < 4) { setMsg({ type: 'error', text: '密码长度至少4位' }); return; }

    if (!isLogin) {
      if (activeTab === 'shipper') {
        if (!extraFields.companyName) { setMsg({ type: 'error', text: '请输入公司名称' }); return; }
        if (!extraFields.contactPerson) { setMsg({ type: 'error', text: '请输入联系人' }); return; }
        if (!extraFields.phone) { setMsg({ type: 'error', text: '请输入联系电话' }); return; }
      }
      if (activeTab === 'driver') {
        if (!extraFields.realName) { setMsg({ type: 'error', text: '请输入真实姓名' }); return; }
        if (!extraFields.phone) { setMsg({ type: 'error', text: '请输入联系电话' }); return; }
        if (!extraFields.vehicleType) { setMsg({ type: 'error', text: '请选择车型' }); return; }
      }
    }

    setLoading(true);

    const endpoint = isLogin
      ? `${API_BASE}/api/auth/${activeTab}/login`
      : `${API_BASE}/api/auth/${activeTab}/register`;

    const payload = isLogin
      ? { username, password }
      : { username, password, ...extraFields };

    try {
      const res = await axios.post(endpoint, payload);

      if (!res.data || !res.data.user || !res.data.token) {
        setMsg({ type: 'error', text: '服务器返回数据异常，请联系管理员' });
        return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      setMsg({ type: 'success', text: `${isLogin ? '登录' : '注册'}成功！正在进入${ROLE_NAMES[activeTab]}工作台...` });

      window.location.href = `/${activeTab}`;

    } catch (err) {
      let text;
      if (err.response) {
        const s = err.response.status;
        const e = err.response.data?.error;
        if (s === 401) text = '用户名或密码错误，请确认后重试';
        else if (s === 400) text = e || '用户名可能已存在，请更换后重试';
        else if (s === 403) text = '权限不足，请确认账号角色是否正确';
        else if (s >= 500) text = '服务器异常，请稍后重试';
        else text = e || '操作失败，请稍后重试';
      } else if (err.request) {
        text = '无法连接服务器，请检查网络后重试';
      } else {
        text = err.message || '操作失败';
      }
      setMsg({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  const msgStyle = {
    error: { background: '#fde8e8', color: '#c53030', icon: '⚠️' },
    success: { background: '#e8f8f0', color: '#276749', icon: '✅' }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2 style={{ marginBottom: 6, textAlign: 'center' }}>B2B 数字货运调度平台</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 20, fontSize: 13 }}>
          连接货主与司机，打造高效物流生态
        </p>

        <div className="auth-tabs">
          {['shipper', 'driver', 'admin'].map(role => (
            <div
              key={role}
              className={`auth-tab ${activeTab === role ? 'active' : ''}`}
              onClick={() => switchTab(role)}
            >
              {role === 'shipper' ? '我是货主' : role === 'driver' ? '我是司机' : '管理后台'}
            </div>
          ))}
        </div>

        <div style={{ padding: 10, borderRadius: 6, marginBottom: 14, background: ROLE_COLORS[activeTab], fontSize: 13 }}>
          💡 {ROLE_DESCS[activeTab]}
        </div>

        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <button
            className="btn"
            onClick={() => { setIsLogin(true); setMsg({ type: '', text: '' }); }}
            style={{ marginRight: 8, background: isLogin ? '#3498db' : '#bdc3c7', color: '#fff', minWidth: 96 }}
          >
            登录账号
          </button>
          {activeTab !== 'admin' && (
            <button
              className="btn"
              onClick={() => { setIsLogin(false); setMsg({ type: '', text: '' }); }}
              style={{ background: !isLogin ? '#27ae60' : '#bdc3c7', color: '#fff', minWidth: 96 }}
            >
              立即注册
            </button>
          )}
        </div>

        {msg.text && (
          <div style={{
            padding: '10px 14px', borderRadius: 6, marginBottom: 14, fontSize: 14,
            background: msgStyle[msg.type].background, color: msgStyle[msg.type].color
          }}>
            {msgStyle[msg.type].icon} {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名 <span style={{ color: '#e74c3c' }}>*</span></label>
            <input type="text" className="form-control" placeholder={`请输入${ROLE_NAMES[activeTab]}用户名`}
              value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>密码 <span style={{ color: '#e74c3c' }}>*</span></label>
            <input type="password" className="form-control" placeholder="请输入密码"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {!isLogin && activeTab === 'shipper' && (
            <div style={{ padding: 14, background: '#f8f9fa', borderRadius: 6, marginBottom: 14 }}>
              <h4 style={{ marginBottom: 10, fontSize: 14 }}>企业信息</h4>
              <div className="form-group">
                <label>公司名称 <span style={{ color: '#e74c3c' }}>*</span></label>
                <input type="text" className="form-control" placeholder="请输入公司名称"
                  value={extraFields.companyName || ''} onChange={e => setExtraFields({ ...extraFields, companyName: e.target.value })} />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>联系人 <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input type="text" className="form-control" placeholder="联系人姓名"
                    value={extraFields.contactPerson || ''} onChange={e => setExtraFields({ ...extraFields, contactPerson: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>联系电话 <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input type="text" className="form-control" placeholder="联系电话"
                    value={extraFields.phone || ''} onChange={e => setExtraFields({ ...extraFields, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>公司地址</label>
                <input type="text" className="form-control" placeholder="选填"
                  value={extraFields.address || ''} onChange={e => setExtraFields({ ...extraFields, address: e.target.value })} />
              </div>
            </div>
          )}

          {!isLogin && activeTab === 'driver' && (
            <div style={{ padding: 14, background: '#f8f9fa', borderRadius: 6, marginBottom: 14 }}>
              <h4 style={{ marginBottom: 10, fontSize: 14 }}>司机资质信息</h4>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>真实姓名 <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input type="text" className="form-control" placeholder="真实姓名"
                    value={extraFields.realName || ''} onChange={e => setExtraFields({ ...extraFields, realName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>联系电话 <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input type="text" className="form-control" placeholder="联系电话"
                    value={extraFields.phone || ''} onChange={e => setExtraFields({ ...extraFields, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>身份证号</label>
                  <input type="text" className="form-control" placeholder="选填"
                    value={extraFields.idCard || ''} onChange={e => setExtraFields({ ...extraFields, idCard: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>车牌号</label>
                  <input type="text" className="form-control" placeholder="选填"
                    value={extraFields.licensePlate || ''} onChange={e => setExtraFields({ ...extraFields, licensePlate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>车型 <span style={{ color: '#e74c3c' }}>*</span></label>
                <select className="form-control" value={extraFields.vehicleType || ''}
                  onChange={e => setExtraFields({ ...extraFields, vehicleType: e.target.value })}>
                  <option value="">请选择车型</option>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: 12, fontSize: 16 }} disabled={loading}>
            {loading ? '处理中...' : isLogin ? `登录${ROLE_NAMES[activeTab]}账号` : `注册${ROLE_NAMES[activeTab]}账号`}
          </button>
        </form>

        {activeTab === 'admin' && (
          <div style={{ marginTop: 14, padding: 10, background: '#fff3cd', borderRadius: 6, fontSize: 13, color: '#856404', textAlign: 'center' }}>
            💡 默认管理员账号：用户名 <strong>admin</strong> / 密码 <strong>admin123</strong>
          </div>
        )}

        {activeTab !== 'admin' && (
          <p style={{ marginTop: 14, fontSize: 12, color: '#999', textAlign: 'center' }}>
            {isLogin ? `还没有${ROLE_NAMES[activeTab]}账号？点击上方"立即注册"开通` : `已有账号？点击上方"登录账号"直接登录`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
