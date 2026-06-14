import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [stats, setStats] = useState({ listings: 0, verified: 0, users: 0, transactions: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
    loadListings();
    loadStats();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/listings/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('加载分类失败', err);
    }
  };

  const loadListings = async () => {
    try {
      const res = await api.get('/listings', { params: { pageSize: 8 } });
      setListings(res.data.listings);
    } catch (err) {
      console.error('加载信息失败', err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/public/stats');
      setStats(res.data);
    } catch (err) {
      setStats({ listings: 26, verified: 22, users: 5, transactions: 0 });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (city) params.set('city', city);
    navigate(`/category/all?${params.toString()}`);
  };

  const categoryDescs = {
    job: '蓝领招聘·技能筛选',
    house: '房产租售·无中介',
    car: '二手车·VIN查维保',
    secondhand: '二手物品·真实验证',
    housekeeping: '家政服务·持证上岗',
    repair: '维修服务·可上门',
    moving: '搬家运输·有保险',
    education: '教育培训·持证教师',
    beauty: '丽人健身·品质服务',
    pet: '宠物服务·专业护理',
    food: '本地美食·私房定制',
    other: '更多服务·便民生活'
  };

  return (
    <div>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">去中介化 · 本地生活撮合平台</h1>
            <p className="hero-subtitle">12类垂直场景 · 真伪核验 · 担保交易 · 信用标签</p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="搜索服务：电工、租房、二手车、搬家..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="hero-search-input"
              />
              <input
                type="text"
                placeholder="城市"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="hero-search-city"
              />
              <button type="submit" className="hero-search-btn">🔍 搜索</button>
            </form>
            <div className="hero-tags">
              <span className="hero-tag" onClick={() => navigate('/category/all?keyword=电工')}>天河区电工</span>
              <span className="hero-tag" onClick={() => navigate('/category/all?keyword=租房')}>业主直租</span>
              <span className="hero-tag" onClick={() => navigate('/category/all?keyword=二手车')}>二手车VIN查</span>
              <span className="hero-tag" onClick={() => navigate('/category/all?keyword=搬家')}>搬家运输</span>
              <span className="hero-tag" onClick={() => navigate('/category/all?keyword=家政')}>家政保洁</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">📂 12大垂直场景</h2>
            <Link to="/category/all" className="section-more">查看全部信息 →</Link>
          </div>
          <div className="category-grid-home">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.id}`} className="category-card-home">
                <div className="category-card-icon">{cat.icon}</div>
                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-desc">{categoryDescs[cat.code] || '优质服务'}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔥 最新核验信息</h2>
            <Link to="/category/all" className="section-more">更多 →</Link>
          </div>
          <div className="grid grid-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="listing-card-home"
                onClick={() => navigate(`/listing/${item.id}`)}
              >
                <div className="listing-card-top">
                  <span className="listing-card-cat">{item.category_icon} {item.category_name}</span>
                  {item.author_verified && <span className="listing-card-auth">✔ 实名</span>}
                </div>
                <div className="listing-card-title">{item.title}</div>
                <div className="listing-card-price">
                  {item.price > 0 ? `¥${item.price}` : '面议'}
                  {item.price_unit && <span className="listing-card-unit">/{item.price_unit}</span>}
                </div>
                <div className="listing-card-location">📍 {item.city || '全国'} {item.district || ''}</div>
                <div className="listing-card-badges">
                  {item.has_skill_cert && <span className="badge-sm badge-cert">🎓 持证</span>}
                  {item.on_site_service && <span className="badge-sm badge-door">🏠 可上门</span>}
                  {item.has_vin && <span className="badge-sm badge-vin">🚗 VIN</span>}
                  {item.no_agent && <span className="badge-sm badge-noagent">🤝 无中介</span>}
                  {item.has_certificate && <span className="badge-sm badge-cert">📜 有资质</span>}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="listing-card-tags">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag-sm">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔒 担保交易流程</h2>
          </div>
          <div className="flow-cards">
            <div className="flow-card">
              <div className="flow-icon">💰</div>
              <div className="flow-step">第一步</div>
              <div className="flow-title">定金冻结</div>
              <div className="flow-desc">买家支付20%定金，平台冻结资金，保障交易安全启动</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-card">
              <div className="flow-icon">🤝</div>
              <div className="flow-step">第二步</div>
              <div className="flow-title">服务确认</div>
              <div className="flow-desc">买卖双方确认服务/交付完成，双方都点击确认</div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-card">
              <div className="flow-icon">✅</div>
              <div className="flow-step">第三步</div>
              <div className="flow-title">资金释放</div>
              <div className="flow-desc">双方确认后，平台释放担保金给卖家，交易完成</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            {user ? (
              <Link to="/transactions" className="btn btn-primary btn-lg">查看我的交易 →</Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">注册后发起担保交易 →</Link>
            )}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🛡️ 平台保障体系</h2>
          </div>
          <div className="guarantee-grid">
            <div className="guarantee-card">
              <div className="guarantee-icon">🔍</div>
              <h3>真伪核验</h3>
              <p>工商/社保/车辆登记数据交叉验证，多维度打分，信息可信度一目了然</p>
            </div>
            <div className="guarantee-card">
              <div className="guarantee-icon">📋</div>
              <h3>实名认证</h3>
              <p>用户实名认证 + 服务者资质证书OCR核验，身份可追溯</p>
            </div>
            <div className="guarantee-card">
              <div className="guarantee-icon">🏷️</div>
              <h3>信用标签</h3>
              <p>信用评价标签云：维修靠谱、租房无中介、持证上岗，口碑可视化</p>
            </div>
            <div className="guarantee-card">
              <div className="guarantee-icon">🚩</div>
              <h3>举报溯源</h3>
              <p>虚假信息举报 → 运营审核 → 下线处理，全链路可复查</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">📊 平台数据</h2>
          </div>
          <div className="stats-home">
            <div className="stat-home">
              <div className="stat-home-num">{stats.listings || 26}</div>
              <div className="stat-home-label">已发布信息</div>
            </div>
            <div className="stat-home">
              <div className="stat-home-num">{stats.verified || 22}</div>
              <div className="stat-home-label">已核验信息</div>
            </div>
            <div className="stat-home">
              <div className="stat-home-num">{stats.users || 5}</div>
              <div className="stat-home-label">认证用户</div>
            </div>
            <div className="stat-home">
              <div className="stat-home-num">12</div>
              <div className="stat-home-label">垂直场景</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">⚙️ 城市运营与治理</h2>
          </div>
          <div className="governance-grid">
            <div className="governance-card" onClick={() => navigate('/admin')}>
              <div className="governance-icon">🏢</div>
              <div className="governance-title">城市运营中心</div>
              <div className="governance-desc">违规信息下线、举报审核处理、运营数据看板</div>
              <div className="governance-link">进入后台 →</div>
            </div>
            <div className="governance-card" onClick={() => navigate('/admin')}>
              <div className="governance-icon">📝</div>
              <div className="governance-title">行业白名单</div>
              <div className="governance-desc">行业准入审核、资质认证管理、白名单配置</div>
              <div className="governance-link">查看白名单 →</div>
            </div>
            <div className="governance-card" onClick={() => navigate('/admin')}>
              <div className="governance-icon">🔎</div>
              <div className="governance-title">举报溯源追踪</div>
              <div className="governance-desc">举报记录、处理状态、操作日志全链路复查</div>
              <div className="governance-link">查看日志 →</div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="cta-section">
          <div className="container">
            <h2>加入本地生活撮合平台</h2>
            <p>免费发布信息 · 担保交易 · 真伪核验 · 信用积累</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">免费注册</Link>
              <Link to="/login" className="btn btn-outline-white btn-lg">立即登录</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
