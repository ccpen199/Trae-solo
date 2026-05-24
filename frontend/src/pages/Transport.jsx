import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { transportAPI } from '../api'

const statusMap = {
  pending: { label: '待接单', className: 'badge-warning' },
  assigned: { label: '已接单', className: 'badge-info' },
  in_progress: { label: '进行中', className: 'badge-primary' },
  arrived: { label: '已到达', className: 'badge-info' },
  delayed: { label: '已延迟', className: 'badge-danger' },
  completed: { label: '已完成', className: 'badge-success' },
  cancelled: { label: '已取消', className: 'badge-secondary' }
}

export default function Transport({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [showDelayModal, setShowDelayModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [delayReason, setDelayReason] = useState('')
  const [delayMinutes, setDelayMinutes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await transportAPI.getTasks(params)
      setTasks(res.data)
    } catch (err) {
      setError('加载任务失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (taskId) => {
    setActionLoading(true)
    try {
      await transportAPI.startTask(taskId)
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArrive = async (taskId) => {
    setActionLoading(true)
    try {
      await transportAPI.arriveTask(taskId, { arrival_time: new Date().toISOString() })
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelay = (task) => {
    setSelectedTask(task)
    setDelayReason('')
    setDelayMinutes('')
    setShowDelayModal(true)
  }

  const submitDelay = async () => {
    if (!delayReason || !delayMinutes) return
    setActionLoading(true)
    try {
      await transportAPI.delayTask(selectedTask.id, {
        reason: delayReason,
        delay_minutes: parseInt(delayMinutes)
      })
      setShowDelayModal(false)
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (taskId) => {
    setActionLoading(true)
    try {
      await transportAPI.completeTask(taskId)
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const renderActions = (task) => {
    const isDriver = user?.role === 'driver'
    if (!isDriver) return null

    switch (task.status) {
      case 'assigned':
        return (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleStart(task.id)}
            disabled={actionLoading}
          >
            开始出发
          </button>
        )
      case 'in_progress':
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleArrive(task.id)}
              disabled={actionLoading}
            >
              已到达
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={() => handleDelay(task)}
              disabled={actionLoading}
            >
              延迟
            </button>
          </div>
        )
      case 'arrived':
      case 'delayed':
        return (
          <button
            className="btn btn-success btn-sm"
            onClick={() => handleComplete(task.id)}
            disabled={actionLoading}
          >
            完成接送
          </button>
        )
      default:
        return null
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
        <h2>🚗 接送任务管理</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>任务列表</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'assigned', 'in_progress', 'completed'].map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部' : statusMap[f]?.label}
              </button>
            ))}
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <h3>暂无任务</h3>
            <p>当前没有接送任务</p>
          </div>
        ) : (
          <div className="list">
            {tasks.map((task) => (
              <div key={task.id} className="list-item">
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <strong>{task.type === 'pickup' ? '接宠' : '送宠'}</strong>
                    <span className={`badge ${statusMap[task.status]?.className}`}>
                      {statusMap[task.status]?.label}
                    </span>
                    {task.delay_minutes > 0 && (
                      <span className="badge badge-danger">延迟 {task.delay_minutes} 分钟</span>
                    )}
                  </div>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    📍 出发地: {task.pickup_address}
                  </p>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    🏠 目的地: {task.dropoff_address}
                  </p>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    🐾 宠物: {task.pet_name}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    预约时间: {dayjs(task.scheduled_time).format('YYYY-MM-DD HH:mm')}
                  </p>
                  {task.delay_reason && (
                    <p style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '4px' }}>
                      延迟原因: {task.delay_reason}
                    </p>
                  )}
                </div>
                <div className="list-item-actions">
                  {renderActions(task)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDelayModal && (
        <div className="modal-overlay" onClick={() => setShowDelayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>报告延迟</h3>
              <button className="modal-close" onClick={() => setShowDelayModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>延迟原因</label>
              <textarea
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="请说明延迟原因"
                required
              />
            </div>
            <div className="form-group">
              <label>预计延迟时间（分钟）</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder="请输入延迟分钟数"
                min="1"
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDelayModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={submitDelay}
                disabled={!delayReason || !delayMinutes || actionLoading}
              >
                {actionLoading ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
