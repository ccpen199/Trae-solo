import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Flashlight, HelpCircle, QrCode, Clock, AlertTriangle } from 'lucide-react'
import { bikeApi } from '../services/api'
import { useBikeStore } from '../store'

const ScanPage = () => {
  const navigate = useNavigate()
  const { selectBike } = useBikeStore()
  const [flashOn, setFlashOn] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const countdownRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCountdown(30)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 1000)

    return () => {
      clearTimeout(timer)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const handleScan = async (code) => {
    setLoading(true)
    setError('')

    try {
      const res = await bikeApi.getByCode(code)
      const bike = res.data.bike

      if (!bike.canRide) {
        setError(bike.unavailableReason || '车辆不可用')
        return
      }

      selectBike(bike)
      navigate('/unlock', { state: { bike } })
    } catch (e) {
      setError(e.response?.data?.error || '扫码失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleManualInput = async () => {
    if (!plateNumber.trim()) {
      setError('请输入车牌号')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await bikeApi.getByPlate(plateNumber.toUpperCase())
      const bike = res.data.bike

      if (!bike.canRide) {
        setError(bike.unavailableReason || '车辆不可用')
        return
      }

      selectBike(bike)
      navigate('/unlock', { state: { bike } })
    } catch (e) {
      setError(e.response?.data?.error || '未找到该车辆，请检查车牌号')
    } finally {
      setLoading(false)
    }
  }

  const mockScan = () => {
    const sampleCodes = ['JT001', 'JT002', 'JT007', 'JT008']
    const randomCode = sampleCodes[Math.floor(Math.random() * sampleCodes.length)]
    handleScan(randomCode)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" />
        </button>
        <h1 style={styles.title}>扫码用车</h1>
        <button
          onClick={() => setFlashOn(!flashOn)}
          style={styles.iconBtn}
        >
          <Flashlight 
            size={24} 
            color={flashOn ? '#FF6B00' : '#fff'} 
          />
        </button>
      </div>

      <div style={styles.scanArea}>
        <div style={styles.scanFrame}>
          <div style={styles.cornerTopLeft} />
          <div style={styles.cornerTopRight} />
          <div style={styles.cornerBottomLeft} />
          <div style={styles.cornerBottomRight} />
          <div style={{
            ...styles.scanLine,
            animation: 'scanMove 2s ease-in-out infinite'
          }} />
        </div>

        <button onClick={mockScan} style={styles.mockScanBtn}>
          <QrCode size={20} color="#fff" />
          <span>模拟扫码</span>
        </button>
      </div>

      {countdown > 0 && !showManual && (
        <div style={styles.hintCard}>
          <Clock size={16} color="#FF6B00" />
          <span style={styles.hintText}>
            扫码失败？{countdown}秒后可手动输入车牌号
          </span>
        </div>
      )}

      {(countdown === 0 || showManual) && (
        <div style={styles.manualPanel}>
          <h3 style={styles.manualTitle}>手动输入车牌号</h3>
          <div style={styles.inputRow}>
            <input
              type="text"
              placeholder="如：京A00001"
              value={plateNumber}
              onChange={e => setPlateNumber(e.target.value.toUpperCase())}
              style={styles.plateInput}
              maxLength={8}
            />
            <button
              onClick={handleManualInput}
              disabled={loading || !plateNumber}
              style={{
                ...styles.confirmBtn,
                ...(!plateNumber ? styles.confirmBtnDisabled : {})
              }}
            >
              {loading ? '查询中...' : '确认'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.errorCard}>
          <AlertTriangle size={16} color="#FF4D4F" />
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      <div style={styles.helpPanel}>
        <button onClick={() => navigate('/help')} style={styles.helpBtn}>
          <HelpCircle size={18} color="#FF6B00" />
          <span style={styles.helpText}>使用说明</span>
        </button>
      </div>

      <style>{`
        @keyframes scanMove {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#fff',
  },
  iconBtn: {
    padding: 4,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  scanArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTop: '4px solid #FF6B00',
    borderLeft: '4px solid #FF6B00',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTop: '4px solid #FF6B00',
    borderRight: '4px solid #FF6B00',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottom: '4px solid #FF6B00',
    borderLeft: '4px solid #FF6B00',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottom: '4px solid #FF6B00',
    borderRight: '4px solid #FF6B00',
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#FF6B00',
    boxShadow: '0 0 10px rgba(255,107,0,0.8)',
  },
  mockScanBtn: {
    marginTop: 30,
    padding: '12px 24px',
    backgroundColor: 'rgba(255,107,0,0.2)',
    color: '#FF6B00',
    border: '1px solid #FF6B00',
    borderRadius: 20,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hintCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,247,230,0.95)',
    margin: '0 20px 10px',
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#FF6B00',
  },
  manualPanel: {
    backgroundColor: '#fff',
    margin: '0 20px 10px',
    padding: 16,
    borderRadius: 12,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  inputRow: {
    display: 'flex',
    gap: 12,
  },
  plateInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F7F8FA',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 16,
    outline: 'none',
  },
  confirmBtn: {
    width: 80,
    height: 44,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  errorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F0',
    margin: '0 20px 10px',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#FF4D4F',
  },
  helpPanel: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  helpBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#FF6B00',
    fontSize: 14,
  },
  helpText: {
    textDecoration: 'underline',
  },
}

export default ScanPage
