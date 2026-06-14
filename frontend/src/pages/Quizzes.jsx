import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quizAPI } from '../api/index.js';

const Quizzes = () => {
  const [activeTab, setActiveTab] = useState('quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [quizzesRes, leaderboardRes, prizesRes] = await Promise.all([
          quizAPI.getQuizzes({ limit: 10 }),
          quizAPI.getLeaderboard({ limit: 10 }),
          quizAPI.getPrizes({ limit: 10 })
        ]);
        setQuizzes(quizzesRes.data?.data || []);
        setLeaderboard(leaderboardRes.data?.data || []);
        setPrizes(prizesRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const tabs = [
    { key: 'quizzes', label: '答题活动' },
    { key: 'leaderboard', label: '排行榜' },
    { key: 'prizes', label: '奖品兑换' }
  ];

  return (
    <div className="container section">
      <h1 className="section-title">答题竞猜</h1>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          {activeTab === 'quizzes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quizzes.map(quiz => (
                <Link
                  key={quiz.id}
                  to={`/quizzes/${quiz.id}`}
                  style={{
                    padding: '24px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>{quiz.title}</h3>
                    <span className={`badge badge-${quiz.status === 'active' ? 'positive' : 'neutral'}`}>
                      {quiz.status === 'active' ? '🔥 进行中' : '已结束'}
                    </span>
                  </div>
                  <p style={{
                    margin: '0 0 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    {quiz.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '24px',
                    fontSize: '13px',
                    color: 'var(--text-muted)'
                  }}>
                    <span>📝 {quiz.question_count || 0} 道题</span>
                    <span>🏆 {quiz.participant_count || 0} 人参与</span>
                    <span>⏱️ {quiz.time_limit ? `${quiz.time_limit}秒/题` : '不限时'}</span>
                    <span>🎁 {quiz.prize_pool || 0} 积分奖池</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <th style={{ padding: '16px', textAlign: 'left' }}>排名</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>用户</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>总分</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>答题数</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>正确率</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>
                        {index < 3 ? (
                          <span style={{
                            fontSize: '20px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                            color: '#000',
                            fontWeight: '700'
                          }}>
                            {index + 1}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>{index + 1}</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '500' }}>
                        {entry.username || entry.user_id}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--warning)' }}>
                        {entry.total_score || 0}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {entry.questions_answered || 0}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center', color: 'var(--success)' }}>
                        {entry.accuracy || 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="grid grid-3">
              {prizes.map(prize => (
                <div
                  key={prize.id}
                  style={{
                    padding: '24px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 16px',
                    fontSize: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%)',
                    borderRadius: '50%'
                  }}>
                    {prize.icon || '🎁'}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{prize.name}</h3>
                  <p style={{
                    margin: '0 0 16px',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    {prize.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                      {prize.points_required} 积分
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      库存: {prize.stock || '∞'}
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    立即兑换
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Quizzes;
