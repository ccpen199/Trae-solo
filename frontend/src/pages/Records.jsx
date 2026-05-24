import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { recordAPI, serviceAPI } from '../api'

const statusMap = {
  pending: { label: '待处理', className: 'badge-warning' },
  in_progress: { label: '进行中', className: 'badge-info' },
  completed: { label: '已完成', className: 'badge-success' },
  cancelled: { label: '已取消', className: 'badge-secondary' }
}

export default function Records({ user }) {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('pending')
  const [showStepModal, setShowStepModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showConsumableModal, setShowConsumableModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [stepDescription, setStepDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoDescription, setPhotoDescription] = useState('')
  const [consumables, setConsumables] = useState([])
  const [selectedConsumable, setSelectedConsumable] = useState('')
  const [consumableQuantity, setConsumableQuantity] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchRecords()
    fetchConsumables()
  }, [filter])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await recordAPI.getRecords(params)
      setRecords(res.data)
    } catch (err) {
      setError('加载记录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const fetchConsumables = async () => {
    try {
      const res = await serviceAPI.getConsumables()
      setConsumables(res.data)
    } catch (err) {
      console.error('加载耗材失败:', err)
    }
  }

  const handleAddStep = (record) => {
    setSelectedRecord(record)
    setStepDescription('')
    setShowStepModal(true)
  }

  const submitStep = async () => {
    if (!stepDescription.trim()) return
    setActionLoading(true)
    try {
      const updatedSteps = [...(selectedRecord.steps || []), {
        description: stepDescription,
        timestamp: new Date().toISOString(),
        staff_name: user?.name || '服务人员'
      }]
      await recordAPI.updateRecord(selectedRecord.id, { steps: updatedSteps })
      setShowStepModal(false)
      fetchRecords()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddPhoto = (record) => {
    setSelectedRecord(record)
    setPhotoUrl('')
    setPhotoDescription('')
    setShowPhotoModal(true)
  }

  const submitPhoto = async () => {
    if (!photoUrl.trim()) return
    setActionLoading(true)
    try {
      await recordAPI.addPhoto(selectedRecord.id, {
        url: photoUrl,
        description: photoDescription
      })
      setShowPhotoModal(false)
      fetchRecords()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddConsumable = (record) => {
    setSelectedRecord(record)
    setSelectedConsumable('')
    setConsumableQuantity(1)
    setShowConsumableModal(true)
  }

  const submitConsumable = async () => {
    if (!selectedConsumable || consumableQuantity < 1) return
    setActionLoading(true)
    try {
      const consumable = consumables.find(c => c.id === selectedConsumable)
      await recordAPI.addConsumable(selectedRecord.id, {
        consumable_id: selectedConsumable,
        name: consumable?.name,
        quantity: consumableQuantity,
        unit_price: consumable?.price || 0
      })
      setShowConsumableModal(false)
      fetchRecords()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewDetail = (recordId) => {
    navigate(`/records/${recordId}`)
  }

  const handleComplete = async (recordId) => {
    setActionLoading(true)
    try {
      await recordAPI.updateRecord(recordId, { status: 'completed' })
      fetchRecords()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
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
        <h2>📋 服务记录管理</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>记录列表</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'in_progress', 'completed'].map((f) => (
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

        {records.length === 0 ? (
          <div className="empty-state">
            <h3>暂无记录</h3>
            <p>当前没有服务记录</p>
          </div>
        ) : (
          <div className="list">
            {records.map((record) => (
              <div key={record.id} className="list-item">
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <strong>{record.service_name}</strong>
                    <span className={`badge ${statusMap[record.status]?.className}`}>
                      {statusMap[record.status]?.label}
                    </span>
                  </div>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    🐾 宠物: {record.pet_name} | 👤 主人: {record.owner_name}
                  </p>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    📝 已记录步骤: {record.steps?.length || 0} | 📷 照片: {record.photos?.length || 0} | 🧴 耗材: {record.consumables?.length || 0}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    创建时间: {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
                  </p>
                  {record.steps && record.steps.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>最近步骤:</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {record.steps[record.steps.length - 1].description}
                      </p>
                    </div>
                  )}
                </div>
                <div className="list-item-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleAddStep(record)}
                      disabled={actionLoading || record.status === 'completed'}
                    >
                      记录步骤
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddPhoto(record)}
                      disabled={actionLoading || record.status === 'completed'}
                    >
                      上传照片
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleAddConsumable(record)}
                      disabled={actionLoading || record.status === 'completed'}
                    >
                      耗材使用
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewDetail(record.id)}
                    >
                      查看详情
                    </button>
                    {record.status !== 'completed' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleComplete(record.id)}
                        disabled={actionLoading}
                      >
                        完成服务
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showStepModal && (
        <div className="modal-overlay" onClick={() => setShowStepModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>记录服务步骤</h3>
              <button className="modal-close" onClick={() => setShowStepModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>步骤描述</label>
              <textarea
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
                placeholder="请描述当前服务步骤..."
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowStepModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={submitStep}
                disabled={!stepDescription.trim() || actionLoading}
              >
                {actionLoading ? '提交中...' : '确认记录'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上传服务照片</h3>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>照片URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="请输入照片链接"
                required
              />
            </div>
            <div className="form-group">
              <label>照片描述</label>
              <input
                type="text"
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="请输入照片描述（可选）"
              />
            </div>
            {photoUrl && (
              <div style={{ marginBottom: '16px' }}>
                <img src={photoUrl} alt="预览" style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={submitPhoto}
                disabled={!photoUrl.trim() || actionLoading}
              >
                {actionLoading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConsumableModal && (
        <div className="modal-overlay" onClick={() => setShowConsumableModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>记录耗材使用</h3>
              <button className="modal-close" onClick={() => setShowConsumableModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>选择耗材</label>
              <select
                value={selectedConsumable}
                onChange={(e) => setSelectedConsumable(e.target.value)}
                required
              >
                <option value="">请选择耗材</option>
                {consumables.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (库存: {c.stock}, 单价: ¥{c.price})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>使用数量</label>
              <input
                type="number"
                value={consumableQuantity}
                onChange={(e) => setConsumableQuantity(parseInt(e.target.value) || 1)}
                min="1"
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowConsumableModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={submitConsumable}
                disabled={!selectedConsumable || consumableQuantity < 1 || actionLoading}
              >
                {actionLoading ? '提交中...' : '确认记录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
