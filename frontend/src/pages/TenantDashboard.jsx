import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const TenantDashboard = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [favorites, setFavorites] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [favoritesRes, contractsRes] = await Promise.all([
        api.get('/properties/my/favorites?limit=5'),
        api.get('/contracts/my')
      ]);
      setFavorites(favoritesRes.data.properties || []);
      setContracts(contractsRes.data.contracts || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: 'overview', label: '工作台概览', icon: '📊' },
    { key: 'favorites', label: '我的收藏', icon: '❤️' },
    { key: 'viewings', label: '看房预约', icon: '📅' },
    { key: 'contracts', label: '我的合约', icon: '📝' },
    { key: 'payments', label: '支付记录', icon: '💰' },
    { key: 'disputes', label: '纠纷调解', icon: '⚖️' },
    { key: 'credit', label: '信用分', icon: '⭐' },
    { key: 'services', label: '服务选购', icon: '🛒' },
    { key: 'insurance', label: '履约保险', icon: '🛡️' }
  ];

  const stats = [
    { label: '收藏房源', value: favorites.length, icon: '❤️', color: '#ff4d4f' },
    { label: '在租合约', value: contracts.filter(c => c.status === 'active').length, icon: '🏠', color: '#1890ff' },
    { label: '待支付', value: payments.filter(p => p.status === 'pending').length, icon: '⏰', color: '#faad14' },
    { label: '信用分', value: user?.credit_score || 0, icon: '⭐', color: '#52c41a' }
  ];

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {location.state?.message && (
        <div style={{
          background: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#1890ff'
        }}>
          🎉 {location.state.message}
        </div>
      )}

      <div className="flex-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">租客工作台</h1>
          <p className="text-gray">欢迎回来，{user?.real_name || user?.username}，祝您找到心仪的家</p>
        </div>
        <div className="flex gap-3">
          <Link to="/properties" className="btn btn-primary">
            🔍 找房源
          </Link>
          <Link to="/services" className="btn">
            🛒 选购服务
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '1rem' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {menuItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    border: 'none',
                    background: activeTab === item.key ? '#e6f7ff' : 'transparent',
                    color: activeTab === item.key ? '#1890ff' : '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div>
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-4 mb-6">
                {stats.map((stat, i) => (
                  <div key={i} className="card">
                    <div className="card-body text-center">
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: stat.color }}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className="text-gray text-sm">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-2 gap-6">
                <div className="card">
                  <div className="card-header flex-between">
                    <h3 className="font-bold">我的收藏</h3>
                    <Link to="/properties" className="text-sm" style={{ color: '#1890ff' }}>
                      查看更多 →
                    </Link>
                  </div>
                  <div className="card-body">
                    {favorites.length === 0 ? (
                      <div className="text-center text-gray" style={{ padding: '2rem' }}>
                        暂无收藏房源
                        <div>
                          <Link to="/properties" style={{ color: '#1890ff' }}>去逛逛 →</Link>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {favorites.slice(0, 3).map(p => (
                          <Link
                            key={p.id}
                            to={`/property/${p.id}`}
                            style={{
                              display: 'flex',
                              gap: '1rem',
                              padding: '0.75rem',
                              border: '1px solid #eee',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                          >
                            <div style={{
                              width: '80px',
                              height: '60px',
                              background: '#f0f0f0',
                              borderRadius: '4px'
                            }} />
                            <div style={{ flex: 1 }}>
                              <div className="font-bold text-sm">{p.title}</div>
                              <div className="text-red" style={{ fontWeight: 'bold' }}>¥{p.price}/月</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header flex-between">
                    <h3 className="font-bold">快捷入口</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                      {[
                        { icon: '🤖', label: 'AI智能找房', path: '/properties', color: '#722ed1' },
                        { icon: '📋', label: '资金托管', path: '/escrow', color: '#13c2c2' },
                        { icon: '📝', label: '电子合同', path: '/contracts', color: '#1890ff' },
                        { icon: '🛡️', label: '履约保险', path: '/insurance', color: '#52c41a' }
                      ].map((item, i) => (
                        <Link
                          key={i}
                          to={item.path}
                          style={{
                            padding: '1rem',
                            textAlign: 'center',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.3s'
                          }}
                        >
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                          <div className="text-sm">{item.label}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-bold">我的收藏</h3>
              </div>
              <div className="card-body">
                {favorites.length === 0 ? (
                  <div className="text-center text-gray" style={{ padding: '3rem' }}>
                    暂无收藏房源
                  </div>
                ) : (
                  <div className="grid grid-2">
                    {favorites.map(p => (
                      <Link
                        key={p.id}
                        to={`/property/${p.id}`}
                        className="card property-card"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div className="property-image"></div>
                        <div className="card-body">
                          <h4 className="font-bold">{p.title}</h4>
                          <p className="text-gray text-sm">{p.address}</p>
                          <div className="flex-between mt-2">
                            <span className="property-price">¥{p.price}/月</span>
                            <span className="text-gray text-sm">{p.rooms}室 {p.area}㎡</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-bold">我的合约</h3>
              </div>
              <div className="card-body">
                {contracts.length === 0 ? (
                  <div className="text-center text-gray" style={{ padding: '3rem' }}>
                    暂无签约合约
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {contracts.map(c => (
                      <div key={c.id} className="card" style={{ margin: 0 }}>
                        <div className="card-body">
                          <div className="flex-between">
                            <h4 className="font-bold">合约 #{c.id}</h4>
                            <span className={`tag ${c.status === 'active' ? 'tag-success' : ''}`}>
                              {c.status === 'active' ? '履约中' : c.status}
                            </span>
                          </div>
                          <p className="text-gray mt-2">租金: ¥{c.rent_amount}/月</p>
                          <p className="text-gray text-sm">租期: {c.start_date} 至 {c.end_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'credit' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-bold">信用分中心</h3>
              </div>
              <div className="card-body text-center" style={{ padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⭐</div>
                <div className="text-4xl font-bold" style={{ color: '#52c41a' }}>
                  {user?.credit_score || 650}
                </div>
                <p className="text-gray mt-2">信用分等级: 良好</p>
                <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                  <h4 className="font-bold mb-3">信用分构成</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: '身份认证', score: 150, max: 150 },
                      { label: '履约记录', score: 200, max: 250 },
                      { label: '行为信用', score: 180, max: 300 },
                      { label: '守约历史', score: 120, max: 300 }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex-between mb-1">
                          <span>{item.label}</span>
                          <span className="text-gray">{item.score}/{item.max}</span>
                        </div>
                        <div style={{
                          height: '8px',
                          background: '#f0f0f0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(item.score / item.max) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #52c41a, #73d13d)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!['overview', 'favorites', 'contracts', 'credit'].includes(activeTab) && (
            <div className="card text-center" style={{ padding: '4rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
              <p className="text-gray">该功能正在开发中，敬请期待...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
