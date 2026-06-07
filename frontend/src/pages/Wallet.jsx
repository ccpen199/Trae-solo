import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Wallet() {
  const [personId, setPersonId] = useState(1);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [reconciliation, setReconciliation] = useState(null);

  useEffect(() => {
    loadWallet();
  }, [personId]);

  const loadWallet = async () => {
    try {
      const res = await axios.get(`/api/wallet/${personId}`);
      if (res.data.success) {
        setWallet(res.data.data);
        loadTransactions(res.data.data.id);
      } else {
        setWallet(null);
      }
    } catch (e) {
      setWallet(null);
    }
  };

  const loadTransactions = async (walletId) => {
    try {
      const res = await axios.get(`/api/wallet/transactions/${walletId}`);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (e) {}
  };

  const openWallet = async () => {
    try {
      const res = await axios.post('/api/wallet/open', {
        person_id: personId,
        custodian: '中国建设银行'
      });
      if (res.data.success) {
        setWallet(res.data.data);
        setMessage('钱包开立成功！');
      } else {
        setMessage(res.data.message);
      }
    } catch (e) {
      setMessage('开立失败');
    }
  };

  const handleDeposit = async () => {
    if (!amount || !wallet) return;
    try {
      const res = await axios.post('/api/wallet/deposit', {
        wallet_id: wallet.id,
        amount: parseFloat(amount),
        counterpart: '测试银行'
      });
      if (res.data.success) {
        setMessage(`充值成功！余额: ¥${res.data.balance}`);
        setAmount('');
        loadWallet();
      }
    } catch (e) {
      setMessage('充值失败');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !wallet) return;
    try {
      const res = await axios.post('/api/wallet/withdraw', {
        wallet_id: wallet.id,
        amount: parseFloat(amount),
        counterpart: '本人银行卡'
      });
      if (res.data.success) {
        setMessage(`赎回成功！余额: ¥${res.data.balance}`);
        setAmount('');
        loadWallet();
      } else {
        setMessage(res.data.message);
      }
    } catch (e) {
      setMessage('赎回失败');
    }
  };

  const loadReconciliation = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await axios.get(`/api/wallet/reconciliation/${today}`);
      if (res.data.success) {
        setReconciliation(res.data.data);
      }
    } catch (e) {}
  };

  return (
    <div>
      <div className="card">
        <h2>养老钱包管理</h2>

        <div className="form-group">
          <label>参保人ID</label>
          <input 
            type="number" 
            value={personId} 
            onChange={e => setPersonId(parseInt(e.target.value) || 1)}
          />
        </div>

        {message && (
          <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        {wallet ? (
          <div>
            <div className="wallet-card">
              <div className="label">账户余额</div>
              <div className="balance">¥{wallet.balance?.toLocaleString() || '0.00'}</div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
                <span>资金托管: {wallet.custodian}</span>
                <span>账号: {wallet.account_no}</span>
              </div>
            </div>

            <div className="tabs">
              <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                概览
              </div>
              <div className={`tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
                交易记录
              </div>
              <div className={`tab ${activeTab === 'reconciliation' ? 'active' : ''}`} onClick={() => {
                setActiveTab('reconciliation');
                loadReconciliation();
              }}>
                监管对账
              </div>
            </div>

            {activeTab === 'overview' && (
              <div>
                <div className="grid">
                  <div className="form-group">
                    <label>金额</label>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      placeholder="请输入金额"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-success" onClick={handleDeposit}>充值</button>
                  <button className="btn btn-primary" onClick={handleWithdraw}>赎回(T+0)</button>
                </div>

                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h4>账户规则</h4>
                  <p><strong>T+0申赎规则:</strong> 单日限额50,000元，最低100元</p>
                  <p><strong>收益结转:</strong> 日结，每日1号结算上月收益</p>
                  <p><strong>资金安全:</strong> 银行级资金隔离，央行备付金监管</p>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                {transactions.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>类型</th>
                        <th>金额</th>
                        <th>余额</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => (
                        <tr key={t.id}>
                          <td>{new Date(t.created_at).toLocaleString()}</td>
                          <td>
                            <span className={`badge badge-${t.type === 'deposit' ? 'success' : 'warning'}`}>
                              {t.type === 'deposit' ? '充值' : '赎回'}
                            </span>
                          </td>
                          <td style={{ color: t.amount > 0 ? 'green' : 'red' }}>
                            {t.amount > 0 ? '+' : ''}¥{t.amount}
                          </td>
                          <td>¥{t.balance_after}</td>
                          <td>{t.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="loading">暂无交易记录</div>
                )}
              </div>
            )}

            {activeTab === 'reconciliation' && (
              <div>
                {reconciliation ? (
                  <div>
                    <h4>今日对账记录 - {new Date().toLocaleDateString()}</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>托管行</th>
                          <th>系统余额</th>
                          <th>银行余额</th>
                          <th>差额</th>
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconciliation.map(r => (
                          <tr key={r.id}>
                            <td>{r.custodian}</td>
                            <td>¥{r.system_balance}</td>
                            <td>¥{r.bank_balance}</td>
                            <td style={{ color: Math.abs(r.difference) < 1 ? 'green' : 'red' }}>
                              ¥{r.difference?.toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge badge-${r.status === 'matched' ? 'success' : 'danger'}`}>
                                {r.status === 'matched' ? '对账一致' : '待调账'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
                      央行备付金监管对账，确保资金安全
                    </p>
                  </div>
                ) : (
                  <div className="loading">加载对账数据中...</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👛</div>
            <p>您还未开立养老钱包</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openWallet}>
              立即开立钱包
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
