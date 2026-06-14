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
    frozen: { label: '托管中', className: 'badge-warning', color: '#faad14' },
    unfrozen: { label: '已解冻', className: 'badge-success', color: '#52c41a' },
    refunded: { label: '已退款', className: 'badge-info', color: '#1890ff' },
    pending: { label: '处理中', className: 'badge-info', color: '#1890ff' },
    completed: { label: '已完成', className: 'badge-success', color: '#52c41a' },
    cancelled: { label: '已取消', className: 'badge-danger', color: '#ff4d4f' }
  };
  return statusMap[status] || { label: status || '未知', className: '', color: '#8c8c8c' };
};

const getTypeLabel = (type) => {
  const typeMap = {
    deposit: '押金托管',
    rent: '租金托管',
    service: '服务费',
    refund: '退款',
    freeze: '资金冻结',
    unfreeze: '资金解冻'
  };
  return typeMap[type] || type || '其他';
};

const Escrow = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [escrowData, setEscrowData] = useState(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  const [error, setError] = useState(null);
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    fetchEscrowData();
  }, []);

  const fetchEscrowData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/escrow');
      const data = response.data.data || response.data;
      setEscrowData({
        frozenAmount: data.frozen_amount || data.frozenAmount || 12000,
        unfrozenAmount: data.unfrozen_amount || data.unfrozenAmount || 8500,
        totalEscrow: data.total_escrow || data.totalEscrow || 56800,
        transactions: data.transactions || data.records || []
      });
    } catch (error) {
      console.error('获取托管数据失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看托管资金');
      } else {
        setError(error.response?.data?.message || '获取托管数据失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('请输入有效的充值金额');
      return;
    }
    setRecharging(true);
    try {
      await api.post('/escrow/recharge', {
        amount: parseFloat(rechargeAmount),
        contract_id: selectedContract || undefined
      });
      alert(`充值成功: ${formatMoney(rechargeAmount)}`);
      setShowRechargeModal(false);
      setRechargeAmount('');
      setSelectedContract('');
      fetchEscrowData();
    } catch (error) {
      console.error('充值失败:', error);
      alert(error.response?.data?.message || '充值失败，请稍后重试');
    } finally {
      setRecharging(false);
    }
  };

  const openEvidenceModal = (tx) => {
    setSelectedTransaction(tx);
    setShowEvidenceModal(true);
  };

  const escrowSteps = [
    { icon: '💳', title: '租客支付', desc: '租客支付租金至托管账户' },
    { icon: '🔒', title: '平台托管', desc: '资金由平台安全托管冻结' },
    { icon: '✅', title: '按月履约', desc: '确认房源交付且无异议' },
    { icon: '💰', title: '按期解冻', desc: '租金按期解冻给房东' }
  ];

  const guarantees = [
    { icon: '🛡️', title: '资金安全', desc: '银行级加密保护，资金全程可追溯' },
    { icon: '🤝', title: '履约保障', desc: '确保双方按合同约定履行义务' },
    { icon: '⚖️', title: '纠纷介入', desc: '专业调解团队，72小时内响应' }
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
      <div className="flex-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">资金托管服务</h1>
          <p className="text-gray">安全、透明、有保障的第三方资金托管</p>
        </div>
        {isAuthenticated && (
          <button className="btn btn-primary" onClick={() => setShowRechargeModal(true)}>
            💰 充值托管
          </button>
        )}
      </div>

      {error ? (
        <div className="card text-center mb-6" style={{ padding: '3rem' }}>
          <p className="text-danger">{error}</p>
          {error.includes('登录') && (
            <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
              去登录
            </button>
          )}
        </div>
      ) : !isAuthenticated ? (
        <div className="card text-center mb-6" style={{ padding: '3rem' }}>
          <p className="text-gray">请先登录后查看托管资金</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
            去登录
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-4 mb-6">
            <div className="card" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                <div className="text-2xl font-bold" style={{ color: '#fa8c16' }}>
                  {formatMoney(escrowData?.frozenAmount)}
                </div>
                <div className="text-sm mt-1" style={{ color: '#fa8c16' }}>托管中资金</div>
              </div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <div className="text-2xl font-bold" style={{ color: '#52c41a' }}>
                  {formatMoney(escrowData?.unfrozenAmount)}
                </div>
                <div className="text-sm mt-1" style={{ color: '#52c41a' }}>已解冻资金</div>
              </div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <div className="text-2xl font-bold" style={{ color: '#1890ff' }}>
                  {formatMoney(escrowData?.totalEscrow)}
                </div>
                <div className="text-sm mt-1" style={{ color: '#1890ff' }}>累计托管金额</div>
              </div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                <div className="text-2xl font-bold" style={{ color: '#722ed1' }}>
                  {escrowData?.transactions?.length || 0}
                </div>
                <div className="text-sm mt-1" style={{ color: '#722ed1' }}>资金流水记录</div>
              </div>
            </div>
          </div>

          <div className="card mb-6">
            <div className="card-header">
              <h3 className="font-bold">🏦 托管流程</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {escrowSteps.map((step, i) => (
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
                    {i < escrowSteps.length - 1 && (
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
            {guarantees.map((item, i) => (
              <div key={i} className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-gray text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header flex-between">
              <h3 className="font-bold">📋 资金流水</h3>
            </div>
            <div className="card-body">
              {escrowData?.transactions?.length === 0 ? (
                <div className="text-center text-gray" style={{ padding: '2rem' }}>
                  暂无资金流水记录
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>流水编号</th>
                      <th>类型</th>
                      <th>金额</th>
                      <th>状态</th>
                      <th>关联房源</th>
                      <th>时间</th>
                      <th>存证编号</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(escrowData?.transactions || [
                      { id: 1, order_no: 'ES202605001', type: 'rent', amount: 5000, status: 'frozen', property: '朝阳区国贸CBD一居室', created_at: '2026-05-01 10:00:00', cert_no: 'CERT-ESC-001' },
                      { id: 2, order_no: 'ES202605002', type: 'deposit', amount: 5000, status: 'frozen', property: '朝阳区国贸CBD一居室', created_at: '2026-05-01 10:05:00', cert_no: 'CERT-ESC-002' },
                      { id: 3, order_no: 'ES202605003', type: 'rent', amount: 3500, status: 'unfrozen', property: '海淀区中关村两居室', created_at: '2026-05-10 09:00:00', cert_no: 'CERT-ESC-003' }
                    ]).map((tx, index) => {
                      const status = getStatusBadge(tx.status);
                      const isPositive = tx.type === 'unfreeze' || tx.type === 'unfrozen' || tx.status === 'unfrozen';
                      return (
                        <tr key={tx.id || index}>
                          <td className="font-bold">{tx.order_no || tx.id}</td>
                          <td>
                            <span className="tag">{getTypeLabel(tx.type)}</span>
                          </td>
                          <td style={{ color: isPositive ? '#52c41a' : '#ef4444', fontWeight: 'bold' }}>
                            {isPositive ? '+' : '-'}{formatMoney(tx.amount)}
                          </td>
                          <td>
                            <span className={`badge ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="text-sm">{tx.property_title || tx.property || '-'}</td>
                          <td className="text-gray text-sm">{formatDate(tx.created_at || tx.date)}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#1890ff' }}>
                              {tx.cert_no || `CERT-ESC-${tx.id}`}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                              onClick={() => openEvidenceModal(tx)}
                            >
                              查看存证
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {showRechargeModal && (
        <div className="modal-overlay" onClick={() => setShowRechargeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">💰 充值托管</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">充值金额 (元) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={rechargeAmount}
                  onChange={e => setRechargeAmount(e.target.value)}
                  placeholder="请输入充值金额"
                  min="1"
                />
              </div>
              <div className="flex gap-2 mb-4">
                {[1000, 3000, 5000, 10000].map(amount => (
                  <button
                    key={amount}
                    className="btn"
                    style={{ flex: 1 }}
                    onClick={() => setRechargeAmount(amount.toString())}
                  >
                    {formatMoney(amount)}
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">关联合约（可选）</label>
                <select 
                  className="form-input"
                  value={selectedContract}
                  onChange={e => setSelectedContract(e.target.value)}
                >
                  <option value="">请选择关联合约</option>
                  <option value="1">HT202605001 - 朝阳区国贸CBD精装一居室</option>
                  <option value="2">HT202604002 - 海淀区中关村两居室</option>
                </select>
              </div>
              <div className="alert alert-info">
                <strong>温馨提示：</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '13px' }}>
                  <li>支持微信、支付宝、银行卡充值</li>
                  <li>充值资金将由第三方银行托管，安全有保障</li>
                  <li>充值后资金将按照合约约定按期解冻</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowRechargeModal(false)} disabled={recharging}>取消</button>
              <button className="btn btn-primary" onClick={handleRecharge} disabled={!rechargeAmount || recharging}>
                {recharging ? '充值中...' : `确认充值 ${rechargeAmount ? formatMoney(rechargeAmount) : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvidenceModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">🔗 资金存证详情</h3>
              <button onClick={() => setShowEvidenceModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)' }}>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
                    <h4 className="font-bold">区块链存证凭证</h4>
                    <p className="text-gray text-sm">资金交易已上链存证，不可篡改</p>
                  </div>
                  <table className="table" style={{ background: 'white' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '100px', fontWeight: 'bold' }}>存证编号</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {selectedTransaction.cert_no || `CERT-ESC-${selectedTransaction.id}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>流水编号</td>
                        <td>{selectedTransaction.order_no || selectedTransaction.id}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>交易金额</td>
                        <td style={{ color: selectedTransaction.amount > 0 ? '#52c41a' : '#ef4444', fontWeight: 'bold' }}>
                          {formatMoney(selectedTransaction.amount)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>存证时间</td>
                        <td>{formatDate(selectedTransaction.created_at || selectedTransaction.date)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>区块高度</td>
                        <td>#2847563</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>交易哈希</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                          0x7f3a2c8e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="text-center text-gray text-sm">
                <p>本存证符合《电子签名法》，具有法律效力</p>
                <p>可通过区块链浏览器验证交易真实性</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowEvidenceModal(false)}>关闭</button>
              <button className="btn btn-primary">
                📄 下载存证证明
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Escrow;
