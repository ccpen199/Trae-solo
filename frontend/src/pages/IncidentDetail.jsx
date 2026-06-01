import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [incident, setIncident] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [newRecord, setNewRecord] = useState('')
  const [recordType, setRecordType] = useState('note')
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [collaboratorRole, setCollaboratorRole] = useState('')
  const [parentForm, setParentForm] = useState({ student_name: '', parent_name: '', parent_phone: '', notification_content: '' })
  const [medicalForm, setMedicalForm] = useState({ patient_name: '', symptoms: '', diagnosis: '', treatment: '', medicines: '', notes: '' })
  const [reviewForm, setReviewForm] = useState({ cause_analysis: '', corrective_actions: '', responsible_person: '', follow_up_tasks: '', conclusion: '' })

  useEffect(() => {
    loadIncident()
    loadUsers()
  }, [id])

  const loadIncident = async () => {
    try {
      const res = await api.get(`/incidents/${id}`)
      setIncident(res.data)
      if (res.data.review) {
        setReviewForm(res.data.review)
      }
    } catch (err) {
      console.error('加载事件详情失败', err)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (err) {
      console.error('加载用户列表失败', err)
    }
  }

  const updateStatus = async (status) => {
    await api.put(`/incidents/${id}/status`, { status })
    loadIncident()
  }

  const addRecord = async () => {
    if (!newRecord.trim()) return
    await api.post(`/incidents/${id}/records`, { record_type: recordType, content: newRecord })
    setNewRecord('')
    loadIncident()
  }

  const addCollaborator = async () => {
    if (!selectedUser) return
    await api.post(`/incidents/${id}/collaborators`, { user_id: selectedUser, role: collaboratorRole })
    setSelectedUser('')
    setCollaboratorRole('')
    loadIncident()
  }

  const addParentNotification = async () => {
    await api.post(`/incidents/${id}/parent-notifications`, parentForm)
    setParentForm({ student_name: '', parent_name: '', parent_phone: '', notification_content: '' })
    loadIncident()
  }

  const addMedicalRecord = async () => {
    await api.post(`/incidents/${id}/medical-records`, medicalForm)
    setMedicalForm({ patient_name: '', symptoms: '', diagnosis: '', treatment: '', medicines: '', notes: '' })
    loadIncident()
  }

  const submitReview = async () => {
    await api.post(`/incidents/${id}/reviews`, reviewForm)
    loadIncident()
    alert('复盘归档完成，事件已结案')
  }

  if (!incident) return <div className="card">加载中...</div>

  const isOverdue = incident.status !== 'closed' && new Date(incident.deadline) < new Date()

  return (
    <div>
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← 返回列表
      </button>

      <div className="card">
        <div className="incident-header">
          <div className="flex-between">
            <div>
              <div className="incident-title">{incident.title}</div>
              <div className="incident-meta">
                <span>编号：{incident.incident_no}</span>
                <span>类型：{getTypeLabel(incident.type)}</span>
                <span>地点：{incident.location}</span>
                <span className={`badge badge-${incident.urgency}`}>{getUrgencyLabel(incident.urgency)}</span>
                <span className={`badge badge-${incident.status}`}>{getStatusLabel(incident.status)}</span>
                {isOverdue && <span className="badge badge-critical">⚠️ 已超时</span>}
              </div>
            </div>
            <div className="flex">
              {incident.status === 'pending' && (
                <button className="btn btn-primary btn-sm" onClick={() => updateStatus('processing')}>
                  开始处理
                </button>
              )}
              {incident.status === 'processing' && (
                <button className="btn btn-success btn-sm" onClick={() => setActiveTab('review')}>
                  完成复盘结案
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
          <button className={`tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>处置记录</button>
          <button className={`tab ${activeTab === 'collaborators' ? 'active' : ''}`} onClick={() => setActiveTab('collaborators')}>协同人员</button>
          <button className={`tab ${activeTab === 'parents' ? 'active' : ''}`} onClick={() => setActiveTab('parents')}>家长通知</button>
          <button className={`tab ${activeTab === 'medical' ? 'active' : ''}`} onClick={() => setActiveTab('medical')}>医疗记录</button>
          <button className={`tab ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}>复盘归档</button>
          {incident.relatedIncidents?.length > 1 && (
            <button className={`tab ${activeTab === 'related' ? 'active' : ''}`} onClick={() => setActiveTab('related')}>关联事件</button>
          )}
        </div>

        {activeTab === 'basic' && (
          <div>
            <div className="grid-2">
              <div>
                <h3 className="section-title">事件描述</h3>
                <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{incident.description || '无'}</p>
                
                <h3 className="section-title" style={{ marginTop: 24 }}>涉及人员</h3>
                <p>{incident.involved_persons || '无'}</p>
              </div>
              <div>
                <h3 className="section-title">处理信息</h3>
                <div style={{ lineHeight: 2 }}>
                  <div><strong>责任部门：</strong>{getDeptLabel(incident.assigned_department)}</div>
                  <div><strong>处理时限：</strong>{new Date(incident.deadline).toLocaleString('zh-CN')}</div>
                  <div><strong>上报人：</strong>{incident.is_anonymous ? '（匿名）' : (incident.reporter_name || '未知')}</div>
                  <div><strong>联系电话：</strong>{incident.reporter_phone || '-'}</div>
                  <div><strong>上报时间：</strong>{new Date(incident.created_at).toLocaleString('zh-CN')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div className="flex" style={{ marginBottom: 12 }}>
                <select 
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  style={{ width: 120, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}
                >
                  <option value="note">备注</option>
                  <option value="status">状态变更</option>
                  <option value="measure">处理措施</option>
                  <option value="scene">现场记录</option>
                </select>
              </div>
              <div className="flex">
                <textarea
                  value={newRecord}
                  onChange={(e) => setNewRecord(e.target.value)}
                  placeholder="输入记录内容..."
                  style={{ flex: 1, minHeight: 60 }}
                />
                <button className="btn btn-primary" onClick={addRecord} style={{ alignSelf: 'flex-end', marginLeft: 12 }}>
                  添加记录
                </button>
              </div>
            </div>

            <div className="timeline">
              {incident.records?.length === 0 ? (
                <p style={{ color: '#999' }}>暂无记录</p>
              ) : (
                incident.records.map(record => (
                  <div key={record.id} className="timeline-item">
                    <div className="time">
                      {new Date(record.created_at).toLocaleString('zh-CN')} · {record.creator_name || '系统'}
                      <span className="tag" style={{ marginLeft: 8 }}>{getRecordTypeLabel(record.record_type)}</span>
                    </div>
                    <div className="content">{record.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div>
            <div className="flex" style={{ marginBottom: 20 }}>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}
              >
                <option value="">选择协同人员...</option>
                {users.filter(u => !incident.collaborators?.find(c => c.user_id === u.id)).map(user => (
                  <option key={user.id} value={user.id}>{user.name} - {getRoleLabel(user.role)} ({user.department})</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="角色（如：负责人、协助等）"
                value={collaboratorRole}
                onChange={(e) => setCollaboratorRole(e.target.value)}
                style={{ width: 180, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', margin: '0 12px' }}
              />
              <button className="btn btn-primary" onClick={addCollaborator}>添加</button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>部门</th>
                  <th>添加时间</th>
                </tr>
              </thead>
              <tbody>
                {incident.collaborators?.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无协同人员</td></tr>
                ) : (
                  incident.collaborators.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.role || '-'}</td>
                      <td>{c.department}</td>
                      <td style={{ fontSize: 12 }}>{new Date(c.added_at).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'parents' && (
          <div>
            <div className="card" style={{ background: '#f9fafb', marginBottom: 20 }}>
              <h4 style={{ marginBottom: 12 }}>新建家长通知</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label>学生姓名 *</label>
                  <input value={parentForm.student_name} onChange={(e) => setParentForm({ ...parentForm, student_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>家长姓名</label>
                  <input value={parentForm.parent_name} onChange={(e) => setParentForm({ ...parentForm, parent_name: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>家长电话</label>
                <input value={parentForm.parent_phone} onChange={(e) => setParentForm({ ...parentForm, parent_phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>通知内容</label>
                <textarea value={parentForm.notification_content} onChange={(e) => setParentForm({ ...parentForm, notification_content: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={addParentNotification}>发送通知记录</button>
            </div>

            <div>
              {incident.parentNotifications?.length === 0 ? (
                <p style={{ color: '#999' }}>暂无家长通知记录</p>
              ) : (
                incident.parentNotifications.map(p => (
                  <div key={p.id} className="card" style={{ marginBottom: 12 }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <strong>{p.student_name} 的家长</strong>
                      <span style={{ fontSize: 12, color: '#888' }}>{new Date(p.notified_at).toLocaleString('zh-CN')}</span>
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      {p.parent_name && <span>家长：{p.parent_name}</span>}
                      {p.parent_phone && <span style={{ marginLeft: 16 }}>电话：{p.parent_phone}</span>}
                    </div>
                    {p.notification_content && <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>{p.notification_content}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div>
            <div className="card" style={{ background: '#f9fafb', marginBottom: 20 }}>
              <h4 style={{ marginBottom: 12 }}>添加医疗记录</h4>
              <div className="form-group">
                <label>患者姓名</label>
                <input value={medicalForm.patient_name} onChange={(e) => setMedicalForm({ ...medicalForm, patient_name: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>症状</label>
                  <textarea value={medicalForm.symptoms} onChange={(e) => setMedicalForm({ ...medicalForm, symptoms: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>诊断</label>
                  <textarea value={medicalForm.diagnosis} onChange={(e) => setMedicalForm({ ...medicalForm, diagnosis: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>治疗方案</label>
                  <textarea value={medicalForm.treatment} onChange={(e) => setMedicalForm({ ...medicalForm, treatment: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>用药</label>
                  <textarea value={medicalForm.medicines} onChange={(e) => setMedicalForm({ ...medicalForm, medicines: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea value={medicalForm.notes} onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={addMedicalRecord}>保存医疗记录</button>
            </div>

            <div>
              {incident.medicalRecords?.length === 0 ? (
                <p style={{ color: '#999' }}>暂无医疗记录</p>
              ) : (
                incident.medicalRecords.map(m => (
                  <div key={m.id} className="card" style={{ marginBottom: 12 }}>
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                      <strong>🏥 {m.patient_name || '未命名患者'}</strong>
                      <span style={{ fontSize: 12, color: '#888' }}>
                        {new Date(m.created_at).toLocaleString('zh-CN')} · {m.creator_name || '未知'}
                      </span>
                    </div>
                    <div className="grid-2" style={{ fontSize: 14 }}>
                      <div><strong>症状：</strong>{m.symptoms || '-'}</div>
                      <div><strong>诊断：</strong>{m.diagnosis || '-'}</div>
                      <div><strong>治疗：</strong>{m.treatment || '-'}</div>
                      <div><strong>用药：</strong>{m.medicines || '-'}</div>
                    </div>
                    {m.notes && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}><strong>备注：</strong>{m.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            {incident.status === 'closed' && incident.review ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 20 }}>✅ 事件已完成复盘归档并结案</div>
                <div style={{ lineHeight: 2 }}>
                  <div><strong>原因分析：</strong></div>
                  <p style={{ padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{incident.review.cause_analysis}</p>
                  <div><strong>整改措施：</strong></div>
                  <p style={{ padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{incident.review.corrective_actions}</p>
                  <div className="grid-2">
                    <div><strong>责任人：</strong>{incident.review.responsible_person}</div>
                    <div><strong>后续观察任务：</strong>{incident.review.follow_up_tasks}</div>
                  </div>
                  <div style={{ marginTop: 16 }}><strong>结论：</strong></div>
                  <p style={{ padding: 12, background: '#f9fafb', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{incident.review.conclusion}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>原因分析 *</label>
                  <textarea value={reviewForm.cause_analysis} onChange={(e) => setReviewForm({ ...reviewForm, cause_analysis: e.target.value })} placeholder="分析事件发生的根本原因..." />
                </div>
                <div className="form-group">
                  <label>整改措施 *</label>
                  <textarea value={reviewForm.corrective_actions} onChange={(e) => setReviewForm({ ...reviewForm, corrective_actions: e.target.value })} placeholder="具体的整改和预防措施..." />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>责任人</label>
                    <input value={reviewForm.responsible_person} onChange={(e) => setReviewForm({ ...reviewForm, responsible_person: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>后续观察任务</label>
                    <input value={reviewForm.follow_up_tasks} onChange={(e) => setReviewForm({ ...reviewForm, follow_up_tasks: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>复盘结论 *</label>
                  <textarea value={reviewForm.conclusion} onChange={(e) => setReviewForm({ ...reviewForm, conclusion: e.target.value })} placeholder="总结复盘结论..." />
                </div>
                <button className="btn btn-success" onClick={submitReview}>📦 完成复盘并结案</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'related' && (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>事件编号</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>上报时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {incident.relatedIncidents?.filter(i => i.id != id).map(i => (
                  <tr key={i.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.incident_no}</td>
                    <td>{i.title}</td>
                    <td><span className="tag">{getTypeLabel(i.type)}</span></td>
                    <td><span className={`badge badge-${i.status}`}>{getStatusLabel(i.status)}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(i.created_at).toLocaleString('zh-CN')}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/incidents/${i.id}`)}>查看</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function getTypeLabel(type) {
  const labels = { bullying: '校园欺凌', injury: '意外伤害', food_safety: '食品安全', facility: '设施故障', security: '治安事件', other: '其他' }
  return labels[type] || type
}
function getUrgencyLabel(urgency) {
  const labels = { critical: '紧急', high: '高', normal: '普通', low: '低' }
  return labels[urgency] || urgency
}
function getStatusLabel(status) {
  const labels = { pending: '待处理', processing: '处理中', closed: '已结案' }
  return labels[status] || status
}
function getDeptLabel(dept) {
  const labels = { student_affairs: '学生处', medical: '校医院', logistics: '后勤处', security: '保卫处', general: '综合办' }
  return labels[dept] || dept
}
function getRoleLabel(role) {
  const labels = { admin: '管理员', student: '学生', teacher: '教师', security: '安保', doctor: '校医', manager: '管理者' }
  return labels[role] || role
}
function getRecordTypeLabel(type) {
  const labels = { note: '备注', status: '状态变更', measure: '处理措施', scene: '现场记录' }
  return labels[type] || type
}