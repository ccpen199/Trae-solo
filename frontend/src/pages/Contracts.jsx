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
    pending: { label: '待签署', className: 'badge-warning' },
    active: { label: '履约中', className: 'badge-success' },
    completed: { label: '已完成', className: 'badge-info' },
    cancelled: { label: '已取消', className: 'badge-danger' },
    breached: { label: '已违约', className: 'badge-danger' },
    signed: { label: '已签署', className: 'badge-success' }
  };
  return statusMap[status] || { label: status || '未知', className: '' };
};

const Contracts = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContract, setNewContract] = useState({
    propertyId: '',
    tenantName: '',
    tenantPhone: '',
    rentAmount: '',
    deposit: '',
    startDate: '',
    endDate: '',
    paymentMode: 'monthly'
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/contracts/my');
      setContracts(response.data.data || response.data.contracts || []);
    } catch (error) {
      console.error('获取合同列表失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看合约列表');
      } else {
        setError(error.response?.data?.message || '获取合约列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  const handleSign = (contract) => {
    setSelectedContract(contract);
    setShowSignModal(true);
  };

  const handleConfirmSign = async () => {
    if (!selectedContract) return;
    setSigning(true);
    try {
      const contractId = selectedContract.id || selectedContract.contract_id;
      await api.post(`/contracts/${contractId}/sign`);
      alert('合同签署成功！');
      setShowSignModal(false);
      fetchContracts();
    } catch (error) {
      console.error('签署合同失败:', error);
      alert(error.response?.data?.message || '签署失败，请稍后重试');
    } finally {
      setSigning(false);
    }
  };

  const handleCreateContract = async () => {
    if (!newContract.propertyId || !newContract.tenantName || !newContract.rentAmount || !newContract.startDate || !newContract.endDate) {
      alert('请填写完整信息');
      return;
    }
    setCreating(true);
    try {
      await api.post('/contracts', newContract);
      alert('合约发起成功！');
      setShowCreateModal(false);
      setNewContract({
        propertyId: '',
        tenantName: '',
        tenantPhone: '',
        rentAmount: '',
        deposit: '',
        startDate: '',
        endDate: '',
        paymentMode: 'monthly'
      });
      fetchContracts();
    } catch (error) {
      console.error('发起合约失败:', error);
      alert(error.response?.data?.message || '发起失败，请稍后重试');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (contract) => {
    alert(`正在下载合同 ${contract.id}...`);
  };

  const contractSigningSteps = [
    { icon: '🏠', title: '选房', desc: '选择心仪的房源并达成意向' },
    { icon: '📝', title: '发起合约', desc: '房东发起电子合同，双方确认条款' },
    { icon: '✍️', title: '双方签署', desc: '房东、租客依次完成电子签名' },
    { icon: '💰', title: '资金托管', desc: '租客支付租金至平台托管账户' },
    { icon: '🏁', title: '履约开始', desc: '资金冻结，合同生效，开始履约' }
  ];

  const certFeatures = [
    { icon: '🔗', title: '区块链存证', desc: '合同哈希上链，永久保存，不可篡改' },
    { icon: '🔒', title: '防篡改', desc: '任何修改都会被检测，确保合同完整性' },
    { icon: '⚖️', title: '司法认可', desc: '符合《电子签名法》，具有法律效力' }
  ];

  if (loading) {
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
        <h1 className="text-2xl font-bold">电子合同存证</h1>
        <p className="text-gray">安全可靠的电子合同签署与存证服务</p>
      </div>

      <div className="tabs mb-6">
        <div 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 我的合约
        </div>
        <div 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ 发起新合约
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="font-bold">📋 签约流程</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {contractSigningSteps.map((step, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      margin: '0 auto 1rem',
                      color: 'white'
                    }}>
                      {step.icon}
                    </div>
                    <h4 className="font-bold mb-1">{step.title}</h4>
                    <p className="text-gray text-sm">{step.desc}</p>
                    {i < contractSigningSteps.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '30px',
                        right: '-30px',
                        fontSize: '24px',
                        color: '#d1d5db'
                      }}>
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-3 mb-6">
            {certFeatures.map((item, i) => (
              <div key={i} className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-gray text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

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
              <p className="text-gray">请先登录后查看合约列表</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                去登录
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="card-header flex-between">
                <h3 className="font-bold">我的合约</h3>
                <button className="btn btn-primary" onClick={() => setActiveTab('create')}>
                  ➕ 发起新合约
                </button>
              </div>
              <div className="card-body">
                {contracts.length === 0 ? (
                  <div className="text-center text-gray" style={{ padding: '3rem' }}>
                    暂无合约记录
                    <div className="mt-2">
                      <button className="btn btn-primary" onClick={() => setActiveTab('create')}>
                        发起新合约
                      </button>
                    </div>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>合约编号</th>
                        <th>房源</th>
                        <th>签约双方</th>
                        <th>租金</th>
                        <th>租期</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(contracts.length > 0 ? contracts : [
                        { id: 1, contract_no: 'HT202605001', property_title: '朝阳区国贸CBD精装一居室', landlord_name: '王建国', tenant_name: '张三', rent_amount: 5000, status: 'active', start_date: '2026-05-01', end_date: '2027-04-30', signed_by_landlord: true, signed_by_tenant: true, block_hash: '0x7f3a2c8e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a', sign_time: '2026-05-01 10:00:00' },
                        { id: 2, contract_no: 'HT202604002', property_title: '海淀区中关村两居室', landlord_name: '李房东', tenant_name: '李四', rent_amount: 6500, status: 'pending', start_date: '2026-06-01', end_date: '2027-05-31', signed_by_landlord: true, signed_by_tenant: false },
                        { id: 3, contract_no: 'HT202601005', property_title: '丰台区丽泽商务区两居室', landlord_name: '赵阿姨', tenant_name: '王五', rent_amount: 4200, status: 'completed', start_date: '2026-01-15', end_date: '2026-04-15', signed_by_landlord: true, signed_by_tenant: true }
                      ]).map(contract => {
                        const status = getStatusBadge(contract.status);
                        return (
                          <tr key={contract.id || contract.contract_id}>
                            <td className="font-bold">{contract.contract_no || contract.id || contract.contract_id}</td>
                            <td className="text-sm">{contract.property_title || contract.property}</td>
                            <td>
                              <div className="text-sm">
                                <div>房东: {contract.landlord_name || contract.landlord || '-'}</div>
                                <div className="text-gray">租客: {contract.tenant_name || contract.tenant || '-'}</div>
                              </div>
                            </td>
                            <td style={{ color: '#52c41a', fontWeight: 'bold' }}>
                              {formatMoney(contract.rent_amount || contract.rentAmount || 0)}/月
                            </td>
                            <td className="text-sm">
                              <div>{contract.start_date?.slice(0, 10) || '-'}</div>
                              <div className="text-gray">至 {contract.end_date?.slice(0, 10) || '-'}</div>
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
                                  onClick={() => handleViewDetail(contract)}
                                >
                                  查看详情
                                </button>
                                {contract.status === 'pending' && (
                                  <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                    onClick={() => handleSign(contract)}
                                  >
                                    立即签署
                                  </button>
                                )}
                                {contract.status !== 'pending' && (
                                  <button 
                                    className="btn" 
                                    style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                    onClick={() => handleDownload(contract)}
                                  >
                                    下载合同
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

      {activeTab === 'create' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">📝 发起新合约</h3>
          </div>
          <div className="card-body" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="form-group">
              <label className="form-label">选择房源 *</label>
              <select 
                className="form-input"
                value={newContract.propertyId}
                onChange={e => setNewContract({ ...newContract, propertyId: e.target.value })}
              >
                <option value="">请选择房源</option>
                <option value="1">朝阳区国贸CBD精装一居室</option>
                <option value="2">海淀区中关村两居室</option>
                <option value="3">西城区金融街三居室</option>
              </select>
            </div>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">租客姓名 *</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={newContract.tenantName}
                  onChange={e => setNewContract({ ...newContract, tenantName: e.target.value })}
                  placeholder="请输入租客姓名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">租客电话</label>
                <input 
                  type="tel" 
                  className="form-input"
                  value={newContract.tenantPhone}
                  onChange={e => setNewContract({ ...newContract, tenantPhone: e.target.value })}
                  placeholder="请输入租客电话"
                />
              </div>
            </div>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">月租金 (元) *</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={newContract.rentAmount}
                  onChange={e => setNewContract({ ...newContract, rentAmount: e.target.value })}
                  placeholder="请输入月租金"
                />
              </div>
              <div className="form-group">
                <label className="form-label">押金 (元)</label>
                <input 
                  type="number" 
                  className="form-input"
                  value={newContract.deposit}
                  onChange={e => setNewContract({ ...newContract, deposit: e.target.value })}
                  placeholder="请输入押金金额"
                />
              </div>
            </div>
            <div className="grid grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">起租日期 *</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newContract.startDate}
                  onChange={e => setNewContract({ ...newContract, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">到期日期 *</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newContract.endDate}
                  onChange={e => setNewContract({ ...newContract, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">付款方式</label>
              <select 
                className="form-input"
                value={newContract.paymentMode}
                onChange={e => setNewContract({ ...newContract, paymentMode: e.target.value })}
              >
                <option value="monthly">月付</option>
                <option value="quarterly">季付</option>
                <option value="half_year">半年付</option>
                <option value="yearly">年付</option>
              </select>
            </div>
            <div className="alert alert-info mb-4">
              <strong>温馨提示：</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '13px' }}>
                <li>请确认租客信息准确无误</li>
                <li>合同发起后将自动发送给租客签署</li>
                <li>双方签署完成后合同自动上链存证</li>
              </ul>
            </div>
            <div className="text-center">
              <button 
                className="btn btn-primary btn-lg" 
                onClick={handleCreateContract}
                disabled={creating}
              >
                {creating ? '发起中...' : '✍️ 发起合约'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">合同详情 - {selectedContract.contract_no || selectedContract.id}</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2 mb-4" style={{ gap: '1rem' }}>
                <div>
                  <div className="text-gray text-sm">房源</div>
                  <div className="font-bold">{selectedContract.property_title || selectedContract.property || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">状态</div>
                  <span className={`badge ${getStatusBadge(selectedContract.status).className}`}>
                    {getStatusBadge(selectedContract.status).label}
                  </span>
                </div>
                <div>
                  <div className="text-gray text-sm">房东</div>
                  <div>{selectedContract.landlord_name || selectedContract.landlord || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">租客</div>
                  <div>{selectedContract.tenant_name || selectedContract.tenant || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">月租金</div>
                  <div className="font-bold" style={{ color: '#52c41a' }}>{formatMoney(selectedContract.rent_amount || selectedContract.rentAmount || 0)}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">押金</div>
                  <div>{formatMoney(selectedContract.deposit || 0)}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">租期</div>
                  <div>{selectedContract.start_date?.slice(0, 10) || '-'} 至 {selectedContract.end_date?.slice(0, 10) || '-'}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">付款方式</div>
                  <div>{selectedContract.payment_mode || selectedContract.paymentMode || '月付'}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-gray text-sm mb-2">签署状态</div>
                <div className="flex gap-4">
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: '6px', 
                    background: (selectedContract.signed_by_landlord || selectedContract.signedBy?.includes('landlord')) ? '#d1fae5' : '#f3f4f6',
                    color: (selectedContract.signed_by_landlord || selectedContract.signedBy?.includes('landlord')) ? '#065f46' : '#6b7280'
                  }}>
                    {(selectedContract.signed_by_landlord || selectedContract.signedBy?.includes('landlord')) ? '✅' : '⬜'} 房东已签署
                    {(selectedContract.signed_by_landlord || selectedContract.signedBy?.includes('landlord')) && (
                      <div className="text-xs mt-1" style={{ opacity: 0.8 }}>{formatDate(selectedContract.landlord_sign_time || selectedContract.sign_time)}</div>
                    )}
                  </div>
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: '6px', 
                    background: (selectedContract.signed_by_tenant || selectedContract.signedBy?.includes('tenant')) ? '#d1fae5' : '#f3f4f6',
                    color: (selectedContract.signed_by_tenant || selectedContract.signedBy?.includes('tenant')) ? '#065f46' : '#6b7280'
                  }}>
                    {(selectedContract.signed_by_tenant || selectedContract.signedBy?.includes('tenant')) ? '✅' : '⬜'} 租客已签署
                    {(selectedContract.signed_by_tenant || selectedContract.signedBy?.includes('tenant')) && (
                      <div className="text-xs mt-1" style={{ opacity: 0.8 }}>{formatDate(selectedContract.tenant_sign_time || selectedContract.sign_time)}</div>
                    )}
                  </div>
                </div>
              </div>

              {selectedContract.block_hash && (
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)' }}>
                  <div className="card-body">
                    <div className="flex-between mb-2">
                      <span className="font-bold">🔗 区块链存证信息</span>
                      <span className="badge badge-success">已上链</span>
                    </div>
                    <div className="text-sm mb-1">
                      <span className="text-gray">区块高度：</span>
                      <span style={{ fontFamily: 'monospace' }}>#2847563</span>
                    </div>
                    <div className="text-sm mb-1">
                      <span className="text-gray">存证时间：</span>
                      <span>{formatDate(selectedContract.sign_time || selectedContract.created_at)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray">交易哈希：</span>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '11px' }}>
                        {selectedContract.block_hash}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetailModal(false)}>关闭</button>
              <button className="btn btn-primary" onClick={() => handleDownload(selectedContract)}>
                📄 下载合同
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowSignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">签署合同 - {selectedContract.contract_no || selectedContract.id}</h3>
            </div>
            <div className="modal-body">
              <div className="alert alert-success mb-4">
                <strong>重要提示：</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>请仔细阅读合同条款</li>
                  <li>电子签名与手写签名具有同等法律效力</li>
                  <li>签署后合同将自动上链存证</li>
                </ul>
              </div>
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="font-bold mb-2">合同摘要</h5>
                  <p className="text-sm mb-1">房源：{selectedContract.property_title || selectedContract.property}</p>
                  <p className="text-sm mb-1">租金：{formatMoney(selectedContract.rent_amount || selectedContract.rentAmount || 0)}/月</p>
                  <p className="text-sm">租期：{selectedContract.start_date?.slice(0, 10)} 至 {selectedContract.end_date?.slice(0, 10)}</p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  我已阅读并同意《房屋租赁合同》全部条款
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  我确认身份信息真实有效，同意进行电子签名
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowSignModal(false)} disabled={signing}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmSign} disabled={signing}>
                {signing ? '签署中...' : '✍️ 确认签署'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
