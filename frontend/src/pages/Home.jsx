import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { statsAPI, appointmentAPI } from '../api'

export default function Home({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, aptRes] = await Promise.all([
        statsAPI.getOverview(),
        appointmentAPI.getAppointments({ limit: 5 })
      ])
      setStats(statsRes.data)
      setAppointments(aptRes.data.items || aptRes.data || [])
    } catch (err) {
      setError('加载数据失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { icon: '🐾', label: '我的宠物', path: '/pets', color: 'var(--primary-color)' },
    { icon: '🛁', label: '预约服务', path: '/services', color: 'var(--info-color)' },
    { icon: '📅', label: '我的预约', path: '/appointments', color: 'var(--success-color)' },
    { icon: '💬', label: '意见反馈', path: '/complaints', color: 'var(--warning-color)' }
  ]

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      checked_in: 'badge-primary',
      in_progress: 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    }
    const labels = {
      pending: '待确认',
      confirmed: '已确认',
      checked_in: '已签到',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return { className: badges[status] || 'badge-secondary', label: labels[status] || status }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>欢迎回来，{user?.name || '用户'} 👋</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {dayjs().format('YYYY年MM月DD日 dddd')}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ borderLeftColor: 'var(--primary-color)' }}>
          <h3>待确认预约</h3>
          <div className="value">{stats?.pending || 0}</div>
          <div className="trend up">待处理</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--info-color)' }}>
          <h3>本月服务</h3>
          <div className="value">{stats?.thisMonth || 0}</div>
          <div className="trend up">服务次数</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
          <h3>已完成</h3>
          <div className="value">{stats?.completed || 0}</div>
          <div className="trend up">累计完成</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warning-color)' }}>
          <h3>我的宠物</h3>
          <div className="value">{stats?.pets || 0}</div>
          <div className="trend">宠物数量</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>快捷操作</h3>
        </div>
        <div className="grid grid-4">
          {quickActions.map((action, idx) => (
            <div
              key={idx}
              className="card"
              style={{ cursor: 'pointer', textAlign: 'center', marginBottom: 0 }}
              onClick={() => navigate(action.path)}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{action.icon}</div>
              <div style={{ fontWeight: 500, color: action.color }}>{action.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>最近预约</h3>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/appointments')}>
            查看全部
          </button>
        </div>
        {appointments.length === 0 ? (
          <div className="empty-state">
            <h3>暂无预约记录</h3>
            <p>快去预约服务吧</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>服务类型</th>
                <th>宠物</th>
                <th>预约时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const badge = getStatusBadge(apt.status)
                return (
                  <tr key={apt.id}>
                    <td>{apt.service_name || apt.service_type}</td>
                    <td>{apt.pet_name || '-'}</td>
                    <td>{dayjs(apt.appointment_time).format('YYYY-MM-DD HH:mm')}</td>
                    <td><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/appointments/${apt.id}`)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
