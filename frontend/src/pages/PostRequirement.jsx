import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function PostRequirement() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_type: 'fixed',
    budget_fixed: '',
    budget_min: '',
    budget_max: '',
    location: '',
    service_date: '',
    service_duration: '',
    delivery_deadline: '',
    deliverables: ''
  })

  useEffect(() => {
    api.get('/skills/categories').then(res => setCategories(res.data))
  }, [])

  useEffect(() => {
    if (formData.category) {
      api.get(`/skills/tags?category=${encodeURIComponent(formData.category)}`).then(res => setSkills(res.data))
    }
  }, [formData.category])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleSkill = (skill) => {
    if (selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const deliverables = formData.deliverables.split(/[,，\n]/).filter(d => d.trim())
      const res = await api.post('/requirements', {
        ...formData,
        skill_tags: selectedSkills,
        deliverables,
        budget_fixed: parseFloat(formData.budget_fixed) || 0,
        budget_min: parseFloat(formData.budget_min) || 0,
        budget_max: parseFloat(formData.budget_max) || 0
      })
      navigate(`/requirements/${res.data.id}`)
    } catch (err) {
      alert('发布失败: ' + (err.response?.data?.error || '未知错误'))
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '32px' }}>发布服务需求</h1>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">需求标题 *</label>
          <input
            type="text"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            placeholder="请简要描述您的需求"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">服务类别 *</label>
          <select
            name="category"
            className="form-input"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">请选择类别</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {formData.category && (
          <div className="form-group">
            <label className="form-label">技能标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map(skill => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  style={{
                    padding: '6px 14px',
                    border: `1px solid ${selectedSkills.find(s => s.id === skill.id) ? '#2563eb' : '#d1d5db'}`,
                    borderRadius: '20px',
                    background: selectedSkills.find(s => s.id === skill.id) ? '#eff6ff' : 'white',
                    color: selectedSkills.find(s => s.id === skill.id) ? '#2563eb' : '#4b5563',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">需求描述 *</label>
          <textarea
            name="description"
            className="form-input"
            value={formData.description}
            onChange={handleChange}
            placeholder="详细描述您的服务需求..."
            rows={6}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">预算类型 *</label>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="budget_type"
                value="fixed"
                checked={formData.budget_type === 'fixed'}
                onChange={handleChange}
              />
              固定价格
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="budget_type"
                value="range"
                checked={formData.budget_type === 'range'}
                onChange={handleChange}
              />
              价格范围
            </label>
          </div>
        </div>

        {formData.budget_type === 'fixed' ? (
          <div className="form-group">
            <label className="form-label">预算金额 (元)</label>
            <input
              type="number"
              name="budget_fixed"
              className="form-input"
              value={formData.budget_fixed}
              onChange={handleChange}
              placeholder="请输入预算金额"
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">最低预算 (元)</label>
              <input
                type="number"
                name="budget_min"
                className="form-input"
                value={formData.budget_min}
                onChange={handleChange}
                placeholder="最低"
              />
            </div>
            <div className="form-group">
              <label className="form-label">最高预算 (元)</label>
              <input
                type="number"
                name="budget_max"
                className="form-input"
                value={formData.budget_max}
                onChange={handleChange}
                placeholder="最高"
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">服务地点</label>
          <input
            type="text"
            name="location"
            className="form-input"
            value={formData.location}
            onChange={handleChange}
            placeholder="请输入服务地点"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">服务时间</label>
            <input
              type="datetime-local"
              name="service_date"
              className="form-input"
              value={formData.service_date}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">交付截止日期</label>
            <input
              type="datetime-local"
              name="delivery_deadline"
              className="form-input"
              value={formData.delivery_deadline}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">交付物（用逗号或换行分隔）</label>
          <textarea
            name="deliverables"
            className="form-input"
            value={formData.deliverables}
            onChange={handleChange}
            placeholder="例如: 源文件, 成品视频, 设计稿"
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
          发布需求
        </button>
      </form>
    </div>
  )
}
