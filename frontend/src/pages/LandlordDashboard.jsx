import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const LandlordDashboard = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [propsRes, contractsRes] = await Promise.all([
        api.get('/properties/my/properties'),
        api.get('/contracts/my')
      ]);
      setProperties(propsRes.data.properties || []);
      setContracts(contractsRes.data.contracts || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: 'overview', label: '工作台概览', icon: '📊' },
    { key: 'properties', label: '我的房源', icon: '🏠' },
    { key: 'publish', label: '发布房源', icon: '➕' },
    { key: 'verification', label: '房源验证', icon: '✅' },
    { key: 'contracts', label: '合约管理', icon: '📝' },
    { key: 'income', label: '收入统计', icon: '💰' },
    { key: 'disputes', label: '纠纷处理', icon: '⚖️' },
    { key: 'services', label: '服务管理', icon: '🛒' },
    { key: 'credit', label: '信用分', icon: '⭐' }
  ];

  const stats = [
    { label: '发布房源', value: properties.length, icon: '🏠', color: '#1890ff' },
    { label: '已验证', value: properties.filter(p => p.is_verified).length, icon: '✅', color: '#52c41a' },
    { label: '在租合约', value: contracts.filter(c => c.status === 'active').length, icon: '📝', color: '#722ed1' },
    { label: '信用分', value: user?.credit_score || 0, icon: '⭐', color: '#faad14' }
  ];

  const getVerificationProgress = (property) => {
    const stage = property.verification_stage || 0;
    return Math.round((stage / 4) * 100);
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {location.state?.message && (
        <div style={{
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#52c41a'
        }}>
          🎉 {location.state.message}
        </div>
      )}

      <div className="flex-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">房东工作台</h1>
          <p className="text-gray">欢迎回来，{user?.real_name || user?.username}，高效管理您的房产</p>
        </div>
        <div className="flex gap-3">
          <Link to="/publish" className="btn btn-primary">
            ➕ 发布房源
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
                  onClick={() => {
                    setActiveTab(item.key);
                    if (item.key === 'publish') {
                      window.location.href = '/publish';
                    }
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    border: 'none',
                    background: activeTab === item.key ? '#f6ffed' : 'transparent',
                    color: activeTab === item.key ? '#52c41a' : '#333',
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
                    <h3 className="font-bold">我的房源</h3>
                    <button 
                      onClick={() => setActiveTab('properties')}
                      className="text-sm" 
                      style={{ color: '#52c41a', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      查看更多 →
                    </button>
                  </div>
                  <div className="card-body">
                    {properties.length === 0 ? (
                      <div className="text-center text-gray" style={{ padding: '2rem' }}>
                        暂无发布房源
                        <div>
                          <Link to="/publish" style={{ color: '#52c41a' }}>立即发布 →</Link>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {properties.slice(0, 3).map(p => (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              gap: '1rem',
                              padding: '0.75rem',
                              border: '1px solid #eee',
                              borderRadius: '6px'
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
                              <div className="flex-between">
                                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{p.price}/月</span>
                                <span className={`tag ${p.is_verified ? 'tag-success' : ''}`} style={{ fontSize: '11px' }}>
                                  {p.is_verified ? '已验证' : '验证中'}
                                </span>
                              </div>
                              <div style={{ marginTop: '4px' }}>
                                <div style={{
                                  height: '4px',
                                  background: '#f0f0f0',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${getVerificationProgress(p)}%`,
                                    height: '100%',
                                    background: '#52c41a'
                                  }} />
                                </div>
                                <div className="text-gray text-xs mt-1">
                                  验证进度: {getVerificationProgress(p)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header flex-between">
                    <h3 className="font-bold">快捷操作</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-2" style={{ gap: '1rem' }}>
                      {[
                        { icon: '🏠', label: '发布整租', path: '/publish?mode=whole', color: '#1890ff' },
                        { icon: '👥', label: '发布合租', path: '/publish?mode=share', color: '#722ed1' },
                        { icon: '🔄', label: '发布转租', path: '/publish?mode=sublet', color: '#13c2c2' },
                        { icon: '✅', label: '房源验证', action: 'verification', color: '#52c41a' },
                        { icon: '📋', label: '验房服务', path: '/services', color: '#eb2f96' },
                        { icon: '⚖️', label: '法务服务', path: '/services', color: '#fa8c16' }
                      ].map((item, i) => (
                        item.path ? (
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
                        ) : (
                          <button
                            key={i}
                            onClick={() => setActiveTab(item.action)}
                            style={{
                              padding: '1rem',
                              textAlign: 'center',
                              border: '1px solid #eee',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                            <div className="text-sm">{item.label}</div>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="card">
              <div className="card-header flex-between">
                <h3 className="font-bold">我的房源</h3>
                <Link to="/publish" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '14px' }}>
                  ➕ 发布新房源
                </Link>
              </div>
              <div className="card-body">
                {properties.length === 0 ? (
                  <div className="text-center text-gray" style={{ padding: '3rem' }}>
                    暂无发布房源
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {properties.map(p => (
                      <div key={p.id} className="card" style={{ margin: 0 }}>
                        <div className="card-body">
                          <div className="flex-between">
                            <h4 className="font-bold">{p.title}</h4>
                            <div className="flex gap-2">
                              <span className={`tag ${p.is_verified ? 'tag-success' : ''}`}>
                                {p.is_verified ? '已验证' : '验证中'}
                              </span>
                              <span className="tag">
                                {p.rent_mode === 'whole' ? '整租' : p.rent_mode === 'share' ? '合租' : '转租'}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray text-sm mt-2">📍 {p.address}</p>
                          <div className="flex-between mt-2">
                            <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '18px' }}>
                              ¥{p.price}/月
                            </span>
                            <div className="flex gap-2">
                              <Link to={`/property/${p.id}`} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
                                查看
                              </Link>
                              <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}>
                                管理
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-bold">房源四重验证</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    { icon: '📋', title: '产权信息比对', desc: '上传房产证照片，系统自动核验产权归属', status: 'pending' },
                    { icon: '📍', title: '实地打卡验证', desc: '前往房源所在地进行GPS定位打卡', status: 'pending' },
                    { icon: '👤', title: '人脸识别核验', desc: '房东人脸与身份证比对，确保身份真实', status: 'pending' },
                    { icon: '👥', title: '邻居交叉验证', desc: '邀请邻居或物业确认房源真实性', status: 'pending' }
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0
                      }}>
                        {step.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 className="font-bold">{step.title}</h4>
                        <p className="text-gray text-sm">{step.desc}</p>
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '14px' }}>
                          开始验证
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-bold">合约管理</h3>
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
                          <div className="grid grid-2 mt-2" style={{ gap: '0.5rem', fontSize: '14px' }}>
                            <div>租金: ¥{c.rent_amount}/月</div>
                            <div>押金: ¥{c.deposit}</div>
                            <div>租期: {c.start_date} 至 {c.end_date}</div>
                            <div>支付方式: {c.payment_mode}</div>
                          </div>
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
                  {user?.credit_score || 680}
                </div>
                <p className="text-gray mt-2">信用分等级: 良好</p>
                <p className="text-gray text-sm mt-1">高信用分可获得更多房源曝光和优先推荐</p>
              </div>
            </div>
          )}

          {!['overview', 'properties', 'verification', 'contracts', 'credit'].includes(activeTab) && (
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

export default LandlordDashboard;
