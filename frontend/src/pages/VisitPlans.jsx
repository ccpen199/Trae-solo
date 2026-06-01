import React, { useState, useEffect } from 'react'
import axios from 'axios'

function VisitPlans() {
  const [plans, setPlans] = useState([])
  const [doctors, setDoctors] = useState([])
  const [reps, setReps] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [rescheduleModal, setRescheduleModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [checkResult, setCheckResult] = useState(null)
  const [formData, setFormData] = useState({
    representative_id: 'rep001', doctor_id: '', visit_date: '', visit_time: '', visit_type: 'office', purpose: ''
  })
  const [rescheduleData, setRescheduleData] = useState({ visit_date: '', visit_time: '', reschedule_reason: '' })

  useEffect(() => {
    loadData()
    axios.get('/api/doctors').then(res => setDoctors(res.data))
    axios.get('/api/users/representative').then(res => setReps(res.data))
  }, [])

  const loadData = () => {
    axios.get('/api/visit-plans').then(res => setPlans(res.data))
  }

  const checkPlan = () => {
    if (formData.doctor_id && formData.visit_date && formData.visit_time) {
      axios.post('/api/visit-plans/check', formData).then(res => {
        setCheckResult(res.data)
      })
    }
  }

  useEffect(() => {
    checkPlan()
  }, [formData.doctor_id, formData.visit_date, formData.visit_time])

  const handleSubmit = () => {
    axios.post('/api/visit-plans', formData).then(() => {
      loadData()
      setShowModal(false)
      setCheckResult(null)
    })
  }

  const handleReschedule = () => {
    axios.put(`/api/visit-plans/${selectedPlan.id}/reschedule`, rescheduleData).then(() => {
      loadData()
      setRescheduleModal(false)
    })
  }

  const cancelPlan = (id) => {
    if (confirm('确定取消该拜访计划？')) {
      axios.put(`/api/visit-plans/${id}/status`, { status: 'cancelled' }).then(() => loadData())
    }
  }

  const getStatusTag = (status) => {
    const map = {
      pending: <span className="tag tag-info">待执行</span>,
      completed: <span className="tag tag-success">已完成</span>,
      cancelled: <span className="tag tag-default">已取消</span>
    }
    return map[status] || status
  }

  const getTypeLabel = (type) => {
    const map = { office: '院内拜访', conference: '学术会议', phone: '电话拜访' }
    return map[type] || type
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">拜访计划管理</h1>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ representative_id: 'rep001', doctor_id: '', visit_date: '', visit_time: '', visit_type: 'office', purpose: '' })
          setCheckResult(null)
          setShowModal(true)
        }}>+ 新建计划</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>拜访日期</th>
              <th>时间</th>
              <th>医生</th>
              <th>医院</th>
              <th>代表</th>
              <th>类型</th>
              <th>状态</th>
              <th>改期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td>{p.visit_date}</td>
                <td>{p.visit_time}</td>
                <td>{p.doctor_name}</td>
                <td>{p.hospital_name}</td>
                <td>{p.representative_name}</td>
                <td>{getTypeLabel(p.visit_type)}</td>
                <td>{getStatusTag(p.status)}</td>
                <td>{p.is_rescheduled ? <span className="tag tag-warning">已改期</span> : '-'}</td>
                <td>
                  {p.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-default" onClick={() => {
                        setSelectedPlan(p)
                        setRescheduleData({ visit_date: p.visit_date, visit_time: p.visit_time, reschedule_reason: '' })
                        setRescheduleModal(true)
                      }}>改期</button>
                      &nbsp;
                      <button className="btn btn-sm btn-danger" onClick={() => cancelPlan(p.id)}>取消</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新建拜访计划</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {checkResult && checkResult.warnings.length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 4, background: checkResult.valid ? '#fffbe6' : '#fff2f0', border: `1px solid ${checkResult.valid ? '#faad14' : '#ff4d4f'}` }}>
                  {checkResult.warnings.map((w, i) => (
                    <div key={i} style={{ color: w.type === 'error' ? '#ff4d4f' : '#faad14' }}>⚠️ {w.message}</div>
                  ))}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">选择医生</label>
                <select className="form-select" value={formData.doctor_id} onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}>
                  <option value="">请选择医生</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} disabled={d.is_restricted}>
                      {d.name} - {d.hospital_name} {d.is_restricted ? '(禁访)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">拜访日期</label>
                  <input type="date" className="form-input" value={formData.visit_date} onChange={e => setFormData({ ...formData, visit_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">拜访时间</label>
                  <input type="time" className="form-input" value={formData.visit_time} onChange={e => setFormData({ ...formData, visit_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">拜访类型</label>
                <select className="form-select" value={formData.visit_type} onChange={e => setFormData({ ...formData, visit_type: e.target.value })}>
                  <option value="office">院内拜访</option>
                  <option value="conference">学术会议</option>
                  <option value="phone">电话拜访</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">拜访目的</label>
                <textarea className="form-textarea" rows={3} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!checkResult?.valid}>保存</button>
            </div>
          </div>
        </div>
      )}

      {rescheduleModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setRescheduleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">改期 - {selectedPlan.doctor_name}</div>
              <button className="modal-close" onClick={() => setRescheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16, color: '#666' }}>原计划：{selectedPlan.visit_date} {selectedPlan.visit_time}</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">新日期</label>
                  <input type="date" className="form-input" value={rescheduleData.visit_date} onChange={e => setRescheduleData({ ...rescheduleData, visit_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">新时间</label>
                  <input type="time" className="form-input" value={rescheduleData.visit_time} onChange={e => setRescheduleData({ ...rescheduleData, visit_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">改期原因</label>
                <textarea className="form-textarea" rows={3} value={rescheduleData.reschedule_reason} onChange={e => setRescheduleData({ ...rescheduleData, reschedule_reason: e.target.value })} placeholder="请输入改期原因" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setRescheduleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReschedule}>确认改期</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitPlans
