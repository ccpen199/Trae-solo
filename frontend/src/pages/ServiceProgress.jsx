import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { recordAPI, appointmentAPI } from '../api'

const GROOMING_STEPS = [
  { key: 'checkin', name: '签到接待', icon: '📋' },
  { key: 'bath', name: '清洗护理', icon: '🛁' },
  { key: 'dry', name: '吹干梳理', icon: '💨' },
  { key: 'cut', name: '修剪造型', icon: '✂️' },
  { key: 'beauty', name: '美容装饰', icon: '✨' },
  { key: 'checkout', name: '完成交付', icon: '✅' }
]

const BEAUTY_STEPS = [
  { key: 'checkin', name: '签到接待', icon: '📋' },
  { key: 'clean', name: '清洁护理', icon: '🧼' },
  { key: 'style', name: '造型设计', icon: '💇' },
  { key: 'dye', name: '染色处理', icon: '🎨' },
  { key: 'decorate', name: '装饰点缀', icon: '💎' },
  { key: 'checkout', name: '完成交付', icon: '✅' }
]

export default function ServiceProgress({ user }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)
  const [appointment, setAppointment] = useState(null)
  const [activeTab, setActiveTab] = useState('steps')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [aptRes, recRes] = await Promise.all([
        appointmentAPI.getAppointment(id),
        recordAPI.getRecords({ appointment_id: id }).catch(() => ({ data: null }))
      ])
      setAppointment(aptRes.data)
      const recordList = recRes?.data?.items || recRes?.data
      setRecord(Array.isArray(recordList) ? recordList[0] : recordList)
    } catch (err) {
      setError('加载服务进度失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  const getSteps = () => {
    const serviceType = appointment?.service_type || appointment?.type || 'grooming'
    const stepsTemplate = serviceType === 'beauty' ? BEAUTY_STEPS : GROOMING_STEPS
    const recordSteps = record?.steps || []

    return stepsTemplate.map((step, idx) => {
      const recordStep = recordSteps.find(s => s.key === step.key || s.name === step.name)
      const stepIndex = recordSteps.findIndex(s => s.key === step.key || s.name === step.name)
      const currentStepIndex = recordSteps.findIndex(s => s.current || (s.completed && !recordSteps[recordSteps.indexOf(s) + 1]?.completed))

      return {
        ...step,
        ...recordStep,
        completed: recordStep?.completed || false,
        current: stepIndex === currentStepIndex,
        completed_at: recordStep?.completed_at
      }
    })
  }

  const getProgressPercent = () => {
    const steps = getSteps()
    const completed = steps.filter(s => s.completed).length
    return Math.round((completed / steps.length) * 100)
  }

  const getPhotoByStep = (stepKey) => {
    return record?.photos?.filter(p => p.step === stepKey) || []
  }

  const getAllPhotos = () => {
    return record?.photos || []
  }

  const getExceptions = () => {
    return record?.exceptions || []
  }

  const handleAddPhoto = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('photo', file)
        formData.append('step', 'customer')

        await recordAPI.addPhoto(record.id, formData)
        fetchData()
      }
      input.click()
    } catch (err) {
      setError(err.response?.data?.error || '上传照片失败，请重试')
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

  const steps = getSteps()
  const progress = getProgressPercent()
  const photos = getAllPhotos()
  const exceptions = getExceptions()

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>服务进度</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {appointment?.service_name || appointment?.service_type} · {appointment?.pet_name || '宠物'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <button className="btn btn-primary" onClick={handleAddPhoto}>
              上传照片
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate(`/appointments/${id}`)}>
            返回详情
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontWeight: 500 }}>服务进度</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-color)' }}>
            {progress}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${progress === 100 ? 'success' : ''}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          预计完成: {appointment?.estimated_end_time
            ? dayjs(appointment.estimated_end_time).format('YYYY-MM-DD HH:mm')
            : dayjs(appointment?.appointment_time).add(appointment?.duration || 60, 'minute').format('YYYY-MM-DD HH:mm')}
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div className={`tab ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>服务步骤</div>
          <div className={`tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
            服务照片 {photos.length > 0 && `(${photos.length})`}
          </div>
          {exceptions.length > 0 && (
            <div className={`tab ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => setActiveTab('exceptions')}>
              异常情况 <span className="badge badge-danger">{exceptions.length}</span>
            </div>
          )}
        </div>

        {activeTab === 'steps' && (
          <div className="timeline">
            {steps.map((step, idx) => (
              <div
                key={step.key}
                className={`timeline-item ${step.completed ? 'completed' : step.current ? '' : 'pending'}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ fontSize: '20px' }}>{step.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: step.current ? 600 : step.completed ? 500 : 400 }}>
                        {step.name}
                      </span>
                      {step.completed && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {step.completed_at ? dayjs(step.completed_at).format('HH:mm') : '--'}
                        </span>
                      )}
                      {step.current && (
                        <span className="badge badge-primary">进行中</span>
                      )}
                    </div>
                    {step.notes && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {step.notes}
                      </p>
                    )}
                    {step.completed && getPhotoByStep(step.key).length > 0 && (
                      <div className="photo-grid" style={{ marginTop: '8px', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
                        {getPhotoByStep(step.key).map((photo, pIdx) => (
                          <div key={pIdx} className="photo-item" style={{ aspectRatio: '1' }}>
                            <img src={photo.url} alt={`${step.name} ${pIdx + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {photos.length === 0 ? (
              <div className="empty-state">
                <h3>暂无服务照片</h3>
                <p>服务进行中将陆续上传服务照片</p>
              </div>
            ) : (
              <div className="photo-grid">
                {photos.map((photo, idx) => (
                  <div key={idx} className="photo-item">
                    <img src={photo.url} alt={`服务照片 ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div>
            {exceptions.length === 0 ? (
              <div className="empty-state">
                <h3>暂无异常情况</h3>
                <p>服务过程一切正常</p>
              </div>
            ) : (
              <div>
                {exceptions.map((ex, idx) => (
                  <div key={idx} className="alert alert-warning">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--warning-color)' }}>
                        ⚠️ {ex.type || '异常情况'}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {ex.time ? dayjs(ex.time).format('YYYY-MM-DD HH:mm') : ''}
                      </span>
                    </div>
                    <p style={{ marginBottom: '8px' }}>{ex.description}</p>
                    {ex.handled && (
                      <div style={{ fontSize: '13px', color: 'var(--success-color)', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        ✓ 已处理: {ex.handled_note || '已妥善处理'}
                      </div>
                    )}
                    {!ex.handled && (
                      <div style={{ fontSize: '13px', color: 'var(--warning-color)' }}>
                        ⏳ 处理中...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {record?.notes && (
        <div className="card">
          <div className="card-header">
            <h3>服务备注</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>{record.notes}</p>
        </div>
      )}
    </div>
  )
}
