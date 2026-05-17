import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../api/client'
import useUserStore from '../store/userStore'
import Loading from '../components/Loading'

export default function HomePage() {
  const { currentUser } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [currentUser.id])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await usersAPI.getStats(currentUser.id)
      setStats(result.data)
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchStats}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">欢迎回来，{stats?.user?.name} 👋</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: '#f0f2ff', borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#667eea' }}>
              {stats?.week_stats?.total_duration || 0}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>本周运动(分钟)</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: '#fff0f0', borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#e74c3c' }}>
              {Math.round(stats?.week_stats?.total_calories || 0)}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>本周消耗(千卡)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">快捷入口</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Link to="/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
              <div style={{ fontWeight: 500 }}>开始课程</div>
            </div>
          </Link>
          <Link to="/challenges" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 20, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: 12, textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              <div style={{ fontWeight: 500 }}>参与挑战</div>
            </div>
          </Link>
          <Link to="/rankings" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 20, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: 12, textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 500 }}>查看排行</div>
            </div>
          </Link>
          <Link to="/friends" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: 20, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', borderRadius: 12, textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍⚕️</div>
              <div style={{ fontWeight: 500 }}>康复教练</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">累计数据</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
              {stats?.user?.total_duration || 0}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>总时长(分钟)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
              {Math.round(stats?.user?.total_calories || 0)}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>总消耗(千卡)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>
              Lv.{stats?.user?.level || 1}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>等级</div>
          </div>
        </div>
      </div>
    </div>
  )
}
