import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bike, Clock, Navigation, Check, CreditCard, Wallet } from 'lucide-react'
import { orderApi } from '../services/api'

const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const order = location.state?.order

  const [paymentMethod, setPaymentMethod] = useState('balance')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  if (!order) {
    navigate('/')
    return null
  }

  const handlePayment = async () => {
    setPaying(true)
    try {
      await orderApi.pay(order.id, paymentMethod)
      setPaid(true)
    } catch (e) {
      alert('支付失败: ' + (e.response?.data?.error || '未知错误'))
    } finally {
      setPaying(false)
    }
  }

  if (paid) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>
          <Check size={48} color="#fff" />
        </div>
        <h2 style={styles.successTitle}>支付成功</h2>
        <p style={styles.successAmount}>{order.amountFormatted}</p>
        <div style={styles.successDetails}>
          <p style={styles.successItem}>骑行时长：{order.durationFormatted}</p>
          <p style={styles.successItem}>骑行距离：{order.distanceFormatted}</p>
        </div>
        <button onClick={() => navigate('/')} style={styles.backHomeBtn}>
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>还车成功</h1>
      </div>

      <div style={styles.orderCard}>
        <div style={styles.orderHeader}>
          <div style={styles.bikeIcon}>
            <Bike size={24} color="#FF6B00" />
          </div>
          <div style={styles.orderInfo}>
            <h3 style={styles.bikeCode}>{order.bikeCode || order.bike_code}</h3>
            <p style={styles.plateNumber}>{order.plateNumber || order.plate_number}</p>
          </div>
        </div>

        <div style={styles.orderStats}>
          <div style={styles.statItem}>
            <Clock size={18} color="#FF6B00" />
            <div style={styles.statText}>
              <span style={styles.statLabel}>骑行时长</span>
              <span style={styles.statValue}>{order.durationFormatted}</span>
            </div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <Navigation size={18} color="#1890FF" />
            <div style={styles.statText}>
              <span style={styles.statLabel}>骑行距离</span>
              <span style={styles.statValue}>{order.distanceFormatted}</span>
            </div>
          </div>
        </div>

        {order.priceBreakdown && order.priceBreakdown.length > 0 && (
          <div style={styles.priceBreakdown}>
            <h4 style={styles.breakdownTitle}>费用明细</h4>
            {order.priceBreakdown.map((item, index) => (
              <div key={index} style={styles.breakdownItem}>
                <span style={styles.breakdownLabel}>{item.description}</span>
                <span style={styles.breakdownAmount}>
                  {item.price > 0 ? `¥${item.price.toFixed(2)}` : '免费'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.totalRow}>
          <span style={styles.totalLabel}>应付金额</span>
          <span style={styles.totalAmount}>{order.amountFormatted}</span>
        </div>
      </div>

      <div style={styles.paymentSection}>
        <h3 style={styles.paymentTitle}>支付方式</h3>
        
        <button
          onClick={() => setPaymentMethod('balance')}
          style={{
            ...styles.paymentMethod,
            ...(paymentMethod === 'balance' ? styles.paymentMethodSelected : {})
          }}
        >
          <div style={styles.paymentMethodLeft}>
            <div style={styles.paymentIcon}>
              <Wallet size={20} color="#52C41A" />
            </div>
            <div style={styles.paymentMethodInfo}>
              <span style={styles.paymentMethodName}>余额支付</span>
              <span style={styles.paymentMethodHint}>推荐使用</span>
            </div>
          </div>
          <div style={{
            ...styles.radioDot,
            ...(paymentMethod === 'balance' ? styles.radioDotSelected : {})
          }} />
        </button>

        <button
          onClick={() => setPaymentMethod('wechat')}
          style={{
            ...styles.paymentMethod,
            ...(paymentMethod === 'wechat' ? styles.paymentMethodSelected : {})
          }}
        >
          <div style={styles.paymentMethodLeft}>
            <div style={{ ...styles.paymentIcon, backgroundColor: '#F0F9EB' }}>
              <span style={{ fontSize: 20 }}>💬</span>
            </div>
            <span style={styles.paymentMethodName}>微信支付</span>
          </div>
          <div style={{
            ...styles.radioDot,
            ...(paymentMethod === 'wechat' ? styles.radioDotSelected : {})
          }} />
        </button>

        <button
          onClick={() => setPaymentMethod('alipay')}
          style={{
            ...styles.paymentMethod,
            ...(paymentMethod === 'alipay' ? styles.paymentMethodSelected : {})
          }}
        >
          <div style={styles.paymentMethodLeft}>
            <div style={{ ...styles.paymentIcon, backgroundColor: '#E6F7FF' }}>
              <span style={{ fontSize: 20 }}>💳</span>
            </div>
            <span style={styles.paymentMethodName}>支付宝</span>
          </div>
          <div style={{
            ...styles.radioDot,
            ...(paymentMethod === 'alipay' ? styles.radioDotSelected : {})
          }} />
        </button>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerLeft}>
          <span style={styles.footerLabel}>合计</span>
          <span style={styles.footerAmount}>{order.amountFormatted}</span>
        </div>
        <button
          onClick={handlePayment}
          disabled={paying}
          style={{
            ...styles.payBtn,
            ...(paying ? styles.payBtnDisabled : {})
          }}
        >
          {paying ? '支付中...' : '立即支付'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#fff',
    padding: '40px 20px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  orderHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  bikeIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  bikeCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  plateNumber: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  orderStats: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 0',
    borderTop: '1px solid #f0f0f0',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  statText: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e0e0e0',
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingVertical: 8,
    fontSize: 13,
    color: '#666',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
  },
  breakdownAmount: {
    fontSize: 13,
    color: '#333',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px dashed #e0e0e0',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  paymentSection: {
    backgroundColor: '#fff',
    margin: '0 16px',
    borderRadius: 16,
    padding: 16,
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethod: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
    marginBottom: 10,
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  paymentMethodSelected: {
    backgroundColor: '#FFF7E6',
    borderColor: '#FF6B00',
  },
  paymentMethodLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#F6FFED',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  paymentMethodHint: {
    fontSize: 11,
    color: '#52C41A',
    marginTop: 2,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid #d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotSelected: {
    borderColor: '#FF6B00',
  },
  footer: {
    backgroundColor: '#fff',
    padding: '16px 20px',
    paddingBottom: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    borderTop: '1px solid #f0f0f0',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  footerLabel: {
    fontSize: 14,
    color: '#666',
  },
  footerAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  payBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
  },
  payBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  successContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#52C41A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 24,
  },
  successDetails: {
    marginBottom: 40,
  },
  successItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  backHomeBtn: {
    width: '80%',
    height: 50,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 25,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
  },
}

export default PaymentPage
