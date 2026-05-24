import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { appointmentAPI } from '../api'

const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'checked_in', label: '已签到' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

export default function Appointments({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appointments, setAppointments] = useState([])
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter])

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await appointmentAPI.getAppointments(params)
      setAppointments(res.data.items || res.data || [])
    } catch (err) {
      setError('加载预约列表失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

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

  const handleCancel = async (id) => {
    if (!confirm('确定要取消这个预约吗？')) return
    try {
      await appointmentAPI.cancelAppointment(id, { reason: '用户取消' })
      fetchAppointments()
    } catch (err) {
      setError(err.response?.data?.error || '取消失败，请重试')
    }
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
        <h2>我的预约</h2>
        <button className="btn btn-primary" onClick={() => navigate('/services')}>
          预约新服务
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="tabs">
          {STATUS_FILTERS.map(filter => (
            <div
              key={filter.value}
              className={`tab ${statusFilter === filter.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </div>
          ))}
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <h3>暂无预约记录</h3>
            <p>{statusFilter ? '该状态下没有预约' : '快去预约服务吧'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/services')}>
              去预约
            </button>
          </div>
        ) : (
          <div className="list">
            {appointments.map(apt => {
              const badge = getStatusBadge(apt.status)
              return (
                <div key={apt.id} className="list-item">
                  <div className="list-item-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600 }}>
                        {apt.service_name || apt.service_type}
                      </h4>
                      <span className={`badge ${badge.className}`}>{badge.label}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>
                      🐾 {apt.pet_name || '未知宠物'} · 📅 {dayjs(apt.appointment_time).format('YYYY-MM-DD HH:mm')}
                    </div>
                    {apt.need_transport && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        🚗 包含接送服务
                      </div>
                    )}
                    {apt.total_amount && (
                      <div style={{ color: 'var(--primary-color)', fontWeight: 600, marginTop: '8px' }}>
                        ¥{apt.total_amount}
                      </div>
                    )}
                  </div>
                  <div className="list-item-actions">
                    {apt.status === 'in_progress' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate(`/progress/${apt.id}`)}
                      >
                        查看进度
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                    >
                      详情
                    </button>
                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCancel(apt.id)}
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
