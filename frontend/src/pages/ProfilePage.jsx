import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI, rankingsAPI, challengesAPI } from '../api/client'
import { useToast } from '../contexts/ToastContext'
import Loading from '../components/Loading'
import useUserStore from '../store/userStore'

export default function ProfilePage() {
  const { currentUser } = useUserStore()
  const { showToast } = useToast()
  const [user, setUser] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfileData()
  }, [currentUser?.id])

  const fetchProfileData = async () => {
    if (!currentUser?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      const [userResult, rankingResult, challengesResult] = await Promise.all([
        usersAPI.getById(currentUser.id),
        rankingsAPI.getUserRanking(currentUser.id),
        challengesAPI.getUserChallenges(currentUser.id)
      ])
      
      setUser(userResult.data)
      setRanking(rankingResult.data)
      setChallenges(challengesResult.data || [])
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
        <button className="retry-button" onClick={fetchProfileData}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
            alt={user?.name || '用户'}
            style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid white', marginRight: 16 }}
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
            }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{user?.name || '用户'}</h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 14 }}>
              Lv.{user?.level || 1}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {Math.floor((user?.total_duration || 0) / 60)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>运动分钟</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {Math.floor(user?.total_calories || 0)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>消耗千卡</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {challenges?.length || 0}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>参与挑战</div>
          </div>
        </div>
      </div>

      <Link to="/rankings" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 28, marginRight: 12 }}>🏆</span>
            <div>
              <h3 style={{ fontSize: 16, margin: 0 }}>我的排名</h3>
              <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0 0' }}>
                当前第 {ranking?.rank || '--'} 名，共 {ranking?.total_users || 0} 人
              </p>
            </div>
          </div>
          <span style={{ color: '#667eea', fontSize: 20 }}>→</span>
        </div>
      </Link>

      <div className="card">
        <h3 className="card-title">我的挑战</h3>
        {challenges?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            暂无参与的挑战
            <div style={{ marginTop: 12 }}>
              <Link to="/challenges">
                <button className="button" style={{ fontSize: 13, padding: '8px 16px' }}>
                  去参与挑战
                </button>
              </Link>
            </div>
          </div>
        ) : (
          challenges.map(cp => (
            <Link
              key={cp.id}
              to={`/challenges/${cp.challenge_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{cp.title}</span>
                  <span style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: cp.completed ? '#d4edda' : '#fff3cd',
                    color: cp.completed ? '#155724' : '#856404'
                  }}>
                    {cp.completed ? '✅ 已完成' : '⏳ 进行中'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                  <span>进度：{Math.round(cp.progress)} / {cp.target_value}</span>
                  <span>保证金：¥{cp.deposit_amount}</span>
                </div>
                <div style={{ marginTop: 8, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: '#667eea',
                      width: `${Math.min(100, (cp.progress / cp.target_value) * 100)}%`,
                      borderRadius: 3,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="card">
        <h3 className="card-title">设置</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button 
            className="button button-outline" 
            style={{ textAlign: 'left', fontSize: 14 }}
            onClick={() => showToast('账户设置功能开发中...', 'info')}
          >
            ⚙️ 账户设置
          </button>
          <button 
            className="button button-outline" 
            style={{ textAlign: 'left', fontSize: 14 }}
            onClick={() => showToast('设备管理功能开发中...', 'info')}
          >
            📱 设备管理
          </button>
          <button 
            className="button button-outline" 
            style={{ textAlign: 'left', fontSize: 14 }}
            onClick={() => showToast('帮助中心功能开发中...', 'info')}
          >
            ❓ 帮助中心
          </button>
        </div>
      </div>
    </div>
  )
}
