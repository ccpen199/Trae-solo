import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:44858/api';

function App() {
  const [currentPage, setCurrentPage] = useState('discover');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [clubs, setClubs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('clubs');
  const [selectedClub, setSelectedClub] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    axios.get(`${API_BASE}/clubs`).then(res => setClubs(res.data.clubs));
    axios.get(`${API_BASE}/activities`).then(res => setActivities(res.data.activities));
    axios.get(`${API_BASE}/competitions`).then(res => setCompetitions(res.data.competitions));
  };

  const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrorMsg('');
      
      if (!form.username.trim()) {
        setErrorMsg('请输入用户名');
        return;
      }
      if (!form.password.trim()) {
        setErrorMsg('请输入密码');
        return;
      }
      if (form.password.length < 6) {
        setErrorMsg('密码长度不能少于6位');
        return;
      }

      try {
        const res = await axios.post(`${API_BASE}/auth/${isLogin ? 'login' : 'register'}`, form);
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        setCurrentPage(res.data.user.profile_completed ? 'discover' : 'profile');
      } catch (err) {
        console.error('请求错误:', err);
        if (err.response) {
          setErrorMsg(err.response.data.error || '操作失败，请重试');
        } else if (err.request) {
          setErrorMsg('网络连接失败，请检查后端服务是否启动');
        } else {
          setErrorMsg('请求配置错误，请联系管理员');
        }
      }
    };

    return (
      <div className="container" style={{ maxWidth: 400, paddingTop: 60 }}>
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="logo">🎓</span>
            {isLogin ? '欢迎回来' : '加入玩转社团'}
          </h2>
          <form onSubmit={handleSubmit}>
            <label className="label">用户名</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="请输入用户名" />
            <label className="label">密码</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="请输入密码" />
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {isLogin ? '登录' : '注册'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', cursor: 'pointer', color: '#667eea' }} onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? '没有账号？立即注册' : '已有账号？去登录'}
          </p>
        </div>
      </div>
    );
  };

  const ProfilePage = () => {
    const [form, setForm] = useState({ real_name: '', school: '', department: '', grade: '', phone: '' });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await axios.put(`${API_BASE}/auth/profile`, form);
        setCurrentPage('discover');
        alert('资料完善成功！');
      } catch (err) {
        alert('保存失败');
      }
    };

    return (
      <div className="container" style={{ maxWidth: 500 }}>
        <div className="card">
          <h2 style={{ marginBottom: '2rem' }}>完善个人资料</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>完善资料后即可发现更多精彩内容！</p>
          <form onSubmit={handleSubmit}>
            <label className="label">真实姓名</label>
            <input value={form.real_name} onChange={e => setForm({...form, real_name: e.target.value})} />
            <label className="label">学校</label>
            <input value={form.school} onChange={e => setForm({...form, school: e.target.value})} />
            <label className="label">院系</label>
            <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
            <label className="label">年级</label>
            <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
              <option value="">请选择年级</option>
              <option value="大一">大一</option>
              <option value="大二">大二</option>
              <option value="大三">大三</option>
              <option value="大四">大四</option>
            </select>
            <label className="label">手机号</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>保存资料</button>
          </form>
        </div>
      </div>
    );
  };

  const ClubDetailPage = () => {
    const [followed, setFollowed] = useState({});
    
    const handleFollowClub = () => {
      setFollowed(prev => ({...prev, [selectedClub.id]: true}));
      alert(`成功关注 ${selectedClub.name}！`);
    };
    
    if (!selectedClub) {
      setCurrentPage('discover');
      return null;
    }
    return (
      <div className="container" style={{ maxWidth: 700 }}>
        <button 
          onClick={() => { setSelectedClub(null); setCurrentPage('discover'); }} 
          className="btn" 
          style={{ marginBottom: '1rem', background: 'transparent', color: '#667eea', border: '1px solid #667eea' }}
        >
          ← 返回列表
        </button>
        <div className="card">
          <div style={{ fontSize: '5rem', textAlign: 'center', marginBottom: '1rem' }}>{selectedClub.logo}</div>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{selectedClub.name}</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>{selectedClub.description}</p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <span style={{ background: '#f0f0f0', padding: '0.5rem 1rem', borderRadius: 20 }}>
              {selectedClub.category}
            </span>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>📋 社团简介</h3>
          <p style={{ color: '#555', lineHeight: 1.8, marginBottom: '2rem' }}>
            {selectedClub.name}是一个充满活力的学生社团组织，致力于为同学们提供一个交流学习、展示才华的平台。
            在这里，你可以结识志同道合的朋友，参与丰富多彩的活动，提升个人能力，丰富校园生活。
          </p>

          <h3 style={{ marginBottom: '1rem' }}>🎯 加入我们</h3>
          <ul style={{ color: '#555', lineHeight: 2, marginBottom: '2rem', paddingLeft: '1.5rem' }}>
            <li>每周定期举办技术交流活动</li>
            <li>丰富的社团内外部比赛</li>
            <li>专业的指导老师指导</li>
            <li>广阔的人脉资源</li>
          </ul>

          <button className="btn btn-primary" style={{ width: '100%', background: followed[selectedClub.id] ? '#10b981' : undefined }} onClick={handleFollowClub}>
            {followed[selectedClub.id] ? '✅ 已关注' : '➕ 关注社团'}
          </button>
        </div>
      </div>
    );
  };

  const DiscoverPage = () => {
    return (
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>发现精彩</h1>
        <div className="tabs">
          <div className={`tab ${activeTab === 'clubs' ? 'active' : ''}`} onClick={() => setActiveTab('clubs')}>社团</div>
          <div className={`tab ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>活动讲座</div>
          <div className={`tab ${activeTab === 'competitions' ? 'active' : ''}`} onClick={() => setActiveTab('competitions')}>竞赛</div>
        </div>

        {activeTab === 'clubs' && (
          <div className="grid">
            {clubs.map(club => (
              <div key={club.id} className="card" onClick={() => { setSelectedClub(club); setCurrentPage('clubDetail'); }} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{club.logo}</div>
                <h3>{club.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{club.description}</p>
                <span style={{ background: '#f0f0f0', padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.8rem' }}>{club.category}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="grid">
            {activities.map(act => (
              <div key={act.id} className="card">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{act.cover}</div>
                <h3>{act.title}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{act.description}</p>
                <p style={{ color: '#667eea', fontSize: '0.85rem', marginTop: '0.5rem' }}>📍 {act.location} | 🏛️ {act.organizer}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="grid">
            {competitions.map(comp => (
            <div key={comp.id} className="card">
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{comp.cover}</div>
              <h3>{comp.title}</h3>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{comp.description}</p>
              <span style={{ 
                background: comp.level === 'national' ? '#fef3c7' : comp.level === 'provincial' ? '#dbeafe' : '#dcfce7',
                padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.8rem',
                color: comp.level === 'national' ? '#92400e' : comp.level === 'provincial' ? '#1e40af' : '#166534'
              }}>
                {comp.level === 'national' ? '国家级' : comp.level === 'provincial' ? '省级' : '校级'}
              </span>
              <p style={{ color: '#667eea', fontSize: '0.85rem', marginTop: '0.5rem' }}>🏛️ {comp.organizer}</p>
            </div>
          ))}
          </div>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setCurrentPage('login');
  };

  return (
    <div className="app">
      <nav className="nav">
        <h2 style={{ display: 'flex', alignItems: 'center' }}><span className="logo">🎓</span> 玩转社团</h2>
        {token && (
          <div className="nav-links">
            <a href="#" onClick={e => { e.preventDefault(); setSelectedClub(null); setCurrentPage('discover'); }}>发现</a>
            <a href="#" onClick={e => { e.preventDefault(); setCurrentPage('profile'); }}>资料</a>
            <a href="#" onClick={e => { e.preventDefault(); handleLogout(); }}>退出</a>
          </div>
        )}
      </nav>

      {!token ? <LoginPage /> :
       currentPage === 'profile' ? <ProfilePage /> :
       currentPage === 'clubDetail' ? <ClubDetailPage /> :
       <DiscoverPage />}
    </div>
  );
}

export default App;
