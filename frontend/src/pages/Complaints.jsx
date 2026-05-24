import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { complaintAPI } from '../api'

const statusMap = {
  pending: { label: '待处理', className: 'badge-warning' },
  processing: { label: '处理中', className: 'badge-info' },
  closed: { label: '已关闭', className: 'badge-success' }
}

export default function Complaints({ user }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showHandleModal, setShowHandleModal] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [formData, setFormData] = useState({
    type: 'service',
    title: '',
    description: '',
    appointmentId: ''
  })
  const [handleNote, setHandleNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const canHandle = user.role === 'customer_service' || user.role === 'admin' || user.role === 'store'
  const canCreate = user.role === 'owner' || canHandle

  const loadComplaints = async () => {
    setLoading(true)
    setError('')
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const res = await complaintAPI.getComplaints(params)
      setComplaints(res.data || [])
    } catch (err) {
      setError('加载投诉列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [activeTab])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await complaintAPI.createComplaint(formData)
      setShowCreateModal(false)
      setFormData({ type: 'service', title: '', description: '', appointmentId: '' })
      loadComplaints()
    } catch (err) {
      setError(err.response?.data?.error || '创建投诉失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProcess = async (complaint) => {
    setSelectedComplaint(complaint)
    setHandleNote('')
    setShowHandleModal(true)
  }

  const handleSubmitProcess = async () => {
    if (!selectedComplaint) return
    setSubmitting(true)
    setError('')
    try {
      await complaintAPI.handleComplaint(selectedComplaint.id, { note: handleNote })
      setShowHandleModal(false)
      setSelectedComplaint(null)
      loadComplaints()
    } catch (err) {
      setError(err.response?.data?.error || '处理失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async (id) => {
    if (!confirm('确定要关闭此投诉吗？')) return
    setError('')
    try {
      await complaintAPI.closeComplaint(id)
      loadComplaints()
    } catch (err) {
      setError('关闭失败')
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
        <h2>投诉管理</h2>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            发起投诉
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部
        </div>
        <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待处理
        </div>
        <div className={`tab ${activeTab === 'processing' ? 'active' : ''}`} onClick={() => setActiveTab('processing')}>
          处理中
        </div>
        <div className={`tab ${activeTab === 'closed' ? 'active' : ''}`} onClick={() => setActiveTab('closed')}>
          已关闭
        </div>
      </div>

      <div className="card">
        {complaints.length === 0 ? (
          <div className="empty-state">
            <h3>暂无投诉记录</h3>
            <p>有任何问题可以在此提交投诉</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>类型</th>
                <th>投诉人</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>处理人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>{complaint.title}</td>
                  <td>{complaint.type}</td>
                  <td>{complaint.userName}</td>
                  <td>
                    <span className={`badge ${statusMap[complaint.status]?.className}`}>
                      {statusMap[complaint.status]?.label}
                    </span>
                  </td>
                  <td>{dayjs(complaint.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                  <td>{complaint.handlerName || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canHandle && complaint.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleProcess(complaint)}
                        >
                          处理
                        </button>
                      )}
                      {canHandle && complaint.status === 'processing' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleClose(complaint.id)}
                        >
                          关闭
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发起投诉</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>投诉类型</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="service">服务质量</option>
                  <option value="attitude">服务态度</option>
                  <option value="price">价格问题</option>
                  <option value="transport">接送服务</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="form-group">
                <label>标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请简要描述问题"
                  required
                />
              </div>
              <div className="form-group">
                <label>详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请详细描述您遇到的问题..."
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '提交投诉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHandleModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowHandleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>处理投诉</h3>
              <button className="modal-close" onClick={() => setShowHandleModal(false)}>×</button>
            </div>
            <div className="card" style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc' }}>
              <h4 style={{ marginBottom: '8px' }}>{selectedComplaint.title}</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {selectedComplaint.description}
              </p>
            </div>
            <div className="form-group">
              <label>处理意见</label>
              <textarea
                value={handleNote}
                onChange={(e) => setHandleNote(e.target.value)}
                placeholder="请输入处理意见..."
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowHandleModal(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitProcess}
                disabled={submitting || !handleNote.trim()}
              >
                {submitting ? '提交中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
