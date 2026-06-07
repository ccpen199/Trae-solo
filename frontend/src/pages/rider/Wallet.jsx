import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const RiderWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [taxRecords, setTaxRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('balance');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankCard, setBankCard] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes, withdrawRes, taxRes] = await Promise.all([
        api.get('/finance/wallet'),
        api.get('/finance/transactions'),
        api.get('/finance/withdrawals'),
        api.get('/finance/tax-records')
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
      setWithdrawals(withdrawRes.data);
      setTaxRecords(taxRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('请输入有效的提现金额');
      return;
    }
    if (amount > wallet.balance) {
      alert('余额不足');
      return;
    }

    try {
      const res = await api.post('/finance/withdraw', {
        amount,
        bank_card_info: bankCard
      });
      setMessage({ type: 'success', text: `提现申请已提交，实际到账 ¥${res.data.actualAmount}，税号 ${res.data.certificateNo}` });
      setWithdrawAmount('');
      setBankCard('');
      loadData();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || '提现失败' });
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>💰 个人中心 · 我的钱包</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>可提现余额 (T+0 实时到账)</div>
        <div style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px' }}>¥{wallet?.balance?.toFixed(2) || '0.00'}</div>
        <div style={{ display: 'flex', gap: '40px', fontSize: '14px', opacity: 0.9 }}>
          <div>累计收入：¥{wallet?.total_income?.toFixed(2) || '0.00'}</div>
          <div>累计提现：¥{wallet?.total_withdraw?.toFixed(2) || '0.00'}</div>
          <div>冻结金额：¥{wallet?.frozen_balance?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab-item ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>提现</div>
        <div className={`tab-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>流水明细</div>
        <div className={`tab-item ${activeTab === 'withdrawals' ? 'active' : ''}`} onClick={() => setActiveTab('withdrawals')}>提现记录</div>
        <div className={`tab-item ${activeTab === 'tax' ? 'active' : ''}`} onClick={() => setActiveTab('tax')}>税务凭证</div>
      </div>

      {activeTab === 'balance' && (
        <div className="card">
          <h3 className="card-title">T+0 极速提现</h3>
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            提现扣除 3% 个人所得税，自动生成税务代扣凭证
          </div>
          <div className="form-group">
            <label className="form-label">提现金额</label>
            <input
              type="number"
              className="form-input"
              placeholder="请输入提现金额"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            {withdrawAmount && (
              <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                预计扣除税费 ¥{(parseFloat(withdrawAmount) * 0.03).toFixed(2)}，实际到账 ¥{(parseFloat(withdrawAmount) * 0.97).toFixed(2)}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">银行卡号（可选）</label>
            <input
              type="text"
              className="form-input mask"
              placeholder="请输入银行卡号"
              value={bankCard}
              onChange={(e) => setBankCard(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={handleWithdraw}>
            立即提现
          </button>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card">
          <h3 className="card-title">收入明细</h3>
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>金额</th>
                <th>余额</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i}>
                  <td>{new Date(tx.created_at * 1000).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                      {tx.type === 'income' ? '收入' : '提现'}
                    </span>
                  </td>
                  <td style={{ color: tx.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {tx.amount > 0 ? '+' : ''}¥{tx.amount.toFixed(2)}
                  </td>
                  <td>¥{tx.balance_after.toFixed(2)}</td>
                  <td>{tx.description}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="card">
          <h3 className="card-title">提现记录</h3>
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>申请金额</th>
                <th>税费</th>
                <th>实际到账</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w, i) => (
                <tr key={i}>
                  <td>{new Date(w.created_at * 1000).toLocaleString()}</td>
                  <td>¥{w.amount.toFixed(2)}</td>
                  <td>¥{w.tax_amount.toFixed(2)}</td>
                  <td style={{ color: 'var(--success)' }}>¥{w.actual_amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${w.status === 'processed' ? 'badge-success' : 'badge-warning'}`}>
                      {w.status === 'processed' ? '已到账' : '处理中'}
                    </span>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="card">
          <h3 className="card-title">税务代扣凭证</h3>
          <table className="table">
            <thead>
              <tr>
                <th>凭证编号</th>
                <th>时间</th>
                <th>计税收入</th>
                <th>税率</th>
                <th>代扣税额</th>
              </tr>
            </thead>
            <tbody>
              {taxRecords.map((t, i) => (
                <tr key={i}>
                  <td className="mask">{t.certificate_no}</td>
                  <td>{new Date(t.created_at * 1000).toLocaleString()}</td>
                  <td>¥{t.income_amount.toFixed(2)}</td>
                  <td>{(t.tax_rate * 100).toFixed(0)}%</td>
                  <td style={{ color: 'var(--error)' }}>¥{t.tax_amount.toFixed(2)}</td>
                </tr>
              ))}
              {taxRecords.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RiderWallet;
