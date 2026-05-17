import { useState, useEffect } from 'react'
import { coachesAPI } from '../api/client'
import { useToast } from '../contexts/ToastContext'
import Loading from '../components/Loading'
import Empty from '../components/Empty'

export default function FriendsPage() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('rehabilitation')
  const [followingIds, setFollowingIds] = useState(() => {
    try {
      const saved = localStorage.getItem('followedCoaches')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })
  const { showToast } = useToast()

  useEffect(() => {
    fetchCoaches()
  }, [activeTab])

  const fetchCoaches = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = activeTab === 'rehabilitation'
        ? await coachesAPI.getRehabilitation()
        : await coachesAPI.getAll()
      setCoaches(result.data || [])
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const followCoach = async (coach) => {
    if (followingIds.has(coach.id)) {
      showToast('您已经关注过该教练', 'info')
      return
    }
    
    try {
      const newFollowingIds = new Set([...followingIds, coach.id])
      setFollowingIds(newFollowingIds)
      localStorage.setItem('followedCoaches', JSON.stringify([...newFollowingIds]))
      
      await coachesAPI.follow(coach.id)
      setCoaches(prev => prev.map(c =>
        c.id === coach.id ? { ...c, followers: c.followers + 1 } : c
      ))
      showToast(`已关注 ${coach.name}`, 'success')
    } catch (err) {
      console.error('Follow error:', err)
      setFollowingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(coach.id)
        localStorage.setItem('followedCoaches', JSON.stringify([...newSet]))
        return newSet
      })
      const errorMsg = err.response?.data?.message || err.message || '网络错误'
      showToast(`关注失败: ${errorMsg}`, 'error')
    }
  }

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchCoaches}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22 }}>👥 教练</h2>

      <div className="card" style={{ marginBottom: 16, padding: 4 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={activeTab === 'rehabilitation' ? 'button' : 'button button-outline'}
            style={{ flex: 1, fontSize: 13, padding: '10px 0' }}
            onClick={() => setActiveTab('rehabilitation')}
          >
            🏥 运动康复
          </button>
          <button
            className={activeTab === 'all' ? 'button' : 'button button-outline'}
            style={{ flex: 1, fontSize: 13, padding: '10px 0' }}
            onClick={() => setActiveTab('all')}
          >
            👨‍🏫 全部教练
          </button>
        </div>
      </div>

      {coaches.length === 0 ? (
        <Empty message="暂无教练数据" />
      ) : (
        coaches.map(coach => (
          <div key={coach.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <img
                src={coach.avatar}
                alt={coach.name}
                style={{ width: 56, height: 56, borderRadius: '50%', marginRight: 12 }}
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.id}`
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{coach.name}</h3>
                  {coach.is_new ? (
                    <span style={{ background: '#ff6b6b', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                      NEW
                    </span>
                  ) : null}
                  {coach.is_premium ? (
                    <span style={{ background: '#ffd700', color: '#333', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                      优选
                    </span>
                  ) : null}
                </div>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0' }}>{coach.title}</p>
                <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
                  👥 {coach.followers} 人关注 · {coach.specialty}
                </p>
              </div>
            </div>
            {coach.description && (
              <p style={{ fontSize: 12, color: '#666', marginBottom: 12, padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
                {coach.description}
              </p>
            )}
            <button
              className={followingIds.has(coach.id) ? "button button-outline" : "button"}
              style={{ width: '100%', fontSize: 13, padding: 10 }}
              onClick={() => followCoach(coach)}
              disabled={followingIds.has(coach.id)}
            >
              {followingIds.has(coach.id) ? "✓ 已关注" : "+ 关注"}
            </button>
          </div>
        ))
      )}
    </div>
  )
}
