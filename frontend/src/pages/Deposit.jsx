import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, CreditCard, Check, Shield, AlertTriangle, User } from 'lucide-react'
import { userApi } from '../services/api'
import { useAuthStore } from '../store'

const DepositPage = () => {
  const navigate = useNavigate()
  const { user, updateOnboarding, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [creditLoading, setCreditLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const res = await userApi.getOnboardingStatus()
      setStatus(res.data)
      
      if (res.data.canRide) {
        navigate('/')
      }
    } catch (e) {
      console.error('Failed to load status:', e)
    }
  }

  const handlePayDeposit = async () => {
    setLoading(true)
    setError('')

    try {
      await userApi.payDeposit(299)
      updateUser({ hasDeposit: true })
      updateOnboarding({ hasDeposit: true, canRide: true })
      setShowSuccess('deposit')
      
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (e) {
      setError(e.response?.data?.error || '缴纳押金失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreditAuth = async () => {
    setCreditLoading(true)
    setError('')

    try {
      const res = await userApi.authCredit()
      const { creditScore, eligible } = res.data
      
      updateUser({ creditAuthorized: true, creditScore })
      updateOnboarding({ 
        creditAuthorized: true, 
        creditScore,
        canRide: eligible
      })

      if (eligible) {
        setShowSuccess('credit')
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        setStatus(prev => ({ ...prev, creditScore, creditAuthorized: true }))
      }
    } catch (e) {
      setError(e.response?.data?.error || '授权失败')
    } finally {
      setCreditLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div style={successStyles.container}>
        <div style={successStyles.icon}>
          <Check size={48} color="#fff" />
        </div>
        <h2 style={successStyles.title}>
          {showSuccess === 'deposit' ? '押金缴纳成功' : '免押授权成功'}
        </h2>
        <p style={successStyles.desc}>正在进入首页...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={styles.title}>押金与免押</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.content}>
        {status?.creditAuthorized && !status.canRide && (
          <div style={styles.warningCard}>
            <AlertTriangle size={20} color="#FAAD14" />
            <div style={styles.warningText}>
              <p style={styles.warningTitle}>信用分不足</p>
              <p style={styles.warningDesc}>您的信用分 {status.creditScore} 分，需达到 650 分才能免押骑行，建议缴纳押金</p>
            </div>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <AlertTriangle size={16} color="#FF4D4F" />
            <span>{error}</span>
          </div>
        )}

        <div 
          style={{
            ...styles.card,
            ...(status?.hasDeposit ? styles.cardSelected : {})
          }}
        >
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <Wallet size={24} color="#FF6B00" />
            </div>
            <div style={styles.cardTitle}>
              <h3>缴纳押金</h3>
              <p style={styles.cardSubtitle}>可随时申请退还</p>
            </div>
            {status?.hasDeposit && (
              <div style={styles.checkBadge}>
                <Check size={14} color="#fff" />
              </div>
            )}
          </div>
          <div style={styles.cardPrice}>
            <span style={styles.currency}>¥</span>
            <span style={styles.price}>299</span>
          </div>
          {!status?.hasDeposit ? (
            <button
              onClick={handlePayDeposit}
              disabled={loading}
              style={styles.cardBtn}
            >
              {loading ? '处理中...' : '立即缴纳'}
            </button>
          ) : (
            <div style={styles.alreadyDone}>
              <Check size={16} color="#52C41A" />
              <span>已缴纳押金</span>
            </div>
          )}
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>或</span>
        </div>

        <div 
          style={{
            ...styles.card,
            ...(status?.creditAuthorized && status?.canRide ? styles.cardSelected : {})
          }}
        >
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <CreditCard size={24} color="#1890FF" />
            </div>
            <div style={styles.cardTitle}>
              <h3>芝麻信用免押</h3>
              <p style={styles.cardSubtitle}>650分及以上可免押金</p>
            </div>
            {status?.creditAuthorized && status?.canRide && (
              <div style={styles.checkBadge}>
                <Check size={14} color="#fff" />
              </div>
            )}
          </div>
          
          {status?.creditAuthorized ? (
            <div style={styles.creditScore}>
              <div style={styles.scoreLabel}>信用分</div>
              <div style={styles.scoreValue}>{status.creditScore}</div>
              <div style={styles.scoreStatus}>
                {status.creditScore >= 650 ? (
                  <><Check size={14} color="#52C41A" /> 已达标</>
                ) : (
                  <><Shield size={14} color="#FAAD14" /> 未达标</>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.creditHint}>
              <User size={48} color="#E8E8E8" />
              <p style={styles.creditHintText}>授权后查看信用分</p>
            </div>
          )}

          {!status?.creditAuthorized ? (
            <button
              onClick={handleCreditAuth}
              disabled={creditLoading}
              style={{ ...styles.cardBtn, ...styles.creditBtn }}
            >
              {creditLoading ? '授权中...' : '立即授权'}
            </button>
          ) : status.canRide ? (
            <div style={styles.alreadyDone}>
              <Check size={16} color="#52C41A" />
              <span>已授权免押</span>
            </div>
          ) : (
            <button
              onClick={handleCreditAuth}
              disabled={creditLoading}
              style={styles.retryBtn}
            >
              {creditLoading ? '刷新中...' : '重新授权'}
            </button>
          )}
        </div>

        <div style={styles.agreement}>
          <p style={styles.agreementText}>
            继续即表示同意
            <span style={styles.link}>《押金服务协议》</span>
            和
            <span style={styles.link}>《信用授权协议》</span>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F7F8FA',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
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
  content: {
    flex: 1,
    padding: 20,
  },
  warningCard: {
    backgroundColor: '#FFFBE6',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FA8C16',
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 12,
    color: '#FA8C16',
    lineHeight: 1.5,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF2F0',
    color: '#FF4D4F',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    border: '2px solid transparent',
  },
  cardSelected: {
    borderColor: '#FF6B00',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    backgroundColor: '#52C41A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPrice: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  currency: {
    fontSize: 18,
    color: '#FF6B00',
    fontWeight: '600',
  },
  price: {
    fontSize: 36,
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  cardBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
  },
  creditBtn: {
    backgroundColor: '#1890FF',
  },
  retryBtn: {
    width: '100%',
    height: 44,
    backgroundColor: 'transparent',
    color: '#1890FF',
    border: '1px solid #1890FF',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
  },
  alreadyDone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#F6FFED',
    borderRadius: 10,
    color: '#52C41A',
    fontSize: 14,
    fontWeight: '500',
  },
  creditScore: {
    textAlign: 'center',
    padding: '16px 0',
    marginBottom: 16,
    backgroundColor: '#F8FBFF',
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1890FF',
    marginBottom: 8,
  },
  scoreStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 13,
    color: '#666',
  },
  creditHint: {
    textAlign: 'center',
    padding: '20px 0',
    marginBottom: 16,
  },
  creditHintText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    padding: '0 16px',
  },
  agreement: {
    marginTop: 24,
  },
  agreementText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  link: {
    color: '#FF6B00',
  },
}

const successStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    backgroundColor: '#52C41A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#999',
  },
}

export default DepositPage
