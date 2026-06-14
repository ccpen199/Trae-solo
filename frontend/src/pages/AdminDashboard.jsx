import { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [pendingProperties, setPendingProperties] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [rentIndex, setRentIndex] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'verifications') {
      fetchPendingVerifications();
    } else if (activeTab === 'disputes') {
      fetchDisputes();
    } else if (activeTab === 'rent-index') {
      fetchRentIndex();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.stats);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/verifications/pending');
      setPendingProperties(response.data.properties);
    } catch (error) {
      console.error('获取待审核房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/disputes');
      setDisputes(response.data.disputes);
    } catch (error) {
      console.error('获取纠纷列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentIndex = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/rent-index');
      setRentIndex(response.data.rentIndex);
    } catch (error) {
      console.error('获取租金指数失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStage = async (propertyId, stage, status) => {
    try {
      await api.put(`/admin/verifications/${propertyId}/stage/${stage}`, { status });
      fetchPendingVerifications();
    } catch (error) {
      console.error('审核失败:', error);
    }
  };

  const handleResolveDispute = async (disputeId, resolution) => {
    try {
      await api.put(`/admin/disputes/${disputeId}/resolve`, { resolution, status: 'resolved' });
      fetchDisputes();
    } catch (error) {
      console.error('处理纠纷失败:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: '数据概览' },
    { id: 'verifications', label: '房源审核' },
    { id: 'disputes', label: '纠纷调解' },
    { id: 'rent-index', label: '租金指数' }
  ];

  return (
    <div className="flex">
      <div className="sidebar">
        <h3 className="font-bold mb-4">管理后台</h3>
        <p className="text-sm text-gray mb-4">
          运营管理后台演示模式，支持房源审核、纠纷调解、租金指数和数据概览复验。
        </p>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="content-area">
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-8">数据概览</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalUsers || 0}</div>
                <div className="stat-label">总用户数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalProperties || 0}</div>
                <div className="stat-label">总房源数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.verifiedProperties || 0}</div>
                <div className="stat-label">已验证房源</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.pendingProperties || 0}</div>
                <div className="stat-label">待审核房源</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.activeContracts || 0}</div>
                <div className="stat-label">有效合约</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.pendingDisputes || 0}</div>
                <div className="stat-label">待处理纠纷</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div>
            <h2 className="text-2xl font-bold mb-8">房源审核</h2>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : pendingProperties.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-gray">暂无待审核房源</p>
              </div>
            ) : (
              <div className="grid grid-3">
                {pendingProperties.map((property) => (
                  <div key={property.id} className="card">
                    <div className="property-image"></div>
                    <div className="card-body">
                      <h3 className="font-bold mb-2">{property.title}</h3>
                      <p className="text-gray text-sm mb-2">{property.address}</p>
                      <p className="text-gray text-sm mb-4">房东: {property.owner_name}</p>
                      <div className="mb-4">
                        <p className="text-sm">验证阶段: {property.verification_stage}/4</p>
                      </div>
                      <div className="verification-step completed">
                        <span>1. 产权信息比对</span>
                        <button
                          className="btn btn-success"
                          style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleVerifyStage(property.id, 1, 'passed')}
                        >
                          通过
                        </button>
                      </div>
                      <div className="verification-step pending">
                        <span>2. 实地打卡验证</span>
                        <button
                          className="btn btn-success"
                          style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleVerifyStage(property.id, 2, 'passed')}
                        >
                          通过
                        </button>
                      </div>
                      <div className="verification-step pending">
                        <span>3. 人脸识别验证</span>
                        <button
                          className="btn btn-success"
                          style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleVerifyStage(property.id, 3, 'passed')}
                        >
                          通过
                        </button>
                      </div>
                      <div className="verification-step pending">
                        <span>4. 邻居交叉验证</span>
                        <button
                          className="btn btn-success"
                          style={{ marginLeft: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleVerifyStage(property.id, 4, 'passed')}
                        >
                          通过
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'disputes' && (
          <div>
            <h2 className="text-2xl font-bold mb-8">纠纷调解</h2>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : disputes.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-gray">暂无纠纷</p>
              </div>
            ) : (
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>纠纷标题</th>
                      <th>相关合约</th>
                      <th>投诉人</th>
                      <th>被投诉人</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute.id}>
                        <td>{dispute.title}</td>
                        <td>{dispute.contract_title}</td>
                        <td>{dispute.complainant_name}</td>
                        <td>{dispute.respondent_name}</td>
                        <td>
                          <span className={`badge ${dispute.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                            {dispute.status === 'pending' ? '待处理' : '已解决'}
                          </span>
                        </td>
                        <td>
                          {dispute.status === 'pending' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                              onClick={() => handleResolveDispute(dispute.id, '双方协商解决')}
                            >
                              标记已解决
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rent-index' && (
          <div>
            <h2 className="text-2xl font-bold mb-8">租金指数</h2>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>城市</th>
                      <th>区域</th>
                      <th>平均租金（元/㎡）</th>
                      <th>平均成交周期（天）</th>
                      <th>成交量</th>
                      <th>统计日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentIndex.map((item) => (
                      <tr key={item.id}>
                        <td>{item.city}</td>
                        <td>{item.district}</td>
                        <td>{item.avg_rent_per_sqm}</td>
                        <td>{item.avg_transaction_days}</td>
                        <td>{item.transaction_count}</td>
                        <td>{item.record_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
