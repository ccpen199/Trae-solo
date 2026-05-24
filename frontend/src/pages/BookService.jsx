import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { petAPI, serviceAPI, appointmentAPI } from '../api'

export default function BookService({ user }) {
  const navigate = useNavigate()
  const { serviceId } = useParams()
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pets, setPets] = useState([])
  const [service, setService] = useState(null)
  const [slots, setSlots] = useState([])
  const [validation, setValidation] = useState(null)
  const [formData, setFormData] = useState({
    pet_id: '',
    date: dayjs().format('YYYY-MM-DD'),
    slot_id: '',
    notes: '',
    need_transport: false,
    transport_address: ''
  })

  useEffect(() => {
    fetchData()
  }, [serviceId])

  useEffect(() => {
    if (formData.date && serviceId) {
      fetchSlots()
    }
  }, [formData.date, serviceId])

  useEffect(() => {
    if (formData.pet_id && formData.slot_id && serviceId) {
      validateAppointment()
    }
  }, [formData.pet_id, formData.slot_id])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [petsRes, serviceRes] = await Promise.all([
        petAPI.getPets(),
        serviceAPI.getService(serviceId)
      ])
      setPets(petsRes.data || [])
      setService(serviceRes.data)
    } catch (err) {
      setError('加载数据失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async () => {
    try {
      const res = await serviceAPI.getServiceSlots(serviceId, formData.date)
      setSlots(res.data || [])
    } catch (err) {
      console.error('获取时段失败:', err)
    }
  }

  const validateAppointment = async () => {
    setValidating(true)
    try {
      const res = await appointmentAPI.validateAppointment({
        service_id: serviceId,
        pet_id: formData.pet_id,
        slot_id: formData.slot_id,
        date: formData.date
      })
      setValidation(res.data)
    } catch (err) {
      setValidation({
        valid: false,
        errors: [err.response?.data?.error || '校验失败']
      })
    } finally {
      setValidating(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validation?.valid) {
      setError('请先通过业务校验')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await appointmentAPI.createAppointment({
        ...formData,
        service_id: serviceId
      })
      navigate(`/appointments/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || '提交预约失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const getValidationBadge = (item) => {
    if (item.valid) return { className: 'badge-success', icon: '✓', label: '通过' }
    if (item.warning) return { className: 'badge-warning', icon: '⚠', label: '警告' }
    return { className: 'badge-danger', icon: '✗', label: '不通过' }
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
        <h2>预约服务</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/services')}>
          返回服务列表
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>{service?.name || '服务详情'}</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {service?.description}
          </p>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-color)' }}>
            ¥{service?.price || 0}
          </div>
          <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            时长: {service?.duration || 60}分钟 | 类型: {service?.type === 'grooming' ? '洗护' : service?.type === 'beauty' ? '美容' : '寄养'}
          </div>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h3>填写预约信息</h3>
          </div>

          <div className="form-group">
            <label>选择宠物</label>
            <select
              name="pet_id"
              value={formData.pet_id}
              onChange={handleChange}
              required
            >
              <option value="">请选择宠物</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.breed} · {pet.weight}kg)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>预约日期</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              min={dayjs().format('YYYY-MM-DD')}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>选择时段</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {slots.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                  该日期暂无可用时段
                </p>
              ) : (
                slots.map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    className={`btn ${formData.slot_id === slot.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFormData(prev => ({ ...prev, slot_id: slot.id }))}
                    disabled={!slot.available}
                    style={{ fontSize: '12px', padding: '8px' }}
                  >
                    {slot.start_time} - {slot.end_time}
                    {!slot.available && <br />}
                    {!slot.available && <span style={{ fontSize: '10px' }}>已满</span>}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="need_transport"
                checked={formData.need_transport}
                onChange={handleChange}
                style={{ width: 'auto', marginBottom: 0 }}
              />
              需要上门接送服务
            </label>
          </div>

          {formData.need_transport && (
            <div className="form-group">
              <label>接送地址</label>
              <input
                type="text"
                name="transport_address"
                value={formData.transport_address}
                onChange={handleChange}
                placeholder="请输入详细地址"
                required={formData.need_transport}
              />
            </div>
          )}

          <div className="form-group">
            <label>备注信息</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="如有特殊需求请备注..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting || !validation?.valid}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {submitting ? '提交中...' : '确认预约'}
          </button>
        </form>
      </div>

      {validation && (
        <div className="card">
          <div className="card-header">
            <h3>业务校验结果</h3>
            {validating && <span className="badge badge-info">校验中...</span>}
          </div>
          <div className="grid grid-4">
            <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {getValidationBadge(validation.vaccine).icon}
              </div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>疫苗检查</div>
              <span className={`badge ${getValidationBadge(validation.vaccine).className}`}>
                {getValidationBadge(validation.vaccine).label}
              </span>
              {validation.vaccine.message && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {validation.vaccine.message}
                </p>
              )}
            </div>
            <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {getValidationBadge(validation.size).icon}
              </div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>体型适配</div>
              <span className={`badge ${getValidationBadge(validation.size).className}`}>
                {getValidationBadge(validation.size).label}
              </span>
              {validation.size.message && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {validation.size.message}
                </p>
              )}
            </div>
            <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {getValidationBadge(validation.aggressive).icon}
              </div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>攻击性评估</div>
              <span className={`badge ${getValidationBadge(validation.aggressive).className}`}>
                {getValidationBadge(validation.aggressive).label}
              </span>
              {validation.aggressive.message && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {validation.aggressive.message}
                </p>
              )}
            </div>
            <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {getValidationBadge(validation.capacity).icon}
              </div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>门店容量</div>
              <span className={`badge ${getValidationBadge(validation.capacity).className}`}>
                {getValidationBadge(validation.capacity).label}
              </span>
              {validation.capacity.message && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {validation.capacity.message}
                </p>
              )}
            </div>
          </div>
          {validation.errors && validation.errors.length > 0 && (
            <div className="alert alert-error" style={{ marginTop: '16px' }}>
              {validation.errors.join('；')}
            </div>
          )}
          {validation.warnings && validation.warnings.length > 0 && (
            <div className="alert alert-warning" style={{ marginTop: '16px' }}>
              {validation.warnings.join('；')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
