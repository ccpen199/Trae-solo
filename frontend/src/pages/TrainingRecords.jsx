import React, { useState, useEffect } from 'react';
import api from '../api';

function TrainingRecords({ user }) {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    prescription_id: '',
    patient_id: '',
    training_date: new Date().toISOString().split('T')[0],
    completion_status: 'completed',
    pain_score: 0,
    movement_quality: '',
    therapist_notes: '',
    abort_reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsRes, patientsRes, prescriptionsRes] = await Promise.all([
        api.get('/training-records'),
        api.get('/patients'),
        api.get('/prescriptions')
      ]);
      setRecords(recordsRes.data);
      setPatients(patientsRes.data);
      setPrescriptions(prescriptionsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/training-records', {
        ...formData,
        created_by: user.id
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('保存失败');
    }
  };

  const getPainInfo = (score) => {
    if (score >= 7) return { class: 'badge-warning', text: '重度' };
    if (score >= 4) return { class: 'badge-pending', text: '中度' };
    if (score >= 1) return { class: 'badge-confirmed', text: '轻度' };
    return { class: 'badge-confirmed', text: '无痛' };
  };

  return (
    <div>
      <div className="header">
        <h2>训练记录</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增记录
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>患者</th>
              <th>训练日期</th>
              <th>完成状态</th>
              <th>疼痛评分</th>
              <th>动作质量</th>
              <th>记录人</th>
              <th>记录时间</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td>{r.patient_name}</td>
                <td>{r.training_date}</td>
                <td>{r.completion_status === 'completed' ? '已完成' : r.completion_status === 'partial' ? '部分完成' : r.completion_status === 'absent' ? '缺席' : r.completion_status === 'aborted' ? '中止' : r.completion_status}</td>
                <td>
                  <span className={`badge ${getPainInfo(r.pain_score).class}`} title={`${getPainInfo(r.pain_score).text}疼痛`}>
                    {r.pain_score} 分 · {getPainInfo(r.pain_score).text}
                  </span>
                </td>
                <td>{r.movement_quality || '-'}</td>
                <td>{r.creator_name || '-'}</td>
                <td>{r.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>新增训练记录</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>选择患者</label>
                  <select 
                    value={formData.patient_id} 
                    onChange={e => {
                      const pid = e.target.value;
                      setFormData({ 
                        ...formData, 
                        patient_id: pid,
                        prescription_id: ''
                      });
                    }}
                    required
                  >
                    <option value="">请选择患者</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.patient_no}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>关联处方</label>
                  <select 
                    value={formData.prescription_id} 
                    onChange={e => setFormData({ ...formData, prescription_id: e.target.value })}
                  >
                    <option value="">请选择处方</option>
                    {formData.patient_id ? (
                      prescriptions
                        .filter(p => String(p.patient_id) === String(formData.patient_id))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            处方 #{p.id} - {p.status === 'confirmed' ? '已确认' : p.status}
                            {p.training_items?.length ? ` (${p.training_items.length}项)` : ''}
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>请先选择患者</option>
                    )}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>训练日期</label>
                    <input 
                      type="date" 
                      value={formData.training_date}
                      onChange={e => setFormData({ ...formData, training_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>完成状态</label>
                    <select 
                      value={formData.completion_status}
                      onChange={e => setFormData({ ...formData, completion_status: e.target.value })}
                    >
                      <option value="completed">已完成</option>
                      <option value="partial">部分完成</option>
                      <option value="absent">缺席</option>
                      <option value="aborted">异常中止</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>NRS 数字疼痛评分量表 (0-10分)</label>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setFormData({ ...formData, pain_score: score })}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: formData.pain_score === score ? '2px solid #2c3e50' : '1px solid #ddd',
                          background: score >= 7 ? '#e74c3c' : score >= 4 ? '#f39c12' : '#27ae60',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: formData.pain_score === score ? 'bold' : 'normal',
                          transform: formData.pain_score === score ? 'scale(1.1)' : 'scale(1)'
                        }}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d', display: 'flex', justifyContent: 'space-between' }}>
                    <span>0=无痛</span>
                    <span style={{ color: '#27ae60' }}>1-3=轻度</span>
                    <span style={{ color: '#f39c12' }}>4-6=中度</span>
                    <span style={{ color: '#e74c3c' }}>7-10=重度</span>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>动作质量</label>
                    <select 
                      value={formData.movement_quality}
                      onChange={e => setFormData({ ...formData, movement_quality: e.target.value })}
                    >
                      <option value="">请选择</option>
                      <option value="优秀">优秀</option>
                      <option value="良好">良好</option>
                      <option value="一般">一般</option>
                      <option value="较差">较差</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>治疗师备注</label>
                  <textarea 
                    value={formData.therapist_notes}
                    onChange={e => setFormData({ ...formData, therapist_notes: e.target.value })}
                    rows="2"
                  />
                </div>

                {formData.completion_status === 'aborted' && (
                  <div className="form-group">
                    <label>异常中止原因</label>
                    <textarea 
                      value={formData.abort_reason}
                      onChange={e => setFormData({ ...formData, abort_reason: e.target.value })}
                      rows="2"
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#95a5a6', color: '#fff' }} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingRecords;
