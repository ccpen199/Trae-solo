import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { recordAPI, serviceAPI } from '../api'

const statusMap = {
  pending: { label: '待处理', className: 'badge-warning' },
  in_progress: { label: '进行中', className: 'badge-info' },
  completed: { label: '已完成', className: 'badge-success' },
  cancelled: { label: '已取消', className: 'badge-secondary' }
}

export default function RecordDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('content')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    service_content: '',
    notes: '',
    status: 'pending'
  })
  const [consumables, setConsumables] = useState([])
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showConsumableModal, setShowConsumableModal] = useState(false)
  const [showStepModal, setShowStepModal] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoDescription, setPhotoDescription] = useState('')
  const [selectedConsumable, setSelectedConsumable] = useState('')
  const [consumableQuantity, setConsumableQuantity] = useState(1)
  const [stepDescription, setStepDescription] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchRecord()
    fetchConsumables()
  }, [id])

  const fetchRecord = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await recordAPI.getRecord(id)
      setRecord(res.data)
      setFormData({
        service_content: res.data.service_content || '',
        notes: res.data.notes || '',
        status: res.data.status
      })
    } catch (err) {
      setError('加载记录详情失败，请重试')
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

  const handleSave = async () => {
    if (!formData.service_content.trim()) return
    setActionLoading(true)
    try {
      await recordAPI.updateRecord(id, formData)
      setEditMode(false)
      fetchRecord()
    } catch (err) {
      setError(err.response?.data?.error || '保存失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddPhoto = async () => {
    if (!photoUrl.trim()) return
    setActionLoading(true)
    try {
      await recordAPI.addPhoto(id, {
        url: photoUrl,
        description: photoDescription
      })
      setShowPhotoModal(false)
      setPhotoUrl('')
      setPhotoDescription('')
      fetchRecord()
    } catch (err) {
      setError(err.response?.data?.error || '上传失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    setActionLoading(true)
    try {
      await recordAPI.deletePhoto(id, photoId)
      fetchRecord()
    } catch (err) {
      setError(err.response?.data?.error || '删除失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddConsumable = async () => {
    if (!selectedConsumable || consumableQuantity < 1) return
    setActionLoading(true)
    try {
      const consumable = consumables.find(c => c.id === selectedConsumable)
      await recordAPI.addConsumable(id, {
        consumable_id: selectedConsumable,
        name: consumable?.name,
        quantity: consumableQuantity,
        unit_price: consumable?.price || 0
      })
      setShowConsumableModal(false)
      setSelectedConsumable('')
      setConsumableQuantity(1)
      fetchRecord()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddStep = async () => {
    if (!stepDescription.trim()) return
    setActionLoading(true)
    try {
      const updatedSteps = [...(record.steps || []), {
        description: stepDescription,
        timestamp: new Date().toISOString(),
        staff_name: user?.name || '服务人员'
      }]
      await recordAPI.updateRecord(id, { steps: updatedSteps })
      setShowStepModal(false)
      setStepDescription('')
      fetchRecord()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await recordAPI.updateRecord(id, { status: 'completed' })
      fetchRecord()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const totalConsumableCost = record?.consumables?.reduce((sum, c) => sum + (c.quantity * c.unit_price), 0) || 0

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="empty-state">
        <h3>记录不存在</h3>
        <button className="btn btn-primary" onClick={() => navigate('/records')}>返回列表</button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/records')}>← 返回</button>
          <h2>📋 服务记录详情</h2>
          <span className={`badge ${statusMap[record.status]?.className}`}>
            {statusMap[record.status]?.label}
          </span>
        </div>
        {record.status !== 'completed' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-success" onClick={handleComplete} disabled={actionLoading}>
              完成服务
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>基本信息</h3>
        </div>
        <div className="grid grid-3">
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>服务项目</p>
            <p style={{ fontWeight: '500' }}>{record.service_name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>宠物名称</p>
            <p style={{ fontWeight: '500' }}>{record.pet_name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>宠物主人</p>
            <p style={{ fontWeight: '500' }}>{record.owner_name}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>预约时间</p>
            <p style={{ fontWeight: '500' }}>{dayjs(record.appointment_time).format('YYYY-MM-DD HH:mm')}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>创建时间</p>
            <p style={{ fontWeight: '500' }}>{dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>服务人员</p>
            <p style={{ fontWeight: '500' }}>{record.staff_name || '未分配'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {['content', 'steps', 'photos', 'consumables'].map((tab) => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'content' && '服务内容'}
              {tab === 'steps' && `服务步骤 (${record.steps?.length || 0})`}
              {tab === 'photos' && `照片 (${record.photos?.length || 0})`}
              {tab === 'consumables' && `耗材使用 (${record.consumables?.length || 0})`}
            </div>
          ))}
        </div>

        {activeTab === 'content' && (
          <div>
            {editMode ? (
              <div>
                <div className="form-group">
                  <label>服务内容</label>
                  <textarea
                    value={formData.service_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_content: e.target.value }))}
                    placeholder="请输入服务内容"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>服务备注</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="请输入服务备注（可选）"
                  />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">待处理</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>取消</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={!formData.service_content.trim() || actionLoading}>
                    {actionLoading ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h4>服务内容</h4>
                  {record.status !== 'completed' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>编辑</button>
                  )}
                </div>
                <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {record.service_content || '暂无服务内容'}
                </p>
                {record.notes && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '8px' }}>备注</h4>
                    <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'steps' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>服务步骤</h4>
              {record.status !== 'completed' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowStepModal(true)}>
                  + 添加步骤
                </button>
              )}
            </div>
            {!record.steps || record.steps.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无步骤</h3>
                <p>还没有记录服务步骤</p>
              </div>
            ) : (
              <div className="timeline">
                {record.steps.map((step, index) => (
                  <div key={index} className="timeline-item completed">
                    <p style={{ fontWeight: '500', marginBottom: '4px' }}>{step.description}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {step.staff_name} · {dayjs(step.timestamp).format('YYYY-MM-DD HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>服务照片</h4>
              {record.status !== 'completed' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowPhotoModal(true)}>
                  + 上传照片
                </button>
              )}
            </div>
            {!record.photos || record.photos.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无照片</h3>
                <p>还没有上传服务照片</p>
              </div>
            ) : (
              <div className="photo-grid">
                {record.photos.map((photo) => (
                  <div key={photo.id} className="photo-item">
                    <img src={photo.url} alt={photo.description || '服务照片'} />
                    {record.status !== 'completed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          padding: '2px 6px',
                          fontSize: '10px'
                        }}
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={actionLoading}
                      >
                        删除
                      </button>
                    )}
                    {photo.description && (
                      <p style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: '11px',
                        margin: '0'
                      }}>
                        {photo.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consumables' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>耗材使用</h4>
              {record.status !== 'completed' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowConsumableModal(true)}>
                  + 添加耗材
                </button>
              )}
            </div>
            {!record.consumables || record.consumables.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无耗材</h3>
                <p>还没有记录耗材使用</p>
              </div>
            ) : (
              <div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>耗材名称</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.consumables.map((c, index) => (
                      <tr key={index}>
                        <td>{c.name}</td>
                        <td>{c.quantity}</td>
                        <td>¥{c.unit_price?.toFixed(2)}</td>
                        <td>¥{(c.quantity * c.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ fontWeight: '600', textAlign: 'right' }}>合计：</td>
                      <td style={{ fontWeight: '600' }}>¥{totalConsumableCost.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showStepModal && (
        <div className="modal-overlay" onClick={() => setShowStepModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加服务步骤</h3>
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
              <button className="btn btn-secondary" onClick={() => setShowStepModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleAddStep}
                disabled={!stepDescription.trim() || actionLoading}
              >
                {actionLoading ? '添加中...' : '确认添加'}
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
              <button className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleAddPhoto}
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
              <h3>添加耗材使用</h3>
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
              <button className="btn btn-secondary" onClick={() => setShowConsumableModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleAddConsumable}
                disabled={!selectedConsumable || consumableQuantity < 1 || actionLoading}
              >
                {actionLoading ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
