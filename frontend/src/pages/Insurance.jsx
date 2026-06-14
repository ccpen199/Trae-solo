import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-');
};

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getStatusBadge = (status) => {
  const statusMap = {
    pending: { label: '待生效', className: 'badge-warning' },
    active: { label: '保障中', className: 'badge-success' },
    expired: { label: '已过期', className: 'badge-default' },
    cancelled: { label: '已取消', className: 'badge-danger' },
    claimed: { label: '理赔中', className: 'badge-info' }
  };
  return statusMap[status] || { label: status || '未知', className: '' };
};

const insuranceProducts = [
  {
    id: 'tenant_accident',
    name: '租客意外险',
    icon: '🛡️',
    description: '为租客提供全方位意外伤害保障',
    coverage: [
      '意外身故/伤残：最高50万元',
      '意外医疗：最高2万元',
      '住院津贴：100元/天',
      '猝死保障：10万元'
    ],
    plans: [
      { name: '基础版', amount: 200000, premium: 99, period: '1年' },
      { name: '标准版', amount: 300000, premium: 168, period: '1年' },
      { name: '尊享版', amount: 500000, premium: 298, period: '1年' }
    ]
  },
  {
    id: 'landlord_property',
    name: '房东财产险',
    icon: '🏠',
    description: '保障房屋财产安全，房东安心出租',
    coverage: [
      '房屋主体：最高200万元',
      '室内装修：最高30万元',
      '室内财产：最高20万元',
      '水管爆裂：最高5万元'
    ],
    plans: [
      { name: '基础版', amount: 1000000, premium: 299, period: '1年' },
      { name: '标准版', amount: 1500000, premium: 499, period: '1年' },
      { name: '尊享版', amount: 2000000, premium: 799, period: '1年' }
    ]
  },
  {
    id: 'rent_loss',
    name: '租金损失险',
    icon: '💰',
    description: '房屋空置也能获赔，保障稳定收益',
    coverage: [
      '租金损失：最高12个月租金',
      '租客违约：最高3个月租金',
      '房屋损坏维修期间租金',
      '法律诉讼费用补偿'
    ],
    plans: [
      { name: '基础版', amount: 30000, premium: 199, period: '1年' },
      { name: '标准版', amount: 60000, premium: 349, period: '1年' },
      { name: '尊享版', amount: 100000, premium: 549, period: '1年' }
    ]
  }
];

const Insurance = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [showInsureModal, setShowInsureModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [error, setError] = useState(null);
  const [insuring, setInsuring] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimForm, setClaimForm] = useState({
    claimType: '',
    claimAmount: '',
    description: '',
    contactPhone: ''
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/insurance');
      setPolicies(response.data.data || response.data.policies || []);
    } catch (error) {
      console.error('获取保单列表失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看保单');
      } else {
        setError(error.response?.data?.message || '获取保单列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInsure = (product, plan) => {
    setSelectedProduct(product);
    setSelectedPlan(plan);
    setShowInsureModal(true);
  };

  const handleConfirmInsure = async () => {
    if (!selectedProduct || !selectedPlan) return;
    setInsuring(true);
    try {
      await api.post('/insurance', {
        product_id: selectedProduct.id,
        plan_name: selectedPlan.name,
        coverage_amount: selectedPlan.amount,
        premium: selectedPlan.premium
      });
      alert('投保成功！保单已生效');
      setShowInsureModal(false);
      fetchPolicies();
      setActiveTab('policies');
    } catch (error) {
      console.error('投保失败:', error);
      alert(error.response?.data?.message || '投保失败，请稍后重试');
    } finally {
      setInsuring(false);
    }
  };

  const handleViewDetail = (policy) => {
    setSelectedPolicy(policy);
    setShowDetailModal(true);
  };

  const handleClaim = (policy) => {
    setSelectedPolicy(policy);
    setShowClaimModal(true);
  };

  const handleSubmitClaim = async () => {
    if (!claimForm.claimType || !claimForm.claimAmount || !claimForm.description) {
      alert('请填写完整理赔信息');
      return;
    }
    setClaiming(true);
    try {
      const policyId = selectedPolicy.id || selectedPolicy.policy_id;
      await api.post(`/insurance/${policyId}/claim`, claimForm);
      alert('理赔申请已提交，我们会尽快处理！');
      setShowClaimModal(false);
      setClaimForm({ claimType: '', claimAmount: '', description: '', contactPhone: '' });
      fetchPolicies();
    } catch (error) {
      console.error('提交理赔失败:', error);
      alert(error.response?.data?.message || '提交失败，请稍后重试');
    } finally {
      setClaiming(false);
    }
  };

  const mockPolicies = [
    { id: 1, policy_no: 'BX202605001001', product_name: '租客意外险-标准版', coverage_amount: 300000, premium: 168, status: 'active', start_date: '2026-05-01', end_date: '2027-04-30', insured_name: '张三', contract_no: 'HT202605001', block_hash: '0x8f4a3d7e1c9b5f2a8d4e7c1b3a5f9d2e8c4a7b3e5d1f9a8c6e4b2a1d3f5e7c9b' },
    { id: 2, policy_no: 'BX202605001002', product_name: '房东财产险-尊享版', coverage_amount: 2000000, premium: 799, status: 'active', start_date: '2026-05-10', end_date: '2027-05-09', insured_name: '王建国', contract_no: 'HT202605001', block_hash: '0x9g5b4e8f2d0c6g3b9e5f8d2c4b6g0e1f9d3b8c5e7f2a0d9c7b5e3f0a2c6d8e1f' },
    { id: 3, policy_no: 'BX202603002001', product_name: '租金损失险-标准版', coverage_amount: 60000, premium: 349, status: 'claimed', start_date: '2026-03-15', end_date: '2027-03-14', insured_name: '李房东', contract_no: 'HT202604002' }
  ];

  if (loading && activeTab === 'policies') {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">租房保险服务</h1>
        <p className="text-gray">专业保障，安心租房，为您的租赁生活保驾护航</p>
      </div>

      <div className="tabs mb-6">
        <div 
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🛡️ 保险产品
        </div>
        <div 
          className={`tab ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          📋 我的保单
        </div>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="card mb-6">
            <div className="card-body">
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                <h3 className="font-bold mb-2">为什么选择我们的租房保险？</h3>
                <div className="grid grid-4 mt-4" style={{ gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '2rem' }}>⚡</div>
                    <div className="font-bold">快速理赔</div>
                    <div className="text-gray text-sm">24小时响应，3天赔付</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2rem' }}>📋</div>
                    <div className="font-bold">电子保单</div>
                    <div className="text-gray text-sm">区块链存证，永久有效</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2rem' }}>💰</div>
                    <div className="font-bold">性价比高</div>
                    <div className="text-gray text-sm">低至99元/年起</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2rem' }}>🤝</div>
                    <div className="font-bold">全程服务</div>
                    <div className="text-gray text-sm">一对一理赔顾问</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-3" style={{ gap: '1.5rem' }}>
            {insuranceProducts.map(product => (
              <div key={product.id} className="card">
                <div className="card-body">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {product.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{product.name}</h3>
                  <p className="text-gray mb-4">{product.description}</p>
                  
                  <div className="mb-4">
                    <div className="text-sm font-bold mb-2">保障范围：</div>
                    <ul className="text-sm">
                      {product.coverage.map((item, i) => (
                        <li key={i} style={{ padding: '0.25rem 0' }}>✅ {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                    {product.plans.map((plan, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          padding: '0.75rem', 
                          marginBottom: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div className="font-bold">{plan.name}</div>
                          <div className="text-sm text-gray">保额：{formatMoney(plan.amount)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold" style={{ color: '#ff4d4f', fontSize: '1.25rem' }}>
                            {formatMoney(plan.premium)}
                          </div>
                          <div className="text-xs text-gray">{plan.period}</div>
                          <button 
                            className="btn btn-primary mt-2"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                            onClick={() => handleInsure(product, plan)}
                          >
                            立即投保
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'policies' && (
        <>
          {error ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <p className="text-danger">{error}</p>
              {error.includes('登录') && (
                <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                  去登录
                </button>
              )}
            </div>
          ) : !isAuthenticated ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <p className="text-gray">请先登录后查看保单</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                去登录
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3 className="font-bold">我的保单</h3>
              </div>
              <div className="card-body">
                {policies.length === 0 ? (
                  <div className="text-center text-gray" style={{ padding: '3rem' }}>
                    暂无保单记录
                    <div className="mt-2">
                      <button className="btn btn-primary" onClick={() => setActiveTab('products')}>
                        去投保
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>保单号</th>
                        <th>险种</th>
                        <th>被保险人</th>
                        <th>保额</th>
                        <th>保费</th>
                        <th>保障期间</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(policies.length > 0 ? policies : mockPolicies).map(policy => {
                        const status = getStatusBadge(policy.status);
                        return (
                          <tr key={policy.id || policy.policy_id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              {policy.policy_no || policy.id}
                            </td>
                            <td className="font-bold">{policy.product_name}</td>
                            <td>{policy.insured_name || '-'}</td>
                            <td style={{ color: '#1890ff', fontWeight: 'bold' }}>
                              {formatMoney(policy.coverage_amount || policy.amount)}
                            </td>
                            <td>{formatMoney(policy.premium)}</td>
                            <td className="text-sm">
                              <div>{policy.start_date?.slice(0, 10)}</div>
                              <div className="text-gray">至 {policy.end_date?.slice(0, 10)}</div>
                            </td>
                            <td>
                              <span className={`badge ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button 
                                  className="btn" 
                                  style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                  onClick={() => handleViewDetail(policy)}
                                >
                                  查看详情
                                </button>
                                {policy.status === 'active' && (
                                  <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                    onClick={() => handleClaim(policy)}
                                  >
                                    申请理赔
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showInsureModal && selectedProduct && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowInsureModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">确认投保</h3>
            </div>
            <div className="modal-body">
              <div className="card mb-4">
                <div className="card-body">
                  <div className="flex-between mb-2">
                    <span className="text-gray">险种</span>
                    <span className="font-bold">{selectedProduct.name}</span>
                  </div>
                  <div className="flex-between mb-2">
                    <span className="text-gray">方案</span>
                    <span>{selectedPlan.name}</span>
                  </div>
                  <div className="flex-between mb-2">
                    <span className="text-gray">保额</span>
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{formatMoney(selectedPlan.amount)}</span>
                  </div>
                  <div className="flex-between mb-2">
                    <span className="text-gray">保障期限</span>
                    <span>{selectedPlan.period}</span>
                  </div>
                  <div className="flex-between" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span className="text-gray">应付保费</span>
                    <span className="font-bold" style={{ color: '#ff4d4f', fontSize: '1.25rem' }}>
                      {formatMoney(selectedPlan.premium)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">关联合约（可选）</label>
                <select className="form-input">
                  <option value="">选择关联合约</option>
                  <option value="1">HT202605001 - 朝阳区国贸CBD精装一居室</option>
                  <option value="2">HT202604002 - 海淀区中关村两居室</option>
                </select>
              </div>
              <div className="alert alert-info">
                <strong>温馨提示：</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '13px' }}>
                  <li>支付成功后保单立即生效</li>
                  <li>电子保单将自动发送至您的邮箱</li>
                  <li>保单信息将自动上链存证</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowInsureModal(false)} disabled={insuring}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmInsure} disabled={insuring}>
                {insuring ? '处理中...' : `确认支付 ${formatMoney(selectedPlan.premium)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedPolicy && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">保单详情 - {selectedPolicy.policy_no || selectedPolicy.id}</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2 mb-4" style={{ gap: '1rem' }}>
                <div>
                  <div className="text-gray text-sm">险种</div>
                  <div className="font-bold">{selectedPolicy.product_name}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">状态</div>
                  <span className={`badge ${getStatusBadge(selectedPolicy.status).className}`}>
                    {getStatusBadge(selectedPolicy.status).label}
                  </span>
                </div>
                <div>
                  <div className="text-gray text-sm">被保险人</div>
                  <div>{selectedPolicy.insured_name || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">关联合约</div>
                  <div>{selectedPolicy.contract_no || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">保额</div>
                  <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
                    {formatMoney(selectedPolicy.coverage_amount || selectedPolicy.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-gray text-sm">保费</div>
                  <div>{formatMoney(selectedPolicy.premium)}</div>
                </div>
              </div>
              <div className="card mb-4" style={{ background: '#f8f9fa' }}>
                <div className="card-body">
                  <div className="flex-between mb-2">
                    <span className="text-gray">保障期限</span>
                  </div>
                  <div>{selectedPolicy.start_date?.slice(0, 10)} 至 {selectedPolicy.end_date?.slice(0, 10)}</div>
                </div>
              </div>
              {selectedPolicy.block_hash && (
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)' }}>
                  <div className="card-body">
                    <div className="flex-between mb-2">
                      <span className="font-bold">🔗 区块链存证</span>
                      <span className="badge badge-success">已上链</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray">交易哈希：</span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '10px' }}>
                        {selectedPolicy.block_hash}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetailModal(false)}>关闭</button>
              {selectedPolicy.status === 'active' && (
                <button className="btn btn-primary" onClick={() => { setShowDetailModal(false); handleClaim(selectedPolicy); }}>
                  申请理赔
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showClaimModal && selectedPolicy && (
        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">申请理赔 - {selectedPolicy.policy_no || selectedPolicy.id}</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">理赔类型 *</label>
                <select 
                  className="form-input"
                  value={claimForm.claimType}
                  onChange={e => setClaimForm({ ...claimForm, claimType: e.target.value })}
                >
                  <option value="">请选择理赔类型</option>
                  <option value="accident">意外事故</option>
                  <option value="property_loss">财产损失</option>
                  <option value="rent_loss">租金损失</option>
                  <option value="medical">医疗费用</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">申请理赔金额 (元) *</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={claimForm.claimAmount}
                  onChange={e => setClaimForm({ ...claimForm, claimAmount: e.target.value })}
                  placeholder="请输入申请理赔金额"
                />
              </div>
              <div className="form-group">
                <label className="form-label">理赔说明 *</label>
                <textarea 
                  className="form-input"
                  rows={4}
                  value={claimForm.description}
                  onChange={e => setClaimForm({ ...claimForm, description: e.target.value })}
                  placeholder="请详细描述事故情况和损失说明..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input 
                  type="tel" 
                  className="form-input"
                  value={claimForm.contactPhone}
                  onChange={e => setClaimForm({ ...claimForm, contactPhone: e.target.value })}
                  placeholder="请输入联系电话"
                />
              </div>
              <div className="form-group">
                <label className="form-label">上传证据（可选）</label>
                <div style={{ border: '2px dashed #d1d5db', borderRadius: '6px', padding: '2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem' }}>📎</div>
                  <p className="text-gray text-sm">点击或拖拽上传证据图片</p>
                  <p className="text-xs text-gray">支持 JPG、PNG 格式，最多上传 5 张</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowClaimModal(false)} disabled={claiming}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitClaim} disabled={claiming}>
                {claiming ? '提交中...' : '提交理赔申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;
