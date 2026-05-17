import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { challengesAPI } from '../api/client'
import useUserStore from '../store/userStore'
import { useToast } from '../contexts/ToastContext'
import Loading from '../components/Loading'
import Empty from '../components/Empty'

export default function ChallengeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useUserStore()
  const { showToast } = useToast()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchChallenge()
  }, [id])

  const fetchChallenge = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await challengesAPI.getById(id)
      setChallenge(result.data)
    } catch (err) {
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async () => {
    if (challenge?.status === 'ended') {
      showToast('挑战已结束', 'error')
      return
    }
    try {
      setJoining(true)
      await challengesAPI.join(id, { user_id: currentUser.id })
      showToast('报名成功！保证金已支付', 'success')
      fetchChallenge()
    } catch (err) {
      showToast(err.response?.data?.message || '报名失败', 'error')
    } finally {
      setJoining(false)
    }
  }

  const isJoined = challenge?.participants?.some(p => p.user_id === currentUser.id)
  const userParticipation = challenge?.participants?.find(p => p.user_id === currentUser.id)

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchChallenge}>重试</button>
      </div>
    )
  }

  if (!challenge) return <Empty message="挑战不存在" />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginRight: 12 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: 20 }}>{challenge.title}</h2>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{challenge.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 12, background: '#fff3e0', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#f57c00', marginBottom: 4 }}>💵 报名保证金</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#e65100' }}>¥{challenge.deposit_amount}</div>
          </div>
          <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#388e3c', marginBottom: 4 }}>💰 当前奖金池</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }}>¥{(challenge.total_pool || 0).toFixed(1)}</div>
          </div>
        </div>

        <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>🎯 挑战目标</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {challenge.target_type === 'duration' ? '累计运动' : '消耗'} {challenge.target_value}
            {challenge.target_type === 'duration' ? ' 分钟' : ' 千卡'}
          </div>
        </div>

        <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#1976d2' }}>
            📅 活动时间：{challenge.start_date} ~ {challenge.end_date}
          </div>
          <div style={{ fontSize: 13, color: '#1976d2', marginTop: 4 }}>
            👥 已有 {challenge.participant_count || 0} 人参与挑战
          </div>
          <div style={{ fontSize: 13, color: '#1976d2', marginTop: 4 }}>
            🏆 完成者平分奖金池，每人预计可获得 ¥{(challenge.reward_per_completion || 0).toFixed(2)}
          </div>
        </div>

        {isJoined ? (
          <div>
            <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2e7d32', marginBottom: 8 }}>
                ✅ 已报名参加
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                进度：{userParticipation?.progress || 0} / {challenge.target_value}
                {challenge.target_type === 'duration' ? ' 分钟' : ' 千卡'}
              </div>
              <div style={{ width: '100%', height: 8, background: '#e0e0e0', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, ((userParticipation?.progress || 0) / challenge.target_value) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    borderRadius: 4,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              {userParticipation?.completed && (
                <div style={{ fontSize: 14, fontWeight: 500, color: '#27ae60', marginTop: 8 }}>
                  🎉 恭喜完成挑战！
                </div>
              )}
            </div>
            <button className="button button-outline" style={{ width: '100%' }} disabled>
              已报名
            </button>
          </div>
        ) : challenge.status === 'ended' ? (
          <button className="button button-outline" style={{ width: '100%' }} disabled>
            挑战已结束
          </button>
        ) : (
          <button
            className="button"
            style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            onClick={joinChallenge}
            disabled={joining}
          >
            {joining ? '报名中...' : `立即报名（支付 ¥${challenge.deposit_amount} 保证金）`}
          </button>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">📋 规则说明</h3>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
          <p>1. 支付保证金后即可参与挑战</p>
          <p>2. 在活动时间内完成挑战目标</p>
          <p>3. 所有完成挑战的用户平分奖金池</p>
          <p>4. 未完成挑战的用户保证金不予返还，归入奖金池</p>
          <p>5. 奖金将在活动结束后自动发放</p>
        </div>
      </div>

      {challenge.participants?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title">👥 参与者（{challenge.participants.length}）</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {challenge.participants.slice(0, 10).map(p => (
              <div key={p.user_id} style={{ textAlign: 'center' }}>
                <img
                  src={p.avatar}
                  alt={p.name}
                  style={{ width: 36, height: 36, borderRadius: '50%', marginBottom: 4 }}
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`
                  }}
                />
                <div style={{ fontSize: 10, color: '#999' }}>{p.name?.slice(0, 3)}</div>
              </div>
            ))}
            {challenge.participants.length > 10 && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 10, color: '#999' }}>+{challenge.participants.length - 10}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
