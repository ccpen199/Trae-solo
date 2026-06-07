import React, { useState, useEffect } from 'react';
import { yicoinAPI } from '../api';

function Yicoin({ user }) {
  const [yicoinData, setYicoinData] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchangeReason, setExchangeReason] = useState('');
  const [message, setMessage] = useState(null);
  const [isCircuitBroken, setIsCircuitBroken] = useState(false);
  const [todayEarned, setTodayEarned] = useState(0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const rulesRes = await yicoinAPI.getRules();
      setRules(rulesRes.data.data);
      
      if (user?.volunteer?.id) {
        const coinRes = await yicoinAPI.getByVolunteer(user.volunteer.id);
        const data = coinRes.data.data;
        setYicoinData(data);
        
        const today = new Date().toDateString();
        const todayTransactions = data.recent_transactions?.filter(txn => 
          txn.type === 'earn' && new Date(txn.created_at).toDateString() === today
        ) || [];
        const earned = todayTransactions.reduce((sum, txn) => sum + txn.amount, 0);
        setTodayEarned(earned);
        setIsCircuitBroken(earned > 500);
      }
    } catch (err) {
      console.error('加载益币数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    if (!user?.volunteer?.id) {
      setMessage({ type: 'error', text: '请先登录' });
      return;
    }
    
    const amount = parseInt(exchangeAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: '请输入有效的兑换数量' });
      return;
    }
    
    if (amount > (yicoinData?.balance || 0)) {
      setMessage({ type: 'error', text: '益币余额不足' });
      return;
    }
    
    if (!exchangeReason) {
      setMessage({ type: 'error', text: '请选择兑换原因' });
      return;
    }
    
    if (isCircuitBroken) {
      setMessage({ 
        type: 'error', 
        text: `⚠️ 触发防刷熔断：今日已获得 ${todayEarned} 益币，超过每日500上限，兑换功能已暂停。请明日再试。` 
      });
      return;
    }
    
    try {
      await yicoinAPI.exchange(user.volunteer.id, {
        amount: amount,
        reason: exchangeReason
      });
      setMessage({ type: 'success', text: `🎉 兑换成功！已扣除 ${amount} 益币` });
      setExchangeAmount('');
      setExchangeReason('');
      loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || '兑换失败';
      if (errorMsg.includes('熔断') || err.response?.status === 403) {
        setMessage({ 
          type: 'error', 
          text: `⚠️ ${errorMsg}。今日已获得 ${todayEarned} 益币，超过每日500上限，系统已自动触发熔断保护。` 
        });
        setIsCircuitBroken(true);
      } else {
        setMessage({ type: 'error', text: errorMsg });
      }
    }
  };

  if (loading) return <div className="container"><div className="card">加载中...</div></div>;

  return (
    <div className="container">
      <div className="card" style={{ background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)', color: 'white' }}>
        <h2>益币中心</h2>
        <p style={{ opacity: 0.9, marginTop: '8px' }}>志愿服务，益币激励。用爱心换取温暖！</p>
      </div>

      {yicoinData && (
        <div className="grid grid-3" style={{ marginTop: '-40px' }}>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#faad14' }}>{yicoinData.balance}</div>
            <div className="stat-card-label">当前余额</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#52c41a' }}>{yicoinData.total_earned}</div>
            <div className="stat-card-label">累计获得</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ color: '#ff4d4f' }}>{yicoinData.total_spent}</div>
            <div className="stat-card-label">累计消费</div>
          </div>
        </div>
      )}

      <div className="card" style={{ 
        marginTop: '16px', 
        background: isCircuitBroken ? '#fff1f0' : '#f6ffed',
        border: `2px solid ${isCircuitBroken ? '#ffa39e' : '#b7eb8f'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
              🛡️ 防刷熔断机制 {isCircuitBroken ? '🔴 已触发' : '🟢 正常运行'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              今日已获得 <strong style={{ color: isCircuitBroken ? '#cf1322' : '#389e0d' }}>{todayEarned}</strong> / 500 益币
              {isCircuitBroken && <span style={{ color: '#cf1322', marginLeft: '8px' }}>（已超过上限）</span>}
            </div>
          </div>
          <div style={{ 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: isCircuitBroken ? '#ffccc7' : '#d9f7be',
            fontSize: '14px',
            fontWeight: 500,
            color: isCircuitBroken ? '#a8071a' : '#389e0d'
          }}>
            {isCircuitBroken ? '兑换已暂停' : '兑换功能正常'}
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong>机制说明：</strong>为防止恶意刷取益币，系统设置每日500益币的熔断阈值。
          当志愿者当日累计获得益币超过500时，系统将自动触发熔断，暂停当日的益币发放和兑换功能，
          次日自动恢复。此举旨在确保益币体系的公平性和可持续性。
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">益币获取规则</div>
          {rules.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)' }}>暂无规则</div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{rule.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {rule.description}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', flexWrap: 'wrap' }}>
                  <span>💰 每小时: <strong>{rule.coins_per_hour}</strong> 益币</span>
                  <span>⏱️ 最低时长: {rule.min_hours}小时</span>
                  <span>🛡️ 每日上限: {rule.max_daily}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">益币兑换</div>
          {message && (
            <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
              {message.text}
            </div>
          )}
          {!user?.volunteer ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>请先登录以使用益币兑换功能</p>
            </div>
          ) : (
            <form onSubmit={handleExchange}>
              <div className="form-group">
                <label className="form-label">兑换数量</label>
                <input
                  type="number"
                  className="form-input"
                  value={exchangeAmount}
                  onChange={e => setExchangeAmount(e.target.value)}
                  min="1"
                  max={yicoinData?.balance || 0}
                  required
                  disabled={isCircuitBroken}
                  placeholder="请输入兑换数量"
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  可用余额: {yicoinData?.balance || 0} 益币
                  {isCircuitBroken && <span style={{ color: '#cf1322', marginLeft: '8px' }}>（熔断中，暂不可用）</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">兑换原因</label>
                <select 
                  className="form-select" 
                  value={exchangeReason}
                  onChange={e => setExchangeReason(e.target.value)} 
                  required
                  disabled={isCircuitBroken}
                >
                  <option value="">请选择</option>
                  <option value="兑换公益商品">兑换公益商品</option>
                  <option value="兑换培训课程">兑换培训课程</option>
                  <option value="兑换交通补贴">兑换交通补贴</option>
                  <option value="兑换纪念品">兑换纪念品</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={isCircuitBroken}
              >
                {isCircuitBroken ? '🔒 熔断中，暂不可兑换' : '确认兑换'}
              </button>
            </form>
          )}

          {yicoinData?.recent_transactions?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>最近交易记录</div>
              {yicoinData.recent_transactions.map(txn => (
                <div key={txn.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px', borderBottom: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{txn.reason}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(txn.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700,
                    color: txn.type === 'earn' ? 'var(--success-color)' : 'var(--error-color)'
                  }}>
                    {txn.type === 'earn' ? '+' : '-'}{txn.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Yicoin;
