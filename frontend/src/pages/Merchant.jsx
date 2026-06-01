import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Merchant = () => {
  const { user } = useAuth()
  const [store, setStore] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newStore, setNewStore] = useState({ store_name: '', store_description: '' })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState({ amount: '', note: '' })

  useEffect(() => {
    fetchStore()
    fetchTransactions()
  }, [])

  const fetchStore = async () => {
    try {
      const res = await api.get('/transactions/merchant')
      if (res.data.success) {
        setStore(res.data.data)
      }
    } catch (err) {
      console.error('获取商户信息失败:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions')
      if (res.data.success) {
        setTransactions(res.data.data || [])
      }
    } catch (err) {
      console.error('获取交易记录失败:', err)
    }
  }

  const handleCreateStore = async () => {
    if (!newStore.store_name.trim()) return
    try {
      const res = await api.post('/transactions/merchant', newStore)
      if (res.data.success) {
        setShowCreateModal(false)
        fetchStore()
      }
    } catch (err) {
      console.error('创建商户失败:', err)
    }
  }

  const handlePayment = async () => {
    if (!paymentInfo.amount || parseFloat(paymentInfo.amount) <= 0) return
    try {
      const res = await api.post('/transactions', {
        payee_id: user.id,
        amount: parseFloat(paymentInfo.amount),
        note: paymentInfo.note,
        payment_method: 'balance'
      })
      if (res.data.success) {
        setShowPaymentModal(false)
        setPaymentInfo({ amount: '', note: '' })
        setTimeout(() => {
          fetchTransactions()
          fetchStore()
        }, 1000)
      }
    } catch (err) {
      console.error('收款失败:', err)
    }
  }

  const totalReceived = transactions
    .filter(t => t.payee_id === user?.id && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0)

  if (!store) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🏪</div>
        <h2 style={styles.emptyTitle}>还没有开通商户收款</h2>
        <p style={styles.emptyText}>开通后即可接收他人转账</p>
        <button onClick={() => setShowCreateModal(true)} style={styles.createButton}>
          开通商户收款
        </button>

        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>开通商户收款</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>商户名称</label>
                <input
                  type="text"
                  value={newStore.store_name}
                  onChange={(e) => setNewStore({ ...newStore, store_name: e.target.value })}
                  placeholder="请输入商户名称"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>商户简介（选填）</label>
                <input
                  type="text"
                  value={newStore.store_description}
                  onChange={(e) => setNewStore({ ...newStore, store_description: e.target.value })}
                  placeholder="简单描述一下你的商户"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button onClick={() => setShowCreateModal(false)} style={styles.cancelButton}>
                  取消
                </button>
                <button onClick={handleCreateStore} style={styles.confirmButton}>
                  开通
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>{store.store_name}</h1>
        {store.store_description && (
          <p style={styles.subtitle}>{store.store_description}</p>
        )}
      </header>

      <div style={styles.statsCard}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>累计收款</span>
          <span style={styles.statValue}>¥{totalReceived.toFixed(2)}</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>今日收款</span>
          <span style={styles.statValue}>¥{(store.today_received || 0).toFixed(2)}</span>
        </div>
      </div>

      <button onClick={() => setShowPaymentModal(true)} style={styles.receiveButton}>
        扫码收款
      </button>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>交易记录</h3>
        {transactions.length === 0 ? (
          <div style={styles.emptyTransactions}>
            <span style={styles.emptyTransactionsIcon}>📋</span>
            <p style={styles.emptyTransactionsText}>暂无交易记录</p>
          </div>
        ) : (
          <div style={styles.transactionList}>
            {transactions.map((t) => (
              <div key={t.id} style={styles.transactionItem}>
                <div style={styles.transactionInfo}>
                  <span style={styles.transactionType}>
                    {t.payer_id === user?.id ? '转出' : '转入'}
                  </span>
                  <div>
                    <p style={styles.transactionNote}>{t.note || '无备注'}</p>
                    <p style={styles.transactionTime}>
                      {new Date(t.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span style={{
                  ...styles.transactionAmount,
                  color: t.payer_id === user?.id ? '#E53935' : '#4CAF50'
                }}>
                  {t.payer_id === user?.id ? '-' : '+'}¥{t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>扫码收款</h3>
            <div style={styles.qrCode}>📷</div>
            <p style={styles.qrDesc}>让对方扫描二维码向你付款</p>
            <div style={styles.formGroup}>
              <label style={styles.label}>收款金额</label>
              <input
                type="number"
                value={paymentInfo.amount}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, amount: e.target.value })}
                placeholder="请输入金额"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>备注（选填）</label>
              <input
                type="text"
                value={paymentInfo.note}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, note: e.target.value })}
                placeholder="添加备注"
                style={styles.input}
              />
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowPaymentModal(false)} style={styles.cancelButton}>
                取消
              </button>
              <button onClick={handlePayment} style={styles.confirmButton}>
                模拟收款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  emptyContainer: {
    padding: '80px 24px',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '24px'
  },
  createButton: {
    padding: '12px 32px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  header: {
    padding: '24px 20px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    color: '#fff'
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9
  },
  statsCard: {
    display: 'flex',
    background: '#fff',
    margin: '-20px 20px 0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  statItem: {
    flex: 1,
    textAlign: 'center'
  },
  statLabel: {
    fontSize: '13px',
    color: '#999',
    display: 'block',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#333'
  },
  statDivider: {
    width: '1px',
    background: '#f0f0f0'
  },
  receiveButton: {
    margin: '16px 20px',
    padding: '14px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: 'calc(100% - 40px)'
  },
  section: {
    padding: '0 20px 20px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px'
  },
  emptyTransactions: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center'
  },
  emptyTransactionsIcon: {
    fontSize: '40px',
    marginBottom: '12px',
    display: 'block'
  },
  emptyTransactionsText: {
    fontSize: '14px',
    color: '#999'
  },
  transactionList: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #f0f0f0'
  },
  transactionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  transactionType: {
    padding: '4px 10px',
    background: '#E8F5E9',
    color: '#4CAF50',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600'
  },
  transactionNote: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px'
  },
  transactionTime: {
    fontSize: '12px',
    color: '#999'
  },
  transactionAmount: {
    fontSize: '16px',
    fontWeight: '700'
  },
  modalOverlay: {
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
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '360px',
    padding: '24px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '20px'
  },
  qrCode: {
    width: '120px',
    height: '120px',
    background: '#f5f5f5',
    borderRadius: '12px',
    margin: '0 auto 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px'
  },
  qrDesc: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600'
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: '#4CAF50',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600'
  }
}

export default Merchant