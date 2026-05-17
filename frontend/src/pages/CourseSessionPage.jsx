import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { coursesAPI } from '../api/client'
import { useToast } from '../contexts/ToastContext'
import Loading from '../components/Loading'

export default function CourseSessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(0)
  const [heartRate, setHeartRate] = useState(0)
  const [calories, setCalories] = useState(0)
  const [deviceConnected, setDeviceConnected] = useState(false)
  const [ending, setEnding] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    fetchSession()
    const timer = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [id])

  useEffect(() => {
    if (session?.device_connected && deviceConnected) {
      const heartRateTimer = setInterval(() => {
        setHeartRate(Math.floor(100 + Math.random() * 50))
        setCalories(c => c + Math.random() * 0.5)
      }, 1000)

      return () => clearInterval(heartRateTimer)
    }
  }, [session, deviceConnected])

  useEffect(() => {
    if (duration > 0 && session) {
      coursesAPI.updateSession({
        session_id: id,
        duration,
        heart_rate: deviceConnected ? heartRate : undefined,
        calories: deviceConnected ? calories : undefined
      }).catch(console.error)
    }
  }, [duration, heartRate, calories, deviceConnected, id, session])

  const fetchSession = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await coursesAPI.getSession(id)
      setSession(result.data)
      setDeviceConnected(result.data.device_connected)
      setDuration(result.data.total_duration || 0)
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const endSession = async () => {
    try {
      setEnding(true)
      await coursesAPI.endSession({ session_id: id })
      showToast('课程已完成！', 'success')
      navigate('/')
    } catch (err) {
      showToast('结束课程失败', 'error')
    } finally {
      setEnding(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchSession}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
          {deviceConnected ? '📱 设备已连接' : '📴 设备未连接'}
        </div>
        <div style={{ fontSize: 48, fontWeight: 'bold', color: '#333', marginBottom: 20 }}>
          {formatTime(duration)}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card-title">实时数据</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 20, background: deviceConnected ? '#e3f2fd' : '#f5f5f5', borderRadius: 12 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>❤️ 心率</div>
            {deviceConnected ? (
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1976d2' }}>
                {heartRate}
                <span style={{ fontSize: 14 }}> bpm</span>
              </div>
            ) : (
              <div style={{ fontSize: 16, color: '#999' }}>--</div>
            )}
          </div>
          <div style={{ textAlign: 'center', padding: 20, background: deviceConnected ? '#ffebee' : '#f5f5f5', borderRadius: 12 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>🔥 卡路里</div>
            {deviceConnected ? (
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#e53935' }}>
                {Math.round(calories)}
                <span style={{ fontSize: 14 }}> kcal</span>
              </div>
            ) : (
              <div style={{ fontSize: 16, color: '#999' }}>--</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">设备控制</h3>
        <div style={{ marginBottom: 16 }}>
          <button
            className={deviceConnected ? 'button' : 'button button-outline'}
            style={{ width: '100%', marginBottom: 12 }}
            onClick={() => setDeviceConnected(!deviceConnected)}
          >
            {deviceConnected ? '✅ 模拟设备已连接' : '🔌 点击模拟连接设备'}
          </button>
          {!deviceConnected && (
            <p style={{ fontSize: 12, color: '#f59e0b', textAlign: 'center' }}>
              ⚠️ 未连接设备时无法显示心率和卡路里数据
            </p>
          )}
        </div>
        <button
          className="button"
          style={{ width: '100%', background: '#e53935' }}
          onClick={endSession}
          disabled={ending}
        >
          {ending ? '结束中...' : '⏹️ 结束课程'}
        </button>
      </div>
    </div>
  )
}
