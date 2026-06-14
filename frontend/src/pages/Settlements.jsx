import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function Settlements({ showToast }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    method: 'wechat',
    account: ''
  });
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    total_income: 0,
    available: 0,
    pending: 0,
    withdrawn: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settlementsRes, statsRes] = await Promise.all([
        api.get('/settlements/my'),
        api.get('/settlements/stats')
      ]);
      setSettlements(settlementsRes.data.data || []);
      setStats(statsRes.data || {
        total_income: 0,
        available: 0,
        pending: 0,
        withdrawn: 0
      });
    } catch (error) {
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawData.amount || parseFloat(withdrawData.amount) <= 0) {
      showToast('请输入提现金额', 'error');
      return;
    }
    if (parseFloat(withdrawData.amount) > stats.available) {
      showToast('提现金额超出可用余额', 'error');
      return;
    }
    if (!withdrawData.account) {
      showToast('请输入收款账号', 'error');
      return;
    }
    
    try {
      setProcessing(true);
      await api.post('/settlements/withdraw', {
        amount: parseFloat(withdrawData.amount),
        method: withdrawData.method,
        account: withdrawData.account
      });
      showToast('提现申请已提交，预计T+1到账', 'success');
      setShowWithdrawModal(false);
      loadData();
    } catch (error) {
      showToast(error.response?.data?.error || '提现失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待结算',
      available: '可提现',
      processing: '结算中',
      completed: '已完成',
      withdrawn: '已提现',
      failed: '失败'
    };
    return labels[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'badge-warning',
      available: 'badge-info',
      processing: 'badge-warning',
      completed: 'badge-success',
      withdrawn: 'badge-success',
      failed: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1100px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '32px' }}>我的收入</h1>
      
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>累计收入</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
            ¥{stats.total_income?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>可提现</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>
            ¥{stats.available?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>待结算</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
            ¥{stats.pending?.toFixed(2) || '0.00'}
          </div>
        </div>
        
        <div className="card">
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>已提现</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
            ¥{stats.withdrawn?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>当前可提现</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#667eea' }}>
              ¥{stats.available?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              提现将在T+1个工作日内到账
            </div>
          </div>
          <button
            onClick={() => {
              setWithdrawData({ amount: '', method: 'wechat', account: '' });
              setShowWithdrawModal(true);
            }}
            className="btn btn-primary"
            style={{ padding: '14px 40px', fontSize: '16px' }}
            disabled={stats.available <= 0}
          >
            申请提现
          </button>
        </div>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
          结算明细
        </div>
        
        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : settlements.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>任务名称</th>
                <th>类型</th>
                <th>金额</th>
                <th>服务费(5%)</th>
                <th>实得</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.task_title || '-'}</td>
                  <td>
                    <span className={`task-type task-type-${item.task_type}`}>
                      {item.task_type === 'online' ? '线上' : item.task_type === 'offline' ? '线下' : '混合'}
                    </span>
                  </td>
                  <td>¥{item.gross_amount?.toFixed(2)}</td>
                  <td style={{ color: '#f59e0b' }}>-¥{item.platform_fee?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>¥{item.net_amount?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '13px' }}>
                    {item.created_at?.substring(0, 16)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💰</div>
            <p>暂无结算记录</p>
          </div>
        )}
      </div>
      
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">申请提现</h2>
            
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>可提现金额</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>
                ¥{stats.available?.toFixed(2) || '0.00'}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">提现金额</label>
              <input
                type="number"
                className="form-input"
                value={withdrawData.amount}
                onChange={e => setWithdrawData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="请输入提现金额"
                step="0.01"
                min="0.01"
                max={stats.available}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">收款方式</label>
              <select
                className="form-select"
                value={withdrawData.method}
                onChange={e => setWithdrawData(prev => ({ ...prev, method: e.target.value }))}
              >
                <option value="wechat">微信支付</option>
                <option value="alipay">支付宝</option>
                <option value="bank">银行卡</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">收款账号</label>
              <input
                type="text"
                className="form-input"
                value={withdrawData.account}
                onChange={e => setWithdrawData(prev => ({ ...prev, account: e.target.value }))}
                placeholder={
                  withdrawData.method === 'wechat' ? '请输入微信号' :
                  withdrawData.method === 'alipay' ? '请输入支付宝账号' :
                  '请输入银行卡号'
                }
              />
            </div>
            
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              提现将在T+1个工作日内到账，节假日顺延。最低提现金额1元。
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowWithdrawModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleWithdraw} disabled={processing}>
                {processing ? '提交中...' : '确认提现'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settlements;
