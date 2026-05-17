import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { coursesAPI } from '../api/client'
import useUserStore from '../store/userStore'
import { useToast } from '../contexts/ToastContext'
import Loading from '../components/Loading'

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useUserStore()
  const { showToast } = useToast()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deviceConnected, setDeviceConnected] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await coursesAPI.getById(id)
      setCourse(result.data)
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const startCourse = async () => {
    try {
      setStarting(true)
      const result = await coursesAPI.startSession({
        user_id: currentUser.id,
        course_id: id,
        device_connected: deviceConnected
      })

      showToast('课程开始！', 'success')
      navigate(`/courses/session/${result.data.session_id}`)
    } catch (err) {
      showToast('开始课程失败', 'error')
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchCourse}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginRight: 12 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: 20 }}>{course?.title}</h2>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>{course?.description}</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#999', fontSize: 12 }}>时长</span>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{course?.duration} 分钟</div>
            </div>
            <div>
              <span style={{ color: '#999', fontSize: 12 }}>预计消耗</span>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{course?.duration * course?.calories_per_minute} 千卡</div>
            </div>
            <div>
              <span style={{ color: '#999', fontSize: 12 }}>教练</span>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{course?.instructor}</div>
            </div>
          </div>
        </div>

        {course?.is_rehabilitation && (
          <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, color: '#1976d2' }}>🏥 运动康复课程</div>
            <div style={{ fontSize: 13, color: '#666' }}>{course?.medical_guidance}</div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>智能设备连接</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className={deviceConnected ? 'button' : 'button button-outline'}
              style={{ flex: 1 }}
              onClick={() => setDeviceConnected(true)}
            >
              ✅ 已连接
            </button>
            <button
              className={!deviceConnected ? 'button' : 'button button-outline'}
              style={{ flex: 1 }}
              onClick={() => setDeviceConnected(false)}
            >
              ❌ 未连接
            </button>
          </div>
          {!deviceConnected && (
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
              ⚠️ 未连接设备时仅记录运动时长，不显示心率和卡路里数据
            </div>
          )}
        </div>

        <button
          className="button"
          style={{ width: '100%', fontSize: 16, padding: 14 }}
          onClick={startCourse}
          disabled={starting}
        >
          {starting ? '开始中...' : '🚀 开始课程'}
        </button>
      </div>
    </div>
  )
}
