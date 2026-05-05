import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, CreditCard, History, HelpCircle, LogOut, ChevronRight, Shield, Zap, Wallet } from 'lucide-react'
import { useAuthStore, useOrderStore } from '../store'
import { userApi, authApi } from '../services/api'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout, token } = useAuthStore()
  const { clearOrder } = useOrderStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await userApi.getOrders('all')
      setOrders(res.data.orders || [])
    } catch (e) {
      console.error('Failed to load orders:', e)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout failed:', e)
    }
    logout()
    clearOrder()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={styles.title}>我的</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.userCard}>
        <div style={styles.avatar}>
          <User size={36} color="#FF6B00" />
        </div>
        <div style={styles.userInfo}>
          <h2 style={styles.nickname}>{user?.nickname || '用户'}</h2>
          <p style={styles.phone}>
            {user?.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''}
          </p>
          <div style={styles.statusBadges}>
            {user?.isVerified && (
              <span style={styles.statusBadge}>
                <Shield size={12} color="#52C41A" />
                <span>已实名</span>
              </span>
            )}
            {user?.hasDeposit && (
              <span style={styles.statusBadge}>
                <Wallet size={12} color="#FF6B00" />
                <span>已交押金</span>
              </span>
            )}
            {user?.creditAuthorized && (
              <span style={{
                ...styles.statusBadge,
                backgroundColor: user?.creditScore >= 650 ? '#E6F7FF' : '#FFFBE6',
              }}>
                <Zap size={12} color={user?.creditScore >= 650 ? '#1890FF' : '#FAAD14'} />
                <span>信用分 {user?.creditScore}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.menuList}>
        <div style={styles.menuSection}>
          <h3 style={styles.menuSectionTitle}>我的服务</h3>
          
          <button 
            onClick={() => navigate('/deposit')}
            style={styles.menuItem}
          >
            <div style={styles.menuLeft}>
              <div style={{ ...styles.menuIcon, backgroundColor: '#FFF7E6' }}>
                <CreditCard size={20} color="#FF6B00" />
              </div>
              <span style={styles.menuLabel}>押金管理</span>
            </div>
            <ChevronRight size={18} color="#ccc" />
          </button>

          <button 
            onClick={() => {}}
            style={styles.menuItem}
          >
            <div style={styles.menuLeft}>
              <div style={{ ...styles.menuIcon, backgroundColor: '#E6F7FF' }}>
                <History size={20} color="#1890FF" />
              </div>
              <span style={styles.menuLabel}>骑行记录</span>
            </div>
            <ChevronRight size={18} color="#ccc" />
          </button>
        </div>

        <div style={styles.menuSection}>
          <h3 style={styles.menuSectionTitle}>帮助与反馈</h3>
          
          <button 
            onClick={() => navigate('/help')}
            style={styles.menuItem}
          >
            <div style={styles.menuLeft}>
              <div style={{ ...styles.menuIcon, backgroundColor: '#F6FFED' }}>
                <HelpCircle size={20} color="#52C41A" />
              </div>
              <span style={styles.menuLabel}>帮助中心</span>
            </div>
            <ChevronRight size={18} color="#ccc" />
          </button>
        </div>

        {orders.length > 0 && (
          <div style={styles.menuSection}>
            <h3 style={styles.menuSectionTitle}>最近订单</h3>
            {orders.slice(0, 3).map(order => (
              <div key={order.id} style={styles.orderItem}>
                <div style={styles.orderLeft}>
                  <div style={styles.orderIcon}>
                    <BikeSimple size={20} color="#FF6B00" />
                  </div>
                  <div style={styles.orderInfo}>
                    <p style={styles.orderTime}>
                      {new Date(order.start_time).toLocaleDateString('zh-CN')}
                    </p>
                    <p style={styles.orderDetail}>
                      {order.durationFormatted} · {order.distance || '--'}公里
                    </p>
                  </div>
                </div>
                <span style={{
                  ...styles.orderStatus,
                  color: order.payment_status === 'paid' ? '#52C41A' : '#FF6B00',
                }}>
                  {order.payment_status === 'paid' ? order.amountFormatted : '待支付'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color="#FF4D4F" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}

const BikeSimple = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M10 14l2-4 4.5 3.5" />
  </svg>
)

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    paddingTop: 40,
    borderBottom: '1px solid #f0f0f0',
  },
  backBtn: {
    padding: 4,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  userCard: {
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    backgroundColor: '#FFF7E6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  statusBadges: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    backgroundColor: '#F6FFED',
    borderRadius: 4,
    fontSize: 11,
    color: '#52C41A',
  },
  menuList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuSectionTitle: {
    fontSize: 13,
    color: '#999',
    padding: '12px 16px',
    paddingBottom: 8,
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderTop: '1px solid #f0f0f0',
  },
  menuLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    color: '#333',
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderTop: '1px solid #f0f0f0',
  },
  orderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF7E6',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  orderTime: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  orderDetail: {
    fontSize: 12,
    color: '#999',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
  },
  logoutBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFF2F0',
    color: '#FF4D4F',
    border: 'none',
    borderRadius: 24,
    fontSize: 15,
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}

export default ProfilePage
