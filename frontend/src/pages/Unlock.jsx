import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Bike, MapPin, Zap, Clock, Info, Lock, Unlock } from 'lucide-react'
import { bikeApi, orderApi } from '../services/api'
import { useOrderStore } from '../store'

const UnlockPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setActiveOrder } = useOrderStore()
  const bike = location.state?.bike

  const [pricing, setPricing] = useState(null)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bike) {
      navigate('/')
      return
    }
    loadPricing()
  }, [bike])

  const loadPricing = async () => {
    try {
      const res = await bikeApi.getPricing()
      setPricing(res.data.pricing)
    } catch (e) {
      console.error('Failed to load pricing:', e)
    }
  }

  const handleUnlock = async () => {
    if (!bike) return

    setUnlocking(true)
    setError('')

    try {
      const res = await orderApi.create(bike.id, bike.latitude, bike.longitude)
      const order = res.data.order
      
      setActiveOrder(order)
      navigate('/riding')
    } catch (e) {
      setError(e.response?.data?.error || '开锁失败，请重试')
    } finally {
      setUnlocking(false)
    }
  }

  if (!bike) return null

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={styles.title}>开锁确认</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.content}>
        <div style={styles.bikeCard}>
          <div style={styles.bikeHeader}>
            <div style={styles.bikeIcon}>
              <Bike size={32} color="#FF6B00" />
            </div>
            <div style={styles.bikeInfo}>
              <h2 style={styles.bikeCode}>{bike.bike_code}</h2>
              <p style={styles.plateNumber}>{bike.plate_number}</p>
            </div>
          </div>

          <div style={styles.statusRow}>
            <div style={styles.statusItem}>
              <Zap size={18} color={bike.battery < 30 ? '#FAAD14' : '#52C41A'} />
              <span style={styles.statusText}>
                电量 {bike.battery}%
              </span>
            </div>
            <div style={styles.statusDivider} />
            <div style={styles.statusItem}>
              <MapPin size={18} color="#1890FF" />
              <span style={styles.statusText}>
                可骑行约 {Math.round(bike.max_range * (bike.battery / 100))} 公里
              </span>
            </div>
          </div>

          <div style={styles.batteryBar}>
            <div 
              style={{
                ...styles.batteryFill,
                width: `${bike.battery}%`,
                backgroundColor: bike.battery < 30 ? '#FAAD14' : '#52C41A'
              }}
            />
          </div>
        </div>

        {error && (
          <div style={styles.errorCard}>
            <Info size={16} color="#FF4D4F" />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>还车点</h3>
          <div style={styles.parkingList}>
            <div style={styles.parkingItem}>
              <MapPin size={16} color="#1890FF" />
              <span style={styles.parkingName}>国贸地铁A口</span>
              <span style={styles.parkingDist}>约500米</span>
            </div>
            <div style={styles.parkingItem}>
              <MapPin size={16} color="#1890FF" />
              <span style={styles.parkingName}>王府井大街南</span>
              <span style={styles.parkingDist}>约1.2公里</span>
            </div>
          </div>
        </div>

        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>计费规则</h3>
          {pricing ? (
            <>
              <p style={styles.pricingDesc}>{pricing.description}</p>
              <div style={styles.pricingDetail}>
                <Clock size={14} color="#999" />
                <span style={styles.pricingNote}>
                  免费保护时间 {pricing.freeProtectionMinutes} 分钟
                </span>
              </div>
            </>
          ) : (
            <p style={styles.pricingDesc}>起步价2元（30分钟），超时后每30分钟1元</p>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <button
          onClick={handleUnlock}
          disabled={unlocking || bike.battery < 20}
          style={{
            ...styles.unlockBtn,
            ...((unlocking || bike.battery < 20) ? styles.unlockBtnDisabled : {})
          }}
        >
          {unlocking ? (
            <>
              <div style={styles.spinner} />
              <span>开锁中...</span>
            </>
          ) : bike.battery < 20 ? (
            <>
              <Lock size={20} />
              <span>电量不足，无法开锁</span>
            </>
          ) : (
            <>
              <Unlock size={20} />
              <span>立即开锁</span>
            </>
          )}
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
    overflowY: 'auto',
  },
  bikeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  bikeHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  bikeIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  plateNumber: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusItem: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#666',
  },
  statusText: {
    fontSize: 14,
  },
  statusDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    margin: '0 16px',
  },
  batteryBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#FF4D4F',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  parkingList: {
    gap: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  parkingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  parkingName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  parkingDist: {
    fontSize: 12,
    color: '#999',
  },
  pricingDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.5,
  },
  pricingDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #f0f0f0',
  },
  pricingNote: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
  },
  unlockBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 27,
    fontSize: 18,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unlockBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}

export default UnlockPage
