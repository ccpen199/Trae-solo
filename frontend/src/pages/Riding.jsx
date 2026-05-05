import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Zap, Clock, Navigation, AlertTriangle, MapPin, Lock } from 'lucide-react'
import { orderApi } from '../services/api'
import { useOrderStore } from '../store'

const RidingPage = () => {
  const navigate = useNavigate()
  const { activeOrder, clearOrder, updateOrder } = useOrderStore()
  const [duration, setDuration] = useState(0)
  const [currentAmount, setCurrentAmount] = useState(0)
  const [baseDistance] = useState(1.5)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState('')
  const [showLowBatteryAlert, setShowLowBatteryAlert] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!activeOrder) {
      navigate('/')
      return
    }

    const startDate = new Date(activeOrder.startTime || activeOrder.start_time)
    const updateTimer = () => {
      const now = new Date()
      const diff = now - startDate
      const minutes = Math.floor(diff / 60000)
      setDuration(minutes)

      const basePrice = 2
      const additionalPrice = 1
      let amount = basePrice
      if (minutes > 30) {
        const additional = Math.ceil((minutes - 30) / 30)
        amount += additional * additionalPrice
      }
      if (amount > 30) amount = 30
      setCurrentAmount(amount)
    }

    updateTimer()
    timerRef.current = setInterval(updateTimer, 60000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeOrder])

  useEffect(() => {
    if (activeOrder?.battery < 20) {
      setShowLowBatteryAlert(true)
    }
  }, [activeOrder])

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  const handleEndRide = async () => {
    if (!activeOrder) return

    setEnding(true)
    setError('')

    try {
      const res = await orderApi.end(activeOrder.id, 39.9042, 116.4074)
      clearOrder()
      navigate('/payment', { state: { order: res.data.order } })
    } catch (e) {
      setError(e.response?.data?.error || '还车失败，请重试')
    } finally {
      setEnding(false)
    }
  }

  const handleAutoEnd = async (reason) => {
    if (!activeOrder) return
    try {
      await orderApi.autoEnd(activeOrder.id, reason)
      clearOrder()
      alert('系统已自动还车')
      navigate('/')
    } catch (e) {
      console.error('Auto end failed:', e)
    }
  }

  if (!activeOrder) return null

  return (
    <div style={styles.container}>
      <div style={styles.ridingHeader}>
        <div style={styles.ridingIndicator}>
          <div style={styles.ridingDot} />
          <span style={styles.ridingText}>骑行中</span>
        </div>
        <div style={styles.bikeInfo}>
          <Bike size={18} color="#fff" />
          <span style={styles.bikeCode}>{activeOrder.bikeCode || activeOrder.bike_code}</span>
        </div>
      </div>

      <div style={styles.mapPlaceholder}>
        <div style={styles.routeLine}>
          <div style={styles.startPoint}>
            <MapPin size={20} color="#52C41A" />
          </div>
          <div style={styles.routePath} />
          <div style={styles.currentPoint}>
            <Navigation size={24} color="#FF6B00" style={{ transform: 'rotate(45deg)' }} />
          </div>
        </div>
      </div>

      {showLowBatteryAlert && (
        <div style={styles.alertCard}>
          <AlertTriangle size={20} color="#FAAD14" />
          <div style={styles.alertContent}>
            <p style={styles.alertTitle}>电量不足提醒</p>
            <p style={styles.alertDesc}>
              当前车辆电量过低，请尽快还车。剩余电量不足时系统将自动还车。
            </p>
          </div>
          <button
            onClick={() => setShowLowBatteryAlert(false)}
            style={styles.alertClose}
          >
            ×
          </button>
        </div>
      )}

      <div style={styles.statsPanel}>
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <Clock size={20} color="#FF6B00" />
            <span style={styles.statValue}>{formatDuration(duration)}</span>
            <span style={styles.statLabel}>骑行时长</span>
          </div>
          <div style={styles.statCard}>
            <Navigation size={20} color="#1890FF" />
            <span style={styles.statValue}>{(baseDistance + duration * 0.2).toFixed(1)}km</span>
            <span style={styles.statLabel}>骑行距离</span>
          </div>
        </div>

        <div style={styles.detailsRow}>
          <div style={styles.detailItem}>
            <Zap size={16} color={activeOrder.battery < 30 ? '#FAAD14' : '#52C41A'} />
            <span style={styles.detailText}>
              电量 {activeOrder.battery}% · 可骑行约 {Math.round((activeOrder.availableRange || 40) * (activeOrder.battery / 100))} 公里
            </span>
          </div>
        </div>

        <div style={styles.amountRow}>
          <span style={styles.amountLabel}>当前费用</span>
          <span style={styles.amountValue}>¥{currentAmount.toFixed(2)}</span>
        </div>

        {error && (
          <div style={styles.errorMsg}>
            <AlertTriangle size={14} color="#FF4D4F" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleEndRide}
          disabled={ending}
          style={{
            ...styles.endBtn,
            ...(ending ? styles.endBtnDisabled : {})
          }}
        >
          {ending ? (
            <>
              <div style={styles.spinner} />
              <span>还车中...</span>
            </>
          ) : (
            <>
              <Lock size={22} />
              <span>还车</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  ridingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '40px 20px 20px',
    background: 'linear-gradient(180deg, rgba(255,107,0,0.9) 0%, transparent 100%)',
  },
  ridingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  ridingDot: {
    width: 10,
    height: 10,
    backgroundColor: '#52C41A',
    borderRadius: '50%',
    animation: 'blink 1s ease-in-out infinite',
    boxShadow: '0 0 8px rgba(82,196,26,0.6)',
  },
  ridingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bikeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '6px 12px',
    borderRadius: 16,
  },
  bikeCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  mapPlaceholder: {
    flex: 1,
    background: 'linear-gradient(180deg, #E8F4FD 0%, #D5E8F5 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLine: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  startPoint: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(82,196,26,0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePath: {
    width: 4,
    height: 80,
    background: 'linear-gradient(180deg, #52C41A 0%, #FF6B00 100%)',
    borderRadius: 2,
  },
  currentPoint: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,107,0,0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  alertCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#FFFBE6',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    gap: 12,
    zIndex: 5,
    border: '1px solid #FFE58F',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FA8C16',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 12,
    color: '#FA8C16',
    lineHeight: 1.5,
  },
  alertClose: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 18,
    color: '#FAAD14',
    cursor: 'pointer',
  },
  statsPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  },
  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  detailsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    marginBottom: 16,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#666',
  },
  detailText: {
    fontSize: 13,
  },
  amountRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: '12px 0',
    borderTop: '1px solid #f0f0f0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  errorMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF2F0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    color: '#FF4D4F',
  },
  endBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF4D4F',
    color: '#fff',
    border: 'none',
    borderRadius: 28,
    fontSize: 18,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  endBtnDisabled: {
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

export default RidingPage
