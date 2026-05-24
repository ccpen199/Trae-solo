import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { petAPI } from '../api'

export default function Pets({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pets, setPets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    gender: 'male',
    birthday: '',
    weight: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPets()
  }, [])

  const fetchPets = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await petAPI.getPets()
      setPets(res.data.items || res.data || [])
    } catch (err) {
      setError('加载宠物列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await petAPI.createPet(formData)
      setShowModal(false)
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        gender: 'male',
        birthday: '',
        weight: '',
        description: ''
      })
      fetchPets()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getSpeciesIcon = (species) => {
    const icons = { dog: '🐕', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' }
    return icons[species] || '🐾'
  }

  const getSpeciesLabel = (species) => {
    const labels = { dog: '狗狗', cat: '猫咪', bird: '鸟类', rabbit: '兔子', other: '其他' }
    return labels[species] || species
  }

  const calculateAge = (birthday) => {
    if (!birthday) return '未知'
    const birth = dayjs(birthday)
    const now = dayjs()
    const years = now.diff(birth, 'year')
    const months = now.diff(birth, 'month') % 12
    if (years > 0) return `${years}岁${months > 0 ? `${months}个月` : ''}`
    if (months > 0) return `${months}个月`
    return '不到1个月'
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
        <h2>我的宠物</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增宠物
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {pets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐾</div>
            <h3>还没有添加宠物</h3>
            <p>点击右上角按钮添加您的第一只宠物</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => setShowModal(true)}
            >
              立即添加
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/pets/${pet.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px' }}>{getSpeciesIcon(pet.species)}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{pet.name}</h3>
                  <span className="badge badge-info">{getSpeciesLabel(pet.species)}</span>
                </div>
              </div>
              <div className="form-row" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>品种：</strong>
                  {pet.breed || '未知'}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>年龄：</strong>
                  {calculateAge(pet.birthday)}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>性别：</strong>
                  {pet.gender === 'male' ? '公' : '母'}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>体重：</strong>
                  {pet.weight ? `${pet.weight}kg` : '未知'}
                </div>
              </div>
              {pet.description && (
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {pet.description}
                </p>
              )}
              {pet.vaccines && pet.vaccines.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <span className="badge badge-success">
                    疫苗记录：{pet.vaccines.length}条
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>添加新宠物</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>宠物名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="请输入宠物名称"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>物种 *</label>
                  <select name="species" value={formData.species} onChange={handleChange}>
                    <option value="dog">狗狗</option>
                    <option value="cat">猫咪</option>
                    <option value="bird">鸟类</option>
                    <option value="rabbit">兔子</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>性别 *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="male">公</option>
                    <option value="female">母</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>品种</label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    placeholder="如：金毛、布偶"
                  />
                </div>
                <div className="form-group">
                  <label>体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="如：5.5"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>出生日期</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="填写宠物习性、过敏史等信息"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '提交中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
