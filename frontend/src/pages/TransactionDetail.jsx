import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

const TransactionDetail = () => {
  const { id } = useParams()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await api.get(`/transactions/${id}/status`)
        if (res.data.success) {
          setTransaction(res.data.data)
        }
      } catch (err) {
        console.error('获取交易详情失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransaction()
  }, [id])

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  if (!transaction) {
    return <div style={styles.error}>交易不存在</div>
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '处理中',
      'success': '成功',
      'failed': '失败',
      'refunded': '已退款'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FF9800',
      'success': '#4CAF50',
      'failed': '#F44336',
      'refunded': '#999'
    }
    return colorMap[status] || '#666'
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.statusIcon}>
          {transaction.status === 'success' ? '✓' : transaction.status === 'pending' ? '⏳' : '✗'}
        </div>
        <h2 style={styles.statusText}>{getStatusText(transaction.status)}</h2>
        <p style={styles.amount}>¥{transaction.amount.toFixed(2)}</p>
      </div>

      <div style={styles.card}>
        <div style={styles.item}>
          <span style={styles.label}>交易单号</span>
          <span style={styles.value}>{transaction.transaction_no}</span>
        </div>
        <div style={styles.item}>
          <span style={styles.label}>付款方</span>
          <span style={styles.value}>{transaction.payer_name || '匿名用户'}</span>
        </div>
        <div style={styles.item}>
          <span style={styles.label}>收款方</span>
          <span style={styles.value}>{transaction.payee_name || '商户'}</span>
        </div>
        <div style={styles.item}>
          <span style={styles.label}>付款方式</span>
          <span style={styles.value}>{transaction.payment_method || '余额支付'}</span>
        </div>
        {transaction.note && (
          <div style={styles.item}>
            <span style={styles.label}>备注</span>
            <span style={styles.value}>{transaction.note}</span>
          </div>
        )}
        <div style={styles.item}>
          <span style={styles.label}>创建时间</span>
          <span style={styles.value}>{new Date(transaction.created_at).toLocaleString()}</span>
        </div>
        {transaction.arrived_at && (
          <div style={styles.item}>
            <span style={styles.label}>到账时间</span>
            <span style={styles.value}>{new Date(transaction.arrived_at).toLocaleString()}</span>
          </div>
        )}
        {transaction.risk_level !== 'normal' && (
          <div style={styles.riskWarning}>
            <span style={styles.riskIcon}>⚠️</span>
            <span style={styles.riskText}>{transaction.risk_remark || '风控提醒'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  error: {
    padding: '40px',
    textAlign: 'center',
    color: '#F44336'
  },
  header: {
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    textAlign: 'center',
    color: '#fff'
  },
  statusIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  statusText: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  amount: {
    fontSize: '36px',
    fontWeight: '700'
  },
  card: {
    background: '#fff',
    margin: '-20px 20px 20px',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  label: {
    fontSize: '14px',
    color: '#999'
  },
  value: {
    fontSize: '14px',
    color: '#333'
  },
  riskWarning: {
    marginTop: '16px',
    padding: '12px',
    background: '#FFF3E0',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  riskIcon: {
    fontSize: '16px'
  },
  riskText: {
    fontSize: '13px',
    color: '#E65100'
  }
}

export default TransactionDetail