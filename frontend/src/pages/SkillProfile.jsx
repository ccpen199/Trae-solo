import React, { useState, useEffect } from 'react'
import api from '../api'

export default function SkillProfile() {
  const [skills, setSkills] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [categories, setCategories] = useState([])
  const [skillTags, setSkillTags] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [newSkill, setNewSkill] = useState({
    skill_tag_id: '',
    proficiency_level: 1,
    years_experience: 0,
    hourly_rate: 0
  })
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    client_name: '',
    completion_date: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      api.get(`/skills/tags?category=${encodeURIComponent(selectedCategory)}`).then(res => setSkillTags(res.data))
    }
  }, [selectedCategory])

  const loadData = () => {
    api.get('/skills/provider/skills').then(res => setSkills(res.data))
    api.get('/skills/portfolios/me').then(res => setPortfolios(res.data))
    api.get('/skills/categories').then(res => setCategories(res.data))
  }

  const handleAddSkill = async () => {
    try {
      await api.post('/skills/provider/skills', newSkill)
      setShowAddSkill(false)
      setNewSkill({ skill_tag_id: '', proficiency_level: 1, years_experience: 0, hourly_rate: 0 })
      loadData()
    } catch (err) {
      alert('添加失败')
    }
  }

  const handleDeleteSkill = async (id) => {
    if (confirm('确定删除此技能？')) {
      await api.delete(`/skills/provider/skills/${id}`)
      loadData()
    }
  }

  const handleAddPortfolio = async () => {
    try {
      await api.post('/skills/portfolios', newPortfolio)
      setShowAddPortfolio(false)
      setNewPortfolio({ title: '', description: '', client_name: '', completion_date: '' })
      loadData()
    } catch (err) {
      alert('添加失败')
    }
  }

  const handleDeletePortfolio = async (id) => {
    if (confirm('确定删除此作品集？')) {
      await api.delete(`/skills/portfolios/${id}`)
      loadData()
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>技能档案</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>我的技能</h2>
            <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '14px' }} onClick={() => setShowAddSkill(true)}>
              + 添加技能
            </button>
          </div>

          {skills.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {skills.map(skill => (
                <div key={skill.id} style={{
                  padding: '16px',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{skill.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                      {skill.category} · 熟练{skill.proficiency_level}级 · {skill.years_experience}年经验 · ¥{skill.hourly_rate}/小时
                    </div>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={() => handleDeleteSkill(skill.id)}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
              暂无技能，点击上方按钮添加
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>作品集</h2>
            <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '14px' }} onClick={() => setShowAddPortfolio(true)}>
              + 添加作品
            </button>
          </div>

          {portfolios.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {portfolios.map(item => (
                <div key={item.id} style={{
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    作品预览
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '8px' }}>
                      {item.description?.slice(0, 30)}...
                    </div>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '4px 12px', fontSize: '12px', width: '100%' }}
                      onClick={() => handleDeletePortfolio(item.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>
              暂无作品，点击上方按钮添加
            </div>
          )}
        </div>
      </div>

      {showAddSkill && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '20px' }}>添加技能</h3>
            <div className="form-group">
              <label className="form-label">技能类别</label>
              <select
                className="form-input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">请选择类别</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">技能标签</label>
              <select
                className="form-input"
                value={newSkill.skill_tag_id}
                onChange={(e) => setNewSkill({ ...newSkill, skill_tag_id: e.target.value })}
              >
                <option value="">请选择技能</option>
                {skillTags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">熟练度</label>
                <select
                  className="form-input"
                  value={newSkill.proficiency_level}
                  onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map(l => (
                    <option key={l} value={l}>{l}级</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">经验(年)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newSkill.years_experience}
                  onChange={(e) => setNewSkill({ ...newSkill, years_experience: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">时薪(元)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newSkill.hourly_rate}
                  onChange={(e) => setNewSkill({ ...newSkill, hourly_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddSkill(false)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddSkill}>添加</button>
            </div>
          </div>
        </div>
      )}

      {showAddPortfolio && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '20px' }}>添加作品集</h3>
            <div className="form-group">
              <label className="form-label">作品标题 *</label>
              <input
                type="text"
                className="form-input"
                value={newPortfolio.title}
                onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                placeholder="请输入作品标题"
              />
            </div>
            <div className="form-group">
              <label className="form-label">作品描述</label>
              <textarea
                className="form-input"
                rows={3}
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                placeholder="描述作品内容"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">客户名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPortfolio.client_name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, client_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">完成日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={newPortfolio.completion_date}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, completion_date: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddPortfolio(false)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddPortfolio}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
