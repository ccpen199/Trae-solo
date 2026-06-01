import React, { useState, useEffect } from 'react'
import axios from 'axios'

function VisitRecords() {
  const [records, setRecords] = useState([])
  const [plans, setPlans] = useState([])
  const [doctors, setDoctors] = useState([])
  const [materials, setMaterials] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [recordDetail, setRecordDetail] = useState(null)
  const [formData, setFormData] = useState({
    plan_id: '', doctor_id: '', visit_date: '', checkin_time: '', checkout_time: '',
    location_address: '', discussion_topics: '', feedback: '', follow_up_tasks: '', selectedMaterials: []
  })

  useEffect(() => {
    loadData()
    axios.get('/api/visit-plans?status=pending').then(res => setPlans(res.data))
    axios.get('/api/doctors').then(res => setDoctors(res.data))
    axios.get('/api/materials').then(res => setMaterials(res.data))
  }, [])

  const loadData = () => {
    axios.get('/api/visit-records').then(res => setRecords(res.data))
  }

  const viewDetail = (id) => {
    axios.get(`/api/visit-records/${id}`).then(res => {
      setRecordDetail(res.data)
      setDetailModal(true)
    })
  }

  const handleSubmit = () => {
    const selectedMatObjs = materials.filter(m => formData.selectedMaterials.includes(m.id))
    const data = {
      ...formData,
      representative_id: 'rep001',
      materials_used: JSON.stringify(selectedMatObjs),
      location_lat: 31.2304,
      location_lng: 121.4737
    }
    const plan = plans.find(p => p.id === formData.plan_id)
    if (plan) {
      data.doctor_id = plan.doctor_id
      data.visit_date = plan.visit_date
    }
    axios.post('/api/visit-records', data).then(() => {
      loadData()
      setShowModal(false)
    })
  }

  const toggleMaterial = (id) => {
    const selected = formData.selectedMaterials
    const idx = selected.indexOf(id)
    if (idx >= 0) {
      selected.splice(idx, 1)
    } else {
      selected.push(id)
    }
    setFormData({ ...formData, selectedMaterials: [...selected] })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">拜访执行记录</h1>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ plan_id: '', doctor_id: '', visit_date: '', checkin_time: '', checkout_time: '', location_address: '', discussion_topics: '', feedback: '', follow_up_tasks: '', selectedMaterials: [] })
          setShowModal(true)
        }}>+ 记录拜访</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>拜访日期</th>
              <th>签到时间</th>
              <th>医生</th>
              <th>医院</th>
              <th>代表</th>
              <th>地点</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7}><div className="empty">暂无拜访记录</div></td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td>{r.visit_date}</td>
                <td>{r.checkin_time?.substring(0, 16)}</td>
                <td>{r.doctor_name}</td>
                <td>{r.hospital_name}</td>
                <td>{r.representative_name}</td>
                <td>{r.location_address || '-'}</td>
                <td><button className="btn btn-sm btn-default" onClick={() => viewDetail(r.id)}>查看详情</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">记录拜访执行</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">关联计划（可选）</label>
                <select className="form-select" value={formData.plan_id} onChange={e => setFormData({ ...formData, plan_id: e.target.value })}>
                  <option value="">无计划（临时拜访）</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.visit_date} {p.doctor_name} - {p.hospital_name}</option>)}
                </select>
              </div>
              {!formData.plan_id && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">选择医生</label>
                    <select className="form-select" value={formData.doctor_id} onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}>
                      <option value="">请选择医生</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.hospital_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">拜访日期</label>
                    <input type="date" className="form-input" value={formData.visit_date} onChange={e => setFormData({ ...formData, visit_date: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">签到时间</label>
                  <input type="datetime-local" className="form-input" value={formData.checkin_time} onChange={e => setFormData({ ...formData, checkin_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">签退时间</label>
                  <input type="datetime-local" className="form-input" value={formData.checkout_time} onChange={e => setFormData({ ...formData, checkout_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">拜访地点</label>
                <input className="form-input" value={formData.location_address} onChange={e => setFormData({ ...formData, location_address: e.target.value })} placeholder="输入详细地址" />
              </div>
              <div className="form-group">
                <label className="form-label">讨论主题</label>
                <textarea className="form-textarea" rows={2} value={formData.discussion_topics} onChange={e => setFormData({ ...formData, discussion_topics: e.target.value })} placeholder="记录本次讨论的主要内容" />
              </div>
              <div className="form-group">
                <label className="form-label">使用学术资料（可多选）</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {materials.map(m => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: `1px solid ${formData.selectedMaterials.includes(m.id) ? '#1890ff' : '#d9d9d9'}`, borderRadius: 4, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.selectedMaterials.includes(m.id)} onChange={() => toggleMaterial(m.id)} />
                      {m.name}
                      {m.is_sensitive ? <span className="tag tag-danger">敏感</span> : null}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">医生反馈</label>
                <textarea className="form-textarea" rows={2} value={formData.feedback} onChange={e => setFormData({ ...formData, feedback: e.target.value })} placeholder="记录医生的问题和反馈" />
              </div>
              <div className="form-group">
                <label className="form-label">后续任务</label>
                <textarea className="form-textarea" rows={2} value={formData.follow_up_tasks} onChange={e => setFormData({ ...formData, follow_up_tasks: e.target.value })} placeholder="记录需要跟进的事项" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>保存记录</button>
            </div>
          </div>
        </div>
      )}

      {detailModal && recordDetail && (
        <div className="modal-overlay" onClick={() => setDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">拜访详情</div>
              <button className="modal-close" onClick={() => setDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div><strong>医生：</strong>{recordDetail.doctor_name}</div>
                <div><strong>医院：</strong>{recordDetail.hospital_name}</div>
              </div>
              <div className="form-row">
                <div><strong>代表：</strong>{recordDetail.representative_name}</div>
                <div><strong>日期：</strong>{recordDetail.visit_date}</div>
              </div>
              <div className="form-row">
                <div><strong>签到：</strong>{recordDetail.checkin_time}</div>
                <div><strong>签退：</strong>{recordDetail.checkout_time || '-'}</div>
              </div>
              <div className="form-group"><strong>地点：</strong>{recordDetail.location_address || '未记录'}</div>
              <div className="form-group"><strong>讨论主题：</strong><p style={{ marginTop: 4 }}>{recordDetail.discussion_topics || '无'}</p></div>
              <div className="form-group"><strong>医生反馈：</strong><p style={{ marginTop: 4 }}>{recordDetail.feedback || '无'}</p></div>
              <div className="form-group"><strong>后续任务：</strong><p style={{ marginTop: 4 }}>{recordDetail.follow_up_tasks || '无'}</p></div>
              {recordDetail.materials_used && (
                <div className="form-group">
                  <strong>使用资料：</strong>
                  <div>{JSON.parse(recordDetail.materials_used).map((m, i) => (
                    <div key={i} style={{ marginTop: 4 }}>{m.name}</div>
                  ))}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitRecords
