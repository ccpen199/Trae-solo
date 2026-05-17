import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../api';
import useStore from '../store';

function Wallet() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balanceData, txData] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions()
      ]);
      if (balanceData.success) setBalance(balanceData.data?.balance || 0);
      if (txData.success) setTransactions(txData.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!amount || parseInt(amount) <= 0) {
      alert('请输入正确的金额');
      return;
    }
    try {
      await walletAPI.recharge(parseInt(amount));
      alert('充值成功');
      setShowRechargeModal(false);
      setAmount('');
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseInt(amount) <= 0) {
      alert('请输入正确的金额');
      return;
    }
    if (parseInt(amount) > balance) {
      alert('余额不足');
      return;
    }
    try {
      await walletAPI.withdraw(parseInt(amount));
      alert('提现成功');
      setShowWithdrawModal(false);
      setAmount('');
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }

  return (
    <div>
      <h2>💰 我的钱包</h2>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '30px',
        color: 'white',
        marginBottom: '30px'
      }}>
        <p style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Keep 币余额</p>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '48px' }}>{balance}</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => { setShowRechargeModal(true); setAmount(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            充值
          </button>
          <button
            onClick={() => { setShowWithdrawModal(true); setAmount(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            提现
          </button>
        </div>
      </div>

      <h3 style={{ marginBottom: '15px' }}>交易记录</h3>
      {transactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
          background: 'white',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📝</div>
          暂无交易记录
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {transactions.map((tx, index) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px 20px',
                borderBottom: index < transactions.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: tx.type === 'recharge' ? '#e6f7ff' : '#fff1f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                marginRight: '15px'
              }}>
                {tx.type === 'recharge' ? '⬆️' : '⬇️'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0' }}>
                  {tx.type === 'recharge' ? '充值' : '提现'}
                </h4>
                <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
                  {tx.created_at}
                </p>
              </div>
              <div style={{
                color: tx.type === 'recharge' ? '#00d563' : '#f5222d',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {tx.type === 'recharge' ? '+' : '-'}{tx.amount}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRechargeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>充值 Keep 币</h3>
            <div style={{ marginBottom: '20px' }}>
              <label>充值金额</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '8px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  boxSizing: 'border-box',
                  fontSize: '18px'
                }}
                placeholder="请输入充值金额"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {[10, 50, 100, 500].map(num => (
                <button
                  key={num}
                  onClick={() => setAmount(num.toString())}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: amount === num.toString() ? '#00d563' : '#f0f0f0',
                    color: amount === num.toString() ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowRechargeModal(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleRecharge}
                style={{ flex: 1, padding: '12px', background: '#00d563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                确认充值
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>提现 Keep 币</h3>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>当前余额：{balance} Keep 币</p>
            <div style={{ marginBottom: '20px' }}>
              <label>提现金额</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '8px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  boxSizing: 'border-box',
                  fontSize: '18px'
                }}
                placeholder="请输入提现金额"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {[10, 50, 100].map(num => (
                <button
                  key={num}
                  onClick={() => setAmount(Math.min(num, balance).toString())}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: amount === Math.min(num, balance).toString() ? '#00d563' : '#f0f0f0',
                    color: amount === Math.min(num, balance).toString() ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {Math.min(num, balance)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                style={{ flex: 1, padding: '12px', background: '#00d563', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wallet;
