import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Habits = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✅', color: '#4CAF50', reminder_time: '' })
  const [showSettings, setShowSettings] = useState(null)
  const [checkingIn, setCheckingIn] = useState(null)

  const fetchHabits = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/habits')
      if (res.data.success) {
        setHabits(res.data.data)
      }
    } catch (err) {
      console.error('获取习惯失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [isAuthenticated])

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return
    try {
      const res = await api.post('/habits', newHabit)
      if (res.data.success) {
        setShowAddModal(false)
        setNewHabit({ name: '', icon: '✅', color: '#4CAF50', reminder_time: '' })
        fetchHabits()
      }
    } catch (err) {
      console.error('添加习惯失败:', err)
    }
  }

  const handleCheckIn = async (habitId) => {
    setCheckingIn(habitId)
    try {
      const res = await api.post(`/habits/${habitId}/checkin`)
      if (res.data.success) {
        fetchHabits()
      }
    } catch (err) {
      alert(err.response?.data?.message || '打卡失败')
    } finally {
      setCheckingIn(null)
    }
  }

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('确定要删除这个习惯吗？')) return
    try {
      await api.delete(`/habits/${habitId}`)
      fetchHabits()
      setShowSettings(null)
    } catch (err) {
      console.error('删除习惯失败:', err)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>📋</div>
        <h2 style={styles.emptyTitle}>开始你的习惯之旅</h2>
        <p style={styles.emptyText}>登录后即可添加和管理你的习惯</p>
        <button onClick={() => navigate('/login')} style={styles.loginButton}>
          立即登录
        </button>
      </div>
    )
  }

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>我的习惯</h1>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{habits.length}</span>
            <span style={styles.statLabel}>个习惯</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{habits.reduce((sum, h) => sum + (h.current_days || 0), 0)}</span>
            <span style={styles.statLabel}>坚持天数</span>
          </div>
        </div>
      </header>

      {habits.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>🌱</div>
          <h2 style={styles.emptyTitle}>还没有添加习惯</h2>
          <p style={styles.emptyText}>点击下方按钮添加你的第一个习惯</p>
        </div>
      ) : (
        <div style={styles.habitList}>
          {habits.map((habit, index) => (
            <div
              key={habit.id}
              style={{ ...styles.habitCard, borderLeftColor: habit.color }}
              onTouchStart={(e) => {
                const startX = e.touches[0].clientX
                const handleTouchMove = (e2) => {
                  const diff = startX - e2.touches[0].clientX
                  if (diff > 50) {
                    setShowSettings(habit.id)
                  }
                }
                document.addEventListener('touchmove', handleTouchMove, { once: true })
              }}
            >
              <div style={styles.habitMain}>
                <span style={styles.habitIcon}>{habit.icon}</span>
                <div style={styles.habitInfo}>
                  <h3 style={styles.habitName}>{habit.name}</h3>
                  <div style={styles.habitMeta}>
                    <span style={styles.daysBadge}>
                      {habit.current_days || 0} 天
                    </span>
                    {habit.reminder_time && (
                      <span style={styles.reminder}>⏰ {habit.reminder_time}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCheckIn(habit.id)}
                  style={styles.checkInButton}
                  disabled={checkingIn === habit.id}
                >
                  {checkingIn === habit.id ? '打卡中...' : '打卡'}
                </button>
              </div>

              {showSettings === habit.id && (
                <div style={styles.settingsPanel}>
                  <button
                    style={styles.settingsButton}
                    onClick={() => setShowSettings(null)}
                  >
                    取消
                  </button>
                  <button
                    style={{ ...styles.settingsButton, ...styles.deleteButton }}
                    onClick={() => handleDeleteHabit(habit.id)}
                  >
                    删除习惯
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button style={styles.fab} onClick={() => setShowAddModal(true)}>
        +
      </button>

      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>添加新习惯</h3>

            <div style={styles.formGroup}>
              <label style={styles.label}>习惯名称</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="例如：早起、阅读"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>图标</label>
              <div style={styles.iconGrid}>
                {['✅', '🌅', '📚', '🏃', '💧', '🥗', '💪', '🧘', '✍️', '🎯'].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewHabit({ ...newHabit, icon })}
                    style={{
                      ...styles.iconButton,
                      ...(newHabit.icon === icon ? styles.iconButtonActive : {})
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>提醒时间</label>
              <input
                type="time"
                value={newHabit.reminder_time}
                onChange={(e) => setNewHabit({ ...newHabit, reminder_time: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowAddModal(false)} style={styles.cancelButton}>
                取消
              </button>
              <button onClick={handleAddHabit} style={styles.confirmButton}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    paddingBottom: '80px'
  },
  header: {
    padding: '20px 20px 16px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
    color: '#fff'
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '16px'
  },
  stats: {
    display: 'flex',
    gap: '24px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700'
  },
  statLabel: {
    fontSize: '12px',
    opacity: 0.9
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  emptyContainer: {
    padding: '80px 24px',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    marginBottom: '24px'
  },
  loginButton: {
    padding: '12px 32px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  habitList: {
    padding: '16px 20px'
  },
  habitCard: {
    background: '#fff',
    borderRadius: '12px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    borderLeft: '4px solid #4CAF50',
    overflow: 'hidden'
  },
  habitMain: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px'
  },
  habitIcon: {
    fontSize: '32px',
    marginRight: '16px'
  },
  habitInfo: {
    flex: 1
  },
  habitName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  habitMeta: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  daysBadge: {
    padding: '4px 10px',
    background: '#E8F5E9',
    color: '#4CAF50',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  reminder: {
    fontSize: '12px',
    color: '#999'
  },
  checkInButton: {
    padding: '10px 20px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  settingsPanel: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    borderTop: '1px solid #f0f0f0',
    background: '#fafafa'
  },
  settingsButton: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px'
  },
  deleteButton: {
    background: '#FFEBEE',
    borderColor: '#FFCDD2',
    color: '#E53935'
  },
  fab: {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
    zIndex: 50
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '16px 16px 0 0',
    width: '100%',
    maxWidth: '480px',
    padding: '24px 20px 32px',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none'
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px'
  },
  iconButton: {
    padding: '12px',
    border: '2px solid #eee',
    borderRadius: '8px',
    background: '#fff',
    fontSize: '20px',
    cursor: 'pointer'
  },
  iconButtonActive: {
    borderColor: '#4CAF50',
    background: '#E8F5E9'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600'
  },
  confirmButton: {
    flex: 1,
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    background: '#4CAF50',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600'
  }
}

export default Habits