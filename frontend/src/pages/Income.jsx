import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { creatorAPI, CREATOR_ID } from '../utils/api.js';

const Income = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [incomes, setIncomes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'ad_share', label: '广告分成' },
    { key: 'reward', label: '打赏' },
    { key: 'paid_content', label: '付费内容' },
    { key: 'penalty', label: '扣罚' },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const type = activeTab === 'all' ? undefined : activeTab;
      const [incomeRes, withdrawRes, summaryRes] = await Promise.all([
        creatorAPI.getIncomes(CREATOR_ID, type),
        creatorAPI.getWithdrawals(CREATOR_ID),
        creatorAPI.getIncomeSummary(CREATOR_ID),
      ]);
      setIncomes(incomeRes.data);
      setWithdrawals(withdrawRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('请输入有效金额');
      return;
    }
    if (parseFloat(withdrawAmount) > availableBalance) {
      alert('提现金额不能超过可提现金额');
      return;
    }
    if (!bankInfo.trim()) {
      alert('请填写收款账户信息');
      return;
    }
    try {
      await creatorAPI.createWithdrawal(CREATOR_ID, {
        amount: parseFloat(withdrawAmount),
        bank_info: bankInfo,
      });
      alert('提现申请已提交\n\n处理说明：\n1. 申请已提交，进入审核队列\n2. 审核通常需要 1-3 个工作日\n3. 审核通过后财务将在 24 小时内打款\n4. 您可以在下方查看提现状态');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankInfo('');
      loadData();
    } catch (error) {
      console.error('Failed to withdraw:', error);
      const errorMsg = error.response?.data?.error || '提现申请失败，请稍后重试';
      alert('提现失败：' + errorMsg);
    }
  };

  const viewWithdrawalDetail = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
  };

  const typeLabels = {
    ad_share: '广告分成',
    reward: '粉丝打赏',
    paid_content: '付费内容',
    penalty: '违规扣罚',
  };

  const statusLabels = {
    pending: { label: '待审核', class: 'status-pending' },
    processing: { label: '处理中', class: 'status-review' },
    settled: { label: '已完成', class: 'status-settled' },
    failed: { label: '失败', class: 'status-warning' },
  };

  const incomeByType = [
    { value: summary?.ad_share || 0, name: '广告分成', color: '#1890ff' },
    { value: summary?.reward || 0, name: '粉丝打赏', color: '#52c41a' },
    { value: summary?.paid_content || 0, name: '付费内容', color: '#722ed1' },
  ];

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: '10px', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: incomeByType
    }]
  };

  const availableBalance = (summary?.total || 0) - (summary?.pending || 0) - 
    withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').reduce((sum, w) => sum + w.amount, 0);

  const getStatusTimeline = (withdrawal) => {
    const timeline = [
      { step: 1, title: '提交申请', time: withdrawal.created_at, completed: true },
    ];

    if (withdrawal.status === 'pending') {
      timeline.push({ step: 2, title: '审核中', time: null, completed: false, current: true });
      timeline.push({ step: 3, title: '财务打款', time: null, completed: false });
      timeline.push({ step: 4, title: '已到账', time: null, completed: false });
    } else if (withdrawal.status === 'processing') {
      timeline.push({ step: 2, title: '审核通过', time: withdrawal.processed_at || null, completed: true });
      timeline.push({ step: 3, title: '财务处理中', time: null, completed: false, current: true });
      timeline.push({ step: 4, title: '已到账', time: null, completed: false });
    } else if (withdrawal.status === 'settled') {
      timeline.push({ step: 2, title: '审核通过', time: withdrawal.processed_at || withdrawal.created_at, completed: true });
      timeline.push({ step: 3, title: '财务打款', time: withdrawal.processed_at || withdrawal.created_at, completed: true });
      timeline.push({ step: 4, title: '已到账', time: withdrawal.processed_at || withdrawal.created_at, completed: true });
    } else if (withdrawal.status === 'failed') {
      timeline.push({ step: 2, title: '审核失败', time: withdrawal.processed_at || null, completed: true, failed: true });
      timeline.push({ step: 3, title: '财务打款', time: null, completed: false, skipped: true });
      timeline.push({ step: 4, title: '已到账', time: null, completed: false, skipped: true });
    }

    return timeline;
  };

  return (
    <div>
      <div className="page-header">
        <h2>收益中心</h2>
        <button className="btn btn-primary" onClick={() => setShowWithdrawModal(true)}>
          申请提现
        </button>
      </div>
      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value text-success">¥{(summary?.total || 0).toLocaleString()}</div>
            <div className="stat-label">累计收益</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-warning">¥{(summary?.pending || 0).toLocaleString()}</div>
            <div className="stat-label">待结算</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-primary">¥{availableBalance.toFixed(2)}</div>
            <div className="stat-label">可提现</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">¥{(withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').reduce((sum, w) => sum + w.amount, 0)).toFixed(2)}</div>
            <div className="stat-label">提现中</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">收益构成</h3>
            </div>
            <div style={{ height: '280px' }}>
              <ReactECharts option={pieOption} style={{ height: '100%' }} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">收益明细</h3>
            </div>
            <div className="tabs" style={{ marginBottom: '16px' }}>
              {tabs.map(tab => (
                <div
                  key={tab.key}
                  className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {tab.label}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex-center" style={{ padding: '40px 0' }}>
                <span>加载中...</span>
              </div>
            ) : incomes.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">💰</div>
                <div className="empty-text">暂无收益记录</div>
              </div>
            ) : (
              <div>
                {incomes.map(item => (
                  <div key={item.id} className="income-item">
                    <div className="income-info">
                      <div className="income-type">{typeLabels[item.type] || item.type}</div>
                      <div className="income-desc">
                        {item.description} · {item.created_at?.split(' ')[0]}
                      </div>
                    </div>
                    <div>
                      <div className={`income-amount ${item.amount < 0 ? 'negative' : ''}`}>
                        {item.amount >= 0 ? '+' : ''}¥{item.amount.toLocaleString()}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`status-badge ${statusLabels[item.status]?.class}`}>
                          {statusLabels[item.status]?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">提现记录</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
              <span className="text-muted">共 {withdrawals.length} 条记录</span>
            </div>
          </div>
          
          <div style={{ background: '#fff7e6', border: '1px solid #ffd591', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ fontWeight: 500, color: '#fa8c16', marginBottom: '4px' }}>💡 提现说明</div>
            <div style={{ color: '#595959', lineHeight: '1.8' }}>
              • 提现申请提交后，通常 1-3 个工作日完成审核<br/>
              • 审核通过后，财务将在 24 小时内完成打款<br/>
              • 如遇节假日，到账时间可能顺延<br/>
              • 最低提现金额：¥100
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💳</div>
              <div className="empty-text">暂无提现记录</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>申请时间</th>
                  <th>提现金额</th>
                  <th>收款账户</th>
                  <th>状态</th>
                  <th>处理进度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(w => (
                  <tr key={w.id}>
                    <td>{w.created_at?.split(' ').join(' ')}</td>
                    <td style={{ fontWeight: 600 }}>¥{w.amount.toLocaleString()}</td>
                    <td className="text-muted">{w.bank_info || '-'}</td>
                    <td>
                      <span className={`status-badge ${statusLabels[w.status]?.class}`}>
                        {statusLabels[w.status]?.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {w.status === 'pending' && (
                          <>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1890ff' }}></div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>审核中</span>
                          </>
                        )}
                        {w.status === 'processing' && (
                          <>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fa8c16' }}></div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>财务处理</span>
                          </>
                        )}
                        {w.status === 'settled' && (
                          <>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#52c41a' }}></div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>已完成</span>
                          </>
                        )}
                        {w.status === 'failed' && (
                          <>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4f' }}></div>
                            <span className="text-muted" style={{ fontSize: '12px' }}>已失败</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-default"
                        onClick={() => viewWithdrawalDetail(w)}
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showWithdrawModal && (
          <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">申请提现</h3>
                <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ background: '#f6ffed', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>可提现金额</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: '#52c41a' }}>
                    ¥{availableBalance.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '12px', color: '#8c8c8c', lineHeight: '1.8' }}>
                  <div>📋 提现须知：</div>
                  <div>• 最低提现金额：¥100</div>
                  <div>• 审核周期：1-3 个工作日</div>
                  <div>• 到账时间：审核通过后 24 小时内</div>
                </div>

                <div className="form-group">
                  <label className="form-label">提现金额 *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="请输入提现金额"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={100}
                    max={availableBalance}
                    step={0.01}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px' }}>
                    <span className="text-muted">最低 ¥100</span>
                    <button 
                      className="btn-link"
                      onClick={() => setWithdrawAmount(availableBalance.toFixed(2))}
                      style={{ fontSize: '12px', padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: '#1890ff' }}
                    >
                      全部提现
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">收款账户信息 *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="请输入银行卡或支付宝/微信账户信息，如：招商银行 **** 8888 张三"
                    value={bankInfo}
                    onChange={(e) => setBankInfo(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-default" onClick={() => setShowWithdrawModal(false)}>取消</button>
                <button className="btn btn-primary" onClick={handleWithdraw}>提交申请</button>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedWithdrawal && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">提现详情</h3>
                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ background: selectedWithdrawal.status === 'failed' ? '#fff1f0' : '#f6ffed', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>提现金额</div>
                  <div style={{ fontSize: '32px', fontWeight: 600, color: selectedWithdrawal.status === 'failed' ? '#ff4d4f' : '#52c41a' }}>
                    ¥{selectedWithdrawal.amount.toLocaleString()}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`status-badge ${statusLabels[selectedWithdrawal.status]?.class}`}>
                      {statusLabels[selectedWithdrawal.status]?.label}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>处理进度</div>
                  <div style={{ position: 'relative', paddingLeft: '24px' }}>
                    {getStatusTimeline(selectedWithdrawal).map((item, index) => (
                      <div key={item.step} style={{ position: 'relative', marginBottom: '20px' }}>
                        <div 
                          style={{ 
                            position: 'absolute', 
                            left: '-24px', 
                            top: '2px',
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            background: item.failed ? '#ff4d4f' : item.current ? '#1890ff' : item.completed ? '#52c41a' : '#d9d9d9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '10px',
                            zIndex: 1
                          }}
                        >
                          {item.completed ? '✓' : item.failed ? '✗' : item.step}
                        </div>
                        {index < getStatusTimeline(selectedWithdrawal).length - 1 && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              left: '-17px', 
                              top: '18px', 
                              width: '2px', 
                              height: '32px',
                              background: item.skipped ? '#f0f0f0' : item.completed ? '#52c41a' : '#f0f0f0'
                            }}
                          ></div>
                        )}
                        <div>
                          <div style={{ fontWeight: 500, opacity: item.skipped ? 0.5 : 1 }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c', opacity: item.skipped ? 0.5 : 1 }}>
                            {item.time || (item.current ? '处理中...' : '待处理')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedWithdrawal.reason && (
                  <div style={{ 
                    background: selectedWithdrawal.status === 'failed' ? '#fff1f0' : '#f6f6f6', 
                    padding: '12px', 
                    borderRadius: '4px', 
                    fontSize: '13px' 
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {selectedWithdrawal.status === 'failed' ? '❌ 失败原因' : '📝 备注'}
                    </div>
                    <div style={{ color: selectedWithdrawal.status === 'failed' ? '#ff4d4f' : '#595959' }}>
                      {selectedWithdrawal.reason}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '13px', color: '#8c8c8c', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>申请时间</span>
                    <span>{selectedWithdrawal.created_at}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>收款账户</span>
                    <span>{selectedWithdrawal.bank_info || '-'}</span>
                  </div>
                  {selectedWithdrawal.processed_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>处理时间</span>
                      <span>{selectedWithdrawal.processed_at}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                {selectedWithdrawal.status === 'failed' && (
                  <button className="btn btn-primary" onClick={() => {
                    setShowDetailModal(false);
                    setShowWithdrawModal(true);
                  }}>
                    重新申请
                  </button>
                )}
                <button className="btn btn-default" onClick={() => setShowDetailModal(false)}>关闭</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Income;
