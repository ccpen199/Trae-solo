import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { petAPI } from '../api'

export default function PetDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pet, setPet] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showVaccineModal, setShowVaccineModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [vaccineForm, setVaccineForm] = useState({
    name: '',
    date: dayjs().format('YYYY-MM-DD'),
    next_date: '',
    manufacturer: '',
    batch_number: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPet()
  }, [id])

  const fetchPet = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await petAPI.getPet(id)
      setPet(res.data)
      setEditForm(res.data)
    } catch (err) {
      setError('加载宠物详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleVaccineChange = (e) => {
    const { name, value } = e.target
    setVaccineForm(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await petAPI.updatePet(id, editForm)
      setShowEditModal(false)
      fetchPet()
    } catch (err) {
      setError(err.response?.data?.error || '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVaccineSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await petAPI.addVaccine(id, vaccineForm)
      setShowVaccineModal(false)
      setVaccineForm({
        name: '',
        date: dayjs().format('YYYY-MM-DD'),
        next_date: '',
        manufacturer: '',
        batch_number: '',
        notes: ''
      })
      fetchPet()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVaccine = async (vaccineId) => {
    if (!confirm('确定要删除这条疫苗记录吗？')) return
    try {
      await petAPI.deleteVaccine(id, vaccineId)
      fetchPet()
    } catch (err) {
      setError('删除失败')
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

  if (!pet) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>宠物不存在</h3>
          <button className="btn btn-primary" onClick={() => navigate('/pets')}>
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pets')}>
            ← 返回
          </button>
          <h2>{pet.name} 的详情</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
          编辑信息
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
          <div style={{ fontSize: '96px' }}>{getSpeciesIcon(pet.species)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '28px' }}>{pet.name}</h2>
              <span className="badge badge-info">{getSpeciesLabel(pet.species)}</span>
              <span className="badge badge-secondary">
                {pet.gender === 'male' ? '♂ 公' : '♀ 母'}
              </span>
            </div>
            <div className="grid grid-3" style={{ fontSize: '14px' }}>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>品种：</strong>
                {pet.breed || '未知'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>年龄：</strong>
                {calculateAge(pet.birthday)}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>体重：</strong>
                {pet.weight ? `${pet.weight}kg` : '未知'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>出生日期：</strong>
                {pet.birthday ? dayjs(pet.birthday).format('YYYY-MM-DD') : '未知'}
              </div>
            </div>
            {pet.description && (
              <div style={{ marginTop: '16px' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>备注：</strong>
                <p style={{ marginTop: '8px' }}>{pet.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </div>
        <div
          className={`tab ${activeTab === 'vaccines' ? 'active' : ''}`}
          onClick={() => setActiveTab('vaccines')}
        >
          疫苗记录 ({pet.vaccines?.length || 0})
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <div className="card-header">
            <h3>详细信息</h3>
          </div>
          <table className="table">
            <tbody>
              <tr>
                <th style={{ width: '150px' }}>宠物名称</th>
                <td>{pet.name}</td>
              </tr>
              <tr>
                <th>物种</th>
                <td>{getSpeciesLabel(pet.species)}</td>
              </tr>
              <tr>
                <th>品种</th>
                <td>{pet.breed || '未填写'}</td>
              </tr>
              <tr>
                <th>性别</th>
                <td>{pet.gender === 'male' ? '公' : '母'}</td>
              </tr>
              <tr>
                <th>出生日期</th>
                <td>{pet.birthday ? dayjs(pet.birthday).format('YYYY-MM-DD') : '未填写'}</td>
              </tr>
              <tr>
                <th>年龄</th>
                <td>{calculateAge(pet.birthday)}</td>
              </tr>
              <tr>
                <th>体重</th>
                <td>{pet.weight ? `${pet.weight}kg` : '未填写'}</td>
              </tr>
              <tr>
                <th>备注</th>
                <td>{pet.description || '无'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'vaccines' && (
        <div className="card">
          <div className="card-header">
            <h3>疫苗记录</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowVaccineModal(true)}>
              + 添加疫苗
            </button>
          </div>
          {!pet.vaccines || pet.vaccines.length === 0 ? (
            <div className="empty-state">
              <h3>暂无疫苗记录</h3>
              <p>点击上方按钮添加疫苗记录</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>疫苗名称</th>
                  <th>接种日期</th>
                  <th>下次接种</th>
                  <th>生产厂家</th>
                  <th>批号</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pet.vaccines.map((vac) => (
                  <tr key={vac.id}>
                    <td><strong>{vac.name}</strong></td>
                    <td>{dayjs(vac.date).format('YYYY-MM-DD')}</td>
                    <td>{vac.next_date ? dayjs(vac.next_date).format('YYYY-MM-DD') : '-'}</td>
                    <td>{vac.manufacturer || '-'}</td>
                    <td>{vac.batch_number || '-'}</td>
                    <td>{vac.notes || '-'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteVaccine(vac.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>编辑宠物信息</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>宠物名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ''}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>物种 *</label>
                  <select name="species" value={editForm.species || 'dog'} onChange={handleEditChange}>
                    <option value="dog">狗狗</option>
                    <option value="cat">猫咪</option>
                    <option value="bird">鸟类</option>
                    <option value="rabbit">兔子</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>性别 *</label>
                  <select name="gender" value={editForm.gender || 'male'} onChange={handleEditChange}>
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
                    value={editForm.breed || ''}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={editForm.weight || ''}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>出生日期</label>
                <input
                  type="date"
                  name="birthday"
                  value={editForm.birthday ? dayjs(editForm.birthday).format('YYYY-MM-DD') : ''}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  name="description"
                  value={editForm.description || ''}
                  onChange={handleEditChange}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVaccineModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowVaccineModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>添加疫苗记录</h3>
              <button className="modal-close" onClick={() => setShowVaccineModal(false)}>&times;</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleVaccineSubmit}>
              <div className="form-group">
                <label>疫苗名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={vaccineForm.name}
                  onChange={handleVaccineChange}
                  placeholder="如：狂犬疫苗"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>接种日期 *</label>
                  <input
                    type="date"
                    name="date"
                    value={vaccineForm.date}
                    onChange={handleVaccineChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>下次接种日期</label>
                  <input
                    type="date"
                    name="next_date"
                    value={vaccineForm.next_date}
                    onChange={handleVaccineChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>生产厂家</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={vaccineForm.manufacturer}
                    onChange={handleVaccineChange}
                  />
                </div>
                <div className="form-group">
                  <label>批号</label>
                  <input
                    type="text"
                    name="batch_number"
                    value={vaccineForm.batch_number}
                    onChange={handleVaccineChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  name="notes"
                  value={vaccineForm.notes}
                  onChange={handleVaccineChange}
                  placeholder="接种反应、注意事项等"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowVaccineModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '添加中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
