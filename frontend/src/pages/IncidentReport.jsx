import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function IncidentReport() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    type: 'other',
    title: '',
    description: '',
    location: '',
    involved_persons: '',
    urgency: 'normal',
    reporter_name: '',
    reporter_phone: '',
    is_anonymous: false,
    parent_incident_id: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const data = { ...formData }
      if (!data.parent_incident_id) delete data.parent_incident_id
      
      await api.post('/incidents', data)
      setSuccess(true)
      setTimeout(() => navigate('/incidents'), 1500)
    } catch (err) {
      alert('提交失败：' + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
        <h2>事件上报成功！</h2>
        <p style={{ color: '#666', marginTop: 10 }}>正在跳转到事件列表...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>📝 事件上报</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label>事件类型 *</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="bullying">校园欺凌</option>
              <option value="injury">意外伤害</option>
              <option value="food_safety">食品安全</option>
              <option value="facility">设施故障</option>
              <option value="security">治安事件</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div className="form-group">
            <label>紧急程度 *</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange} required>
              <option value="critical">🆘 紧急 - 立即推送值班人员</option>
              <option value="high">⚠️ 高</option>
              <option value="normal">普通</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>事件标题 *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="简要描述事件"
            required
          />
        </div>

        <div className="form-group">
          <label>详细描述 *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="请详细描述事件经过..."
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>发生地点 *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="如：教学楼A栋302教室"
              required
            />
          </div>

          <div className="form-group">
            <label>关联历史事件（可选）</label>
            <input
              type="text"
              name="parent_incident_id"
              value={formData.parent_incident_id}
              onChange={handleChange}
              placeholder="输入事件ID用于关联重复事件"
            />
          </div>
        </div>

        <div className="form-group">
          <label>涉及人员（可选）</label>
          <input
            type="text"
            name="involved_persons"
            value={formData.involved_persons}
            onChange={handleChange}
            placeholder="涉及的学生、教师等人员信息"
          />
        </div>

        <div className="checkbox-group" style={{ marginBottom: 20 }}>
          <input
            type="checkbox"
            id="is_anonymous"
            name="is_anonymous"
            checked={formData.is_anonymous}
            onChange={handleChange}
          />
          <label htmlFor="is_anonymous" style={{ marginBottom: 0, cursor: 'pointer' }}>
            匿名上报（不显示上报人信息）
          </label>
        </div>

        {!formData.is_anonymous && (
          <div className="grid-2">
            <div className="form-group">
              <label>上报人姓名</label>
              <input
                type="text"
                name="reporter_name"
                value={formData.reporter_name}
                onChange={handleChange}
                placeholder="您的姓名"
              />
            </div>
            <div className="form-group">
              <label>联系电话</label>
              <input
                type="tel"
                name="reporter_phone"
                value={formData.reporter_phone}
                onChange={handleChange}
                placeholder="便于联系您了解详情"
              />
            </div>
          </div>
        )}

        {formData.urgency === 'critical' && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            ⚠️ 您选择了紧急级别，事件提交后将立即推送至值班人员！
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '提交中...' : '📤 提交事件'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            取消
          </button>
        </div>
      </form>
    </div>
  )
}