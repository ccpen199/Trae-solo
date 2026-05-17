import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { challengesAPI } from '../api/client'
import Loading from '../components/Loading'
import Empty from '../components/Empty'

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchChallenges()
  }, [filter])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = filter !== 'all' ? { status: filter } : {}
      const result = await challengesAPI.getAll(params)
      setChallenges(result.data || [])
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
        <button className="retry-button" onClick={fetchChallenges}>重试</button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16, fontSize: 22 }}>🎯 挑战活动</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'ongoing', 'upcoming'].map(f => (
            <button
              key={f}
              className={filter === f ? 'button' : 'button button-outline'}
              style={{ flex: 1, fontSize: 12, padding: '8px 0' }}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'ongoing' ? '进行中' : '即将开始'}
            </button>
          ))}
        </div>
      </div>

      {challenges.length === 0 ? (
        <Empty message="暂无挑战活动" />
      ) : (
        challenges.map(challenge => (
          <Link
            key={challenge.id}
            to={`/challenges/${challenge.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{challenge.title}</h3>
                  <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{challenge.description}</p>
                </div>
                <span
                  style={{
                    background: challenge.status === 'ongoing' ? '#27ae60' : '#f39c12',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11
                  }}
                >
                  {challenge.status === 'ongoing' ? '进行中' : '即将开始'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: '#999' }}>🎁 保证金</span>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e53935' }}>
                    ¥{challenge.deposit_amount}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#999' }}>💰 奖金池</span>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#27ae60' }}>
                    ¥{challenge.total_pool.toFixed(1)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#999' }}>👥 参与人数</span>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                    {challenge.participant_count}人
                  </div>
                </div>
              </div>

              <div style={{ padding: 10, background: '#f0f9ff', borderRadius: 6, fontSize: 12, color: '#1976d2' }}>
                📅 {challenge.start_date} ~ {challenge.end_date}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
