import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCaseDetail()
  }, [id])

  const loadCaseDetail = async () => {
    try {
      const res = await fetch(`/api/cases/${id}`)
      const data = await res.json()
      setCaseData(data)
    } catch (err) {
      console.error('加载案件详情失败', err)
      alert('加载案件详情失败')
    }
  }

  const openModal = (type, data = {}) => {
    setModalType(type)
    setFormData(data)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let url = ''
      if (modalType === 'investigation') {
        url = `/api/investigation/${id}/records`
      } else if (modalType === 'risk') {
        url = `/api/investigation/${id}/risk-assessments`
      } else if (modalType === 'related') {
        url = `/api/investigation/${id}/related-persons`
      } else if (modalType === 'mediation') {
        url = `/api/mediation/${id}/meetings`
      } else if (modalType === 'agreement') {
        url = `/api/agreement/${id}/agreements`
      } else if (modalType === 'followup') {
        url = `/api/agreement/${id}/follow-ups`
      }

      console.log('提交数据:', formData)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`
        try {
          const errData = await res.json()
          errorMsg += ': ' + (errData.message || errData.error)
        } catch (e) {
          errorMsg += ': ' + res.statusText
        }
        throw new Error(errorMsg)
      }

      const result = await res.json()
      alert('操作成功：' + result.message)
      closeModal()
      loadCaseDetail()
      if (activeTab === 'investigation') {
        loadInvestigationData()
      } else if (activeTab === 'mediation') {
        loadMediationData()
      } else if (activeTab === 'agreement') {
        loadAgreementData()
      }
    } catch (err) {
      console.error('操作失败:', err)
      alert('操作失败：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/cases/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!res.ok) {
        throw new Error('状态更新失败')
      }

      loadCaseDetail()
      alert('状态更新成功')
    } catch (err) {
      alert('状态更新失败：' + err.message)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      registered: { text: '待登记', class: 'badge-registered' },
      investigating: { text: '调查中', class: 'badge-investigating' },
      mediating: { text: '调解中', class: 'badge-mediating' },
      agreed: { text: '已达成协议', class: 'badge-agreed' },
      closed: { text: '已结案', class: 'badge-closed' },
      reopened: { text: '重新开启', class: 'badge-reopened' }
    }
    const s = statusMap[status] || { text: status, class: '' }
    return <span className={`badge ${s.class}`}>{s.text}</span>
  }

  const loadInvestigationData = async () => {
    try {
      const [recordsRes, personsRes, risksRes] = await Promise.all([
        fetch(`/api/investigation/${id}/records`),
        fetch(`/api/investigation/${id}/related-persons`),
        fetch(`/api/investigation/${id}/risk-assessments`)
      ])
      const records = await recordsRes.json()
      const persons = await personsRes.json()
      const risks = await risksRes.json()
      setCaseData(prev => ({
        ...prev,
        investigation_records: records,
        related_persons: persons,
        risk_assessments: risks
      }))
    } catch (err) {
      console.error('加载调查数据失败', err)
    }
  }

  const loadMediationData = async () => {
    try {
      const res = await fetch(`/api/mediation/${id}/meetings`)
      const data = await res.json()
      setCaseData(prev => ({ ...prev, mediation_meetings: data }))
    } catch (err) {
      console.error('加载调解数据失败', err)
    }
  }

  const loadAgreementData = async () => {
    try {
      const [agreementsRes, followupsRes] = await Promise.all([
        fetch(`/api/agreement/${id}/agreements`),
        fetch(`/api/agreement/${id}/follow-ups`)
      ])
      const agreements = await agreementsRes.json()
      const followups = await followupsRes.json()
      setCaseData(prev => ({
        ...prev,
        agreements: agreements,
        follow_ups: followups
      }))
    } catch (err) {
      console.error('加载协议数据失败', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'investigation' && !caseData?.investigation_records) {
      loadInvestigationData()
    } else if (activeTab === 'mediation' && !caseData?.mediation_meetings) {
      loadMediationData()
    } else if (activeTab === 'agreement' && !caseData?.agreements) {
      loadAgreementData()
    }
  }, [activeTab])

  if (!caseData) return <div>加载中...</div>

  return (
    <div>
      <div className="case-detail-header">
        <div>
          <h1 style={{ marginBottom: '8px' }}>案件详情 - {caseData.case_number}</h1>
          <div className="btn-group" style={{ marginTop: '12px' }}>
            {getStatusBadge(caseData.status)}
            {caseData.is_sensitive && <span className="badge badge-high">敏感</span>}
          </div>
        </div>
        <div className="btn-group">
          <button className="btn btn-sm btn-primary" onClick={() => updateStatus('investigating')}>开始调查</button>
          <button className="btn btn-sm btn-success" onClick={() => updateStatus('mediating')}>进入调解</button>
          <button className="btn btn-sm btn-secondary" onClick={() => updateStatus('closed')}>结案</button>
          <button className="btn btn-sm" onClick={() => navigate('/cases')}>返回列表</button>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</div>
        <div className={`tab ${activeTab === 'investigation' ? 'active' : ''}`} onClick={() => setActiveTab('investigation')}>调查过程</div>
        <div className={`tab ${activeTab === 'mediation' ? 'active' : ''}`} onClick={() => setActiveTab('mediation')}>调解会议</div>
        <div className={`tab ${activeTab === 'agreement' ? 'active' : ''}`} onClick={() => setActiveTab('agreement')}>协议与回访</div>
      </div>

      {activeTab === 'basic' && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>案件信息</h3>
            <div className="case-info">
              <div className="info-item">
                <span className="info-label">案件编号</span>
                <span className="info-value">{caseData.case_number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">矛盾类型</span>
                <span className="info-value">{caseData.conflict_type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">发生地点</span>
                <span className="info-value">{caseData.incident_location}</span>
              </div>
              <div className="info-item">
                <span className="info-label">发生时间</span>
                <span className="info-value">{caseData.incident_time || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">紧急程度</span>
                <span className="info-value">{caseData.urgency_level}</span>
              </div>
              <div className="info-item">
                <span className="info-label">风险等级</span>
                <span className="info-value">{caseData.risk_level}</span>
              </div>
              <div className="info-item">
                <span className="info-label">创建时间</span>
                <span className="info-value">{caseData.created_at}</span>
              </div>
            </div>
            <div className="form-group">
              <label>诉求内容</label>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                {caseData.appeal_content}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>当事人</h3>
            <div className="party-list">
              {caseData.parties?.map(party => (
                <div key={party.id} className="party-tag">
                  <strong>{party.name}</strong>
                  <span style={{ marginLeft: '8px', color: '#666' }}>{party.role}</span>
                  {party.phone && <span style={{ marginLeft: '8px' }}>| {party.phone}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investigation' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>走访记录</h3>
              <button className="btn btn-sm btn-primary" onClick={() => openModal('investigation')}>
                ➕ 添加记录
              </button>
            </div>
            {caseData.investigation_records?.map(record => (
              <div key={record.id} className="record-card">
                <div className="record-header">
                  <span className="record-title">{record.investigator} - {record.visit_location}</span>
                  <span className="record-time">{record.visit_time}</span>
                </div>
                <div>{record.content}</div>
              </div>
            ))}
            {(!caseData.investigation_records || caseData.investigation_records.length === 0) && (
              <div className="add-section" onClick={() => openModal('investigation')}>
                <span className="add-section-text">+ 添加走访记录</span>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>关联人员</h3>
              <button className="btn btn-sm btn-primary" onClick={() => openModal('related')}>
                ➕ 添加人员
              </button>
            </div>
            <div className="party-list">
              {caseData.related_persons?.map(person => (
                <div key={person.id} className="party-tag">
                  <strong>{person.name}</strong>
                  <span style={{ marginLeft: '8px', color: '#666' }}>{person.relation}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>风险评估</h3>
              <button className="btn btn-sm btn-primary" onClick={() => openModal('risk')}>
                ➕ 添加评估
              </button>
            </div>
            {caseData.risk_assessments?.map(assessment => (
              <div key={assessment.id} className="record-card">
                <div className="record-header">
                  <span className="record-title">
                    <span className={`badge badge-${assessment.risk_level}`}>{assessment.risk_level === 'high' ? '高风险' : assessment.risk_level === 'medium' ? '中风险' : '低风险'}</span>
                    {assessment.escalation_required && <span className="badge badge-high" style={{ marginLeft: '8px' }}>需升级</span>}
                  </span>
                  <span className="record-time">{assessment.assessment_time}</span>
                </div>
                <div>评估人：{assessment.assessor || '-'}</div>
                <div style={{ marginTop: '8px' }}>{assessment.assessment_content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mediation' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>调解会议</h3>
              <button className="btn btn-sm btn-primary" onClick={() => openModal('mediation')}>
                ➕ 添加会议
              </button>
            </div>
            {caseData.mediation_meetings?.map(meeting => (
              <div key={meeting.id} className="record-card">
                <div className="record-header">
                  <span className="record-title">{meeting.meeting_time} - {meeting.meeting_location}</span>
                  <span className="badge">{meeting.result || '待处理'}</span>
                </div>
                <div><strong>调解员：</strong>{meeting.mediator}</div>
                <div><strong>参与人：</strong>{meeting.participants || '-'}</div>
                <div style={{ marginTop: '8px' }}><strong>争议焦点：</strong>{meeting.dispute_focus || '-'}</div>
                <div style={{ marginTop: '8px' }}><strong>调解方案：</strong>{meeting.mediation_plan || '-'}</div>
                {meeting.next_step && (
                  <div style={{ marginTop: '8px' }}><strong>下一步：</strong>{meeting.next_step}</div>
                )}
              </div>
            ))}
            {(!caseData.mediation_meetings || caseData.mediation_meetings.length === 0) && (
              <div className="add-section" onClick={() => openModal('mediation')}>
                <span className="add-section-text">+ 添加调解会议</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'agreement' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>调解协议</h3>
              <button className="btn btn-sm btn-primary" onClick={() => openModal('agreement')}>
                ➕ 添加协议
              </button>
            </div>
            {caseData.agreements?.map(agreement => (
              <div key={agreement.id} className="record-card">
                <div className="record-header">
                  <span className="record-title">{agreement.agreement_number}</span>
                  <span className="record-time">{agreement.sign_date || '-'}</span>
                </div>
                <div style={{ marginTop: '8px' }}>{agreement.content}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px' }}>回访记录</h3>
              <button className="btn btn-sm btn-primary" onClick={() => openModal('followup')}>
                ➕ 添加回访
              </button>
            </div>
            {caseData.follow_ups?.map(followup => (
              <div key={followup.id} className="record-card">
                <div className="record-header">
                  <span className="record-title">{followup.follow_up_person}</span>
                  <span className="record-time">{followup.follow_up_time}</span>
                </div>
                <div><strong>结果：</strong>{followup.result}</div>
                {followup.has_dispute_again && (
                  <div style={{ marginTop: '8px', color: '#e74c3c' }}>
                    <strong>再次纠纷：</strong>{followup.dispute_again_description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'investigation' && '添加走访记录'}
                {modalType === 'risk' && '添加风险评估'}
                {modalType === 'related' && '添加关联人员'}
                {modalType === 'mediation' && '添加调解会议'}
                {modalType === 'agreement' && '添加调解协议'}
                {modalType === 'followup' && '添加回访记录'}
              </h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              {modalType === 'investigation' && (
                <>
                  <div className="form-group">
                    <label>走访时间</label>
                    <input type="datetime-local" value={formData.visit_time || ''} onChange={e => setFormData({ ...formData, visit_time: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>调查人</label>
                    <input type="text" value={formData.investigator || ''} onChange={e => setFormData({ ...formData, investigator: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>走访地点</label>
                    <input type="text" value={formData.visit_location || ''} onChange={e => setFormData({ ...formData, visit_location: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>记录内容</label>
                    <textarea rows="4" value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                  </div>
                </>
              )}
              {modalType === 'risk' && (
                <>
                  <div className="form-group">
                    <label>评估人</label>
                    <input type="text" value={formData.assessor || ''} onChange={e => setFormData({ ...formData, assessor: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>风险等级</label>
                    <select value={formData.risk_level || ''} onChange={e => setFormData({ ...formData, risk_level: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="low">低风险</option>
                      <option value="medium">中风险</option>
                      <option value="high">高风险</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>评估内容</label>
                    <textarea rows="4" value={formData.assessment_content || ''} onChange={e => setFormData({ ...formData, assessment_content: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.escalation_required || false} onChange={e => setFormData({ ...formData, escalation_required: e.target.checked })} />
                      需要升级街道处理
                    </label>
                  </div>
                </>
              )}
              {modalType === 'related' && (
                <>
                  <div className="form-group">
                    <label>姓名</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>电话</label>
                    <input type="text" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>与案件关系</label>
                    <input type="text" value={formData.relation || ''} onChange={e => setFormData({ ...formData, relation: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>描述</label>
                    <textarea rows="3" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </>
              )}
              {modalType === 'mediation' && (
                <>
                  <div className="form-group">
                    <label>会议时间</label>
                    <input type="datetime-local" value={formData.meeting_time || ''} onChange={e => setFormData({ ...formData, meeting_time: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>会议地点</label>
                    <input type="text" value={formData.meeting_location || ''} onChange={e => setFormData({ ...formData, meeting_location: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>调解员</label>
                    <input type="text" value={formData.mediator || ''} onChange={e => setFormData({ ...formData, mediator: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>参与人</label>
                    <input type="text" value={formData.participants || ''} onChange={e => setFormData({ ...formData, participants: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>争议焦点</label>
                    <textarea rows="2" value={formData.dispute_focus || ''} onChange={e => setFormData({ ...formData, dispute_focus: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>调解方案</label>
                    <textarea rows="3" value={formData.mediation_plan || ''} onChange={e => setFormData({ ...formData, mediation_plan: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>调解结果</label>
                    <input type="text" value={formData.result || ''} onChange={e => setFormData({ ...formData, result: e.target.value })} placeholder="如：达成一致/未达成一致" />
                  </div>
                  <div className="form-group">
                    <label>下一步安排</label>
                    <textarea rows="2" value={formData.next_step || ''} onChange={e => setFormData({ ...formData, next_step: e.target.value })} />
                  </div>
                </>
              )}
              {modalType === 'agreement' && (
                <>
                  <div className="form-group">
                    <label>协议编号</label>
                    <input type="text" value={formData.agreement_number || ''} onChange={e => setFormData({ ...formData, agreement_number: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>签署日期</label>
                    <input type="date" value={formData.sign_date || ''} onChange={e => setFormData({ ...formData, sign_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>协议内容</label>
                    <textarea rows="4" value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                  </div>
                </>
              )}
              {modalType === 'followup' && (
                <>
                  <div className="form-group">
                    <label>回访时间</label>
                    <input type="datetime-local" value={formData.follow_up_time || ''} onChange={e => setFormData({ ...formData, follow_up_time: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>回访人</label>
                    <input type="text" value={formData.follow_up_person || ''} onChange={e => setFormData({ ...formData, follow_up_person: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>回访结果</label>
                    <textarea rows="3" value={formData.result || ''} onChange={e => setFormData({ ...formData, result: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={formData.has_dispute_again || false} onChange={e => setFormData({ ...formData, has_dispute_again: e.target.checked })} />
                      是否再次发生纠纷
                    </label>
                  </div>
                  {formData.has_dispute_again && (
                    <div className="form-group">
                      <label>再次纠纷描述</label>
                      <textarea rows="2" value={formData.dispute_again_description || ''} onChange={e => setFormData({ ...formData, dispute_again_description: e.target.value })} />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaseDetail
