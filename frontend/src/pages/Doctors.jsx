import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [doctorDetail, setDoctorDetail] = useState(null)
  const [filters, setFilters] = useState({ hospital_id: '', compliance_status: '' })
  const [formData, setFormData] = useState({
    name: '', gender: '', title: '', specialty: '', hospital_id: '', department_id: '',
    phone: '', email: '', compliance_status: 'normal', visit_frequency_limit: 4,
    preferences: '', is_restricted: false, restricted_reason: ''
  })
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    loadData()
  }, [filters])

  useEffect(() => {
    axios.get('/api/hospitals').then(res => setHospitals(res.data))
  }, [])

  useEffect(() => {
    if (formData.hospital_id) {
      axios.get(`/api/departments?hospital_id=${formData.hospital_id}`).then(res => setDepartments(res.data))
    }
  }, [formData.hospital_id])

  const loadData = () => {
    const params = new URLSearchParams()
    if (filters.hospital_id) params.append('hospital_id', filters.hospital_id)
    if (filters.compliance_status) params.append('compliance_status', filters.compliance_status)
    axios.get(`/api/doctors?${params}`).then(res => setDoctors(res.data))
  }

  const handleSubmit = () => {
    if (selectedDoctor) {
      axios.put(`/api/doctors/${selectedDoctor.id}`, { ...formData, created_by: 'mgr001' }).then(() => {
        loadData()
        setShowModal(false)
      })
    } else {
      axios.post('/api/doctors', { ...formData, created_by: 'mgr001' }).then(() => {
        loadData()
        setShowModal(false)
      })
    }
  }

  const viewDetail = (id) => {
    axios.get(`/api/doctors/${id}`).then(res => {
      setDoctorDetail(res.data)
      setDetailModal(true)
    })
  }

  const editDoctor = (doctor) => {
    let doc = doctor
    if (typeof doctor === 'string') {
      doc = doctors.find(d => d.id === doctor)
    }
    if (!doc) return
    setSelectedDoctor(doc)
    setFormData({
      name: doc.name, gender: doc.gender, title: doc.title, specialty: doc.specialty,
      hospital_id: doc.hospital_id, department_id: doc.department_id,
      phone: doc.phone || '', email: doc.email || '', compliance_status: doc.compliance_status,
      visit_frequency_limit: doc.visit_frequency_limit, preferences: doc.preferences || '',
      is_restricted: !!doc.is_restricted, restricted_reason: doc.restricted_reason || ''
    })
    setShowModal(true)
  }

  const getStatusTag = (status) => {
    const map = {
      normal: <span className="tag tag-success">正常</span>,
      warning: <span className="tag tag-warning">关注</span>,
      restricted: <span className="tag tag-danger">禁访</span>
    }
    return map[status] || status
  }

  return (
    <div className="page-doctors">
      <div className="page-header">
        <h1 className="page-title">医生档案管理</h1>
        <button className="btn btn-primary" onClick={() => {
          setSelectedDoctor(null)
          setFormData({ name: '', gender: '', title: '', specialty: '', hospital_id: '', department_id: '', phone: '', email: '', compliance_status: 'normal', visit_frequency_limit: 4, preferences: '', is_restricted: false, restricted_reason: '' })
          setShowModal(true)
        }}>+ 新增医生</button>
      </div>

      <div className="card filter-card">
        <div className="filter-row">
          <div className="filter-item">
            <label className="filter-label">所属医院</label>
            <select className="form-select filter-select" value={filters.hospital_id} onChange={e => setFilters({ ...filters, hospital_id: e.target.value })}>
              <option value="">全部医院</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label">合规状态</label>
            <select className="form-select filter-select" value={filters.compliance_status} onChange={e => setFilters({ ...filters, compliance_status: e.target.value })}>
              <option value="">全部状态</option>
              <option value="normal">正常</option>
              <option value="warning">关注</option>
              <option value="restricted">禁访</option>
            </select>
          </div>
          <div className="filter-info">
            共 <strong>{doctors.length}</strong> 位医生
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table table-doctors">
            <thead>
              <tr>
                <th className="col-hospital">所属医院</th>
                <th className="col-dept">科室</th>
                <th className="col-name">医生姓名</th>
                <th className="col-title">职称</th>
                <th className="col-specialty">专业方向</th>
                <th className="col-status">合规状态</th>
                <th className="col-limit">月限次数</th>
                <th className="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id}>
                  <td className="col-hospital">
                    <div className="hospital-name">{d.hospital_name}</div>
                  </td>
                  <td className="col-dept">
                    <span className="dept-tag">{d.department_name}</span>
                  </td>
                  <td className="col-name">
                    <div className="doctor-info">
                      <div className="doctor-avatar">{d.name?.charAt(0) || '-'}</div>
                      <div>
                        <div className="doctor-name">{d.name}</div>
                        <div className="doctor-gender">{d.gender || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="col-title">
                    <span className="title-tag">{d.title || '-'}</span>
                  </td>
                  <td className="col-specialty">
                    <div className="specialty-text">{d.specialty || '-'}</div>
                  </td>
                  <td className="col-status">{getStatusTag(d.compliance_status)}</td>
                  <td className="col-limit">
                    <div className="limit-badge">
                      <span className="limit-num">{d.visit_frequency_limit}</span>
                      <span className="limit-unit">次/月</span>
                    </div>
                  </td>
                  <td className="col-action">
                    <div className="action-buttons">
                      <button className="btn btn-link" onClick={() => viewDetail(d.id)}>查看</button>
                      <button className="btn btn-link" onClick={() => editDoctor(d.id)}>编辑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {doctors.length === 0 && (
          <div className="empty">暂无医生数据</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{selectedDoctor ? '编辑医生档案' : '新增医生档案'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-section-title">基本信息</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">姓名 <span className="required">*</span></label>
                    <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="请输入医生姓名" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">性别</label>
                    <select className="form-select" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">请选择</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">职称</label>
                    <select className="form-select" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}>
                      <option value="">请选择职称</option>
                      <option value="主任医师">主任医师</option>
                      <option value="副主任医师">副主任医师</option>
                      <option value="主治医师">主治医师</option>
                      <option value="住院医师">住院医师</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">专业方向</label>
                    <input className="form-input" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} placeholder="如：冠心病、高血压等" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">所属机构</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">医院 <span className="required">*</span></label>
                    <select className="form-select" value={formData.hospital_id} onChange={e => setFormData({ ...formData, hospital_id: e.target.value })}>
                      <option value="">请选择医院</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">科室</label>
                    <select className="form-select" value={formData.department_id} onChange={e => setFormData({ ...formData, department_id: e.target.value })}>
                      <option value="">请选择科室</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">联系方式</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">联系电话</label>
                    <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="请输入手机号码" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">电子邮箱</label>
                    <input className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="请输入邮箱地址" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">合规设置</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">合规状态</label>
                    <select className="form-select" value={formData.compliance_status} onChange={e => setFormData({ ...formData, compliance_status: e.target.value })}>
                      <option value="normal">正常</option>
                      <option value="warning">关注</option>
                      <option value="restricted">禁访</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">月拜访限制次数</label>
                    <input type="number" className="form-input" value={formData.visit_frequency_limit} onChange={e => setFormData({ ...formData, visit_frequency_limit: parseInt(e.target.value) || 4 })} min="1" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label checkbox-label">
                    <input type="checkbox" checked={formData.is_restricted} onChange={e => setFormData({ ...formData, is_restricted: e.target.checked })} />
                    <span>设置为禁访医生（暂停所有拜访）</span>
                  </label>
                  {formData.is_restricted && (
                    <input className="form-input mt-2" placeholder="请输入禁访原因" value={formData.restricted_reason} onChange={e => setFormData({ ...formData, restricted_reason: e.target.value })} />
                  )}
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">医生偏好</div>
                <div className="form-group">
                  <label className="form-label">备注信息</label>
                  <textarea className="form-textarea" rows={3} value={formData.preferences} onChange={e => setFormData({ ...formData, preferences: e.target.value })} placeholder="记录医生的个人偏好、注意事项等" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>保存档案</button>
            </div>
          </div>
        </div>
      )}

      {detailModal && doctorDetail && (
        <div className="modal-overlay" onClick={() => setDetailModal(false)}>
          <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">医生详情</div>
              <button className="modal-close" onClick={() => setDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-header">
                <div className="detail-avatar">{doctorDetail.name?.charAt(0) || '-'}</div>
                <div className="detail-info">
                  <h3 className="detail-name">{doctorDetail.name}</h3>
                  <div className="detail-meta">
                    <span>{doctorDetail.title || '-'}</span>
                    <span className="meta-divider">|</span>
                    <span>{doctorDetail.gender || '-'}</span>
                    <span className="meta-divider">|</span>
                    {getStatusTag(doctorDetail.compliance_status)}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">所属机构</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>医院</label>
                    <span>{doctorDetail.hospital_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>科室</label>
                    <span>{doctorDetail.department_name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>专业方向</label>
                    <span>{doctorDetail.specialty || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>月拜访限制</label>
                    <span>{doctorDetail.visit_frequency_limit}次/月</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">拜访统计</div>
                <div className="stats-grid-sm">
                  <div className="stat-item-sm">
                    <div className="stat-num-sm">{doctorDetail.total_visits || 0}</div>
                    <div className="stat-label-sm">累计拜访</div>
                  </div>
                  <div className="stat-item-sm">
                    <div className="stat-num-sm">{doctorDetail.month_visits || 0}</div>
                    <div className="stat-label-sm">本月拜访</div>
                  </div>
                  <div className="stat-item-sm">
                    <div className="stat-num-sm">{doctorDetail.visit_frequency_limit}</div>
                    <div className="stat-label-sm">月度上限</div>
                  </div>
                  <div className="stat-item-sm">
                    <div className="stat-num-sm">
                      {((doctorDetail.month_visits || 0) / doctorDetail.visit_frequency_limit * 100).toFixed(0)}%
                    </div>
                    <div className="stat-label-sm">使用率</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">联系方式</div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>电话</label>
                    <span>{doctorDetail.phone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>邮箱</label>
                    <span>{doctorDetail.email || '-'}</span>
                  </div>
                </div>
              </div>

              {doctorDetail.preferences && (
                <div className="detail-section">
                  <div className="detail-section-title">备注信息</div>
                  <div className="detail-note">{doctorDetail.preferences}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setDetailModal(false)}>关闭</button>
              <button className="btn btn-primary" onClick={() => { setDetailModal(false); editDoctor(doctorDetail); }}>编辑档案</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctors
