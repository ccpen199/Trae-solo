import { useState, useEffect } from 'react'
import { rankingsAPI } from '../api/client'
import useUserStore from '../store/userStore'
import Loading from '../components/Loading'
import Empty from '../components/Empty'
import { useToast } from '../contexts/ToastContext'

export default function RankingsPage() {
  const { currentUser } = useUserStore()
  const { showToast } = useToast()
  const [rankings, setRankings] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('week')
  const [category, setCategory] = useState('duration')

  useEffect(() => {
    fetchRankings()
    fetchUserRank()
  }, [period, category])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await rankingsAPI.getAll({ period, category })
      setRankings(result.data?.rankings || result.data || [])
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRank = async () => {
    if (!currentUser?.id) return
    try {
      const result = await rankingsAPI.getUserRanking(currentUser.id, { category })
      setUserRank(result.data)
    } catch (err) {
      console.error('Fetch user rank error:', err)
    }
  }

  const shareRanking = () => {
    const shareText = `🎉 我的运动排名：第 ${userRank?.rank || '-'} 名！\n快来一起运动，超越自我吧！💪`
    if (navigator.share) {
      navigator.share({
        title: '我的运动排名',
        text: shareText
      }).catch(() => {
        copyToClipboard(shareText)
      })
    } else {
      copyToClipboard(shareText)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('排名已复制到剪贴板', 'success')
    }).catch(() => {
      alert(text)
    })
  }

  if (loading && rankings.length === 0) return <Loading />

  if (error && rankings.length === 0) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchRankings}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22 }}>🏆 排行榜</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['week', 'month', 'all'].map(p => (
            <button
              key={p}
              className={period === p ? 'button' : 'button button-outline'}
              style={{ flex: 1, fontSize: 12, padding: '8px 0' }}
              onClick={() => setPeriod(p)}
            >
              {p === 'week' ? '本周' : p === 'month' ? '本月' : '全部'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['duration', 'calories', 'level'].map(c => (
            <button
              key={c}
              className={category === c ? 'button' : 'button button-outline'}
              style={{ flex: 1, fontSize: 12, padding: '8px 0' }}
              onClick={() => setCategory(c)}
            >
              {c === 'duration' ? '⏱ 时长' : c === 'calories' ? '🔥 卡路里' : '⭐ 等级'}
            </button>
          ))}
        </div>
      </div>

      {userRank && (
        <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>我的排名</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 'bold' }}>#{userRank.rank}</span>
                <span style={{ fontSize: 14 }}>/ {userRank.total_users} 人</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {category === 'duration' ? `累计 ${userRank.value} 分钟` :
                 category === 'calories' ? `消耗 ${Math.round(userRank.value)} 千卡` :
                 `Lv.${userRank.value}`}
              </div>
            </div>
            <button
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}
              onClick={shareRanking}
            >
              📤 分享
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">排行榜单</h3>
        {rankings.length === 0 ? (
          <Empty message="暂无排名数据" />
        ) : (
          rankings.map((user, index) => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < rankings.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  marginRight: 12,
                  background: index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : '#f5f5f5',
                  color: index < 3 ? 'white' : '#666',
                  fontSize: index < 3 ? 16 : 14
                }}
              >
                {index + 1}
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }}
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {category === 'duration' ? `${user.value} 分钟` :
                   category === 'calories' ? `${Math.round(user.value)} 千卡` :
                   `Lv.${user.value}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
