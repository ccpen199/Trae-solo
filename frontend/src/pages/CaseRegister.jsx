import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function CaseRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    conflict_type: '',
    incident_location: '',
    incident_time: '',
    appeal_content: '',
    urgency_level: 'normal',
    is_sensitive: false
  })
  const [parties, setParties] = useState([
    { name: '', phone: '', address: '', role: '申请人' }
  ])
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePartyChange = (index, field, value) => {
    const newParties = [...parties]
    newParties[index][field] = value
    setParties(newParties)
  }

  const addParty = () => {
    setParties([...parties, { name: '', phone: '', address: '', role: '被申请人' }])
  }

  const removeParty = (index) => {
    if (parties.length > 1) {
      setParties(parties.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validParties = parties.filter(p => p.name.trim())
    const partyKeys = new Set()
    for (const party of validParties) {
      const key = `${party.name.trim()}-${party.phone.trim() || ''}`
      if (partyKeys.has(key)) {
        alert(`当事人信息重复：姓名"${party.name}"和电话"${party.phone}"的组合已存在，请检查后重新输入`)
        return
      }
      partyKeys.add(key)
    }

    if (validParties.length === 0) {
      alert('请至少填写一位当事人的姓名')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          parties: validParties
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || '请求失败')
      }
      alert('案件登记成功！案件编号：' + data.case_number)
      navigate(`/cases/${data.id}`)
    } catch (err) {
      alert('登记失败：' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>案件登记</h1>
        <p>记录新的矛盾纠纷案件</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>基本信息</h3>
          <div className="form-row">
            <div className="form-group">
              <label>矛盾类型 <span style={{ color: '#e74c3c' }}>*</span></label>
              <select
                name="conflict_type"
                value={formData.conflict_type}
                onChange={handleChange}
                required
              >
                <option value="">请选择</option>
                <option value="邻里纠纷">邻里纠纷</option>
                <option value="家庭纠纷">家庭纠纷</option>
                <option value="物业纠纷">物业纠纷</option>
                <option value="土地纠纷">土地纠纷</option>
                <option value="经济纠纷">经济纠纷</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label>发生地点 <span style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                name="incident_location"
                value={formData.incident_location}
                onChange={handleChange}
                placeholder="请输入详细地址"
                required
              />
            </div>
            <div className="form-group">
              <label>发生时间</label>
              <input
                type="datetime-local"
                name="incident_time"
                value={formData.incident_time}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>紧急程度</label>
              <select
                name="urgency_level"
                value={formData.urgency_level}
                onChange={handleChange}
              >
                <option value="normal">普通</option>
                <option value="medium">一般</option>
                <option value="high">紧急</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '30px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
                <input
                  type="checkbox"
                  name="is_sensitive"
                  checked={formData.is_sensitive}
                  onChange={handleChange}
                />
                敏感案件（限制查看范围）
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>诉求内容 <span style={{ color: '#e74c3c' }}>*</span></label>
            <textarea
              name="appeal_content"
              value={formData.appeal_content}
              onChange={handleChange}
              rows="4"
              placeholder="请详细描述当事人的诉求"
              required
            />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px' }}>当事人信息</h3>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={addParty}
            >
              ➕ 添加当事人
            </button>
          </div>
          
          {parties.map((party, index) => (
            <div key={index} style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 500 }}>当事人 {index + 1}</span>
                {parties.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeParty(index)}
                  >
                    删除
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>姓名 <span style={{ color: '#e74c3c' }}>*</span></label>
                  <input
                    type="text"
                    value={party.name}
                    onChange={(e) => handlePartyChange(index, 'name', e.target.value)}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>电话</label>
                  <input
                    type="tel"
                    value={party.phone}
                    onChange={(e) => handlePartyChange(index, 'phone', e.target.value)}
                    placeholder="请输入电话"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>角色</label>
                  <select
                    value={party.role}
                    onChange={(e) => handlePartyChange(index, 'role', e.target.value)}
                  >
                    <option value="申请人">申请人</option>
                    <option value="被申请人">被申请人</option>
                    <option value="第三方">第三方</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                <label>地址</label>
                <input
                  type="text"
                  value={party.address}
                  onChange={(e) => handlePartyChange(index, 'address', e.target.value)}
                  placeholder="请输入地址"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="btn-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '120px' }}
          >
            {submitting ? '提交中...' : '提交登记'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/cases')}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}

export default CaseRegister
