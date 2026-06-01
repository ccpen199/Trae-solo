import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('assessment');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    scale_name: '',
    scale_version: '1.0',
    content: '',
    score: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [patientRes, assessmentsRes, prescriptionsRes, trainingRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/patients/${id}/assessments`),
        api.get(`/patients/${id}/prescriptions`),
        api.get(`/patients/${id}/training-records`)
      ]);
      setPatient(patientRes.data);
      setAssessments(assessmentsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setTrainingRecords(trainingRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    try {
      await api.post('/assessments', {
        ...assessmentForm,
        patient_id: id,
        assessor_id: currentUser?.id
      });
      setShowAssessmentModal(false);
      loadData();
    } catch (err) {
      alert('保存失败');
    }
  };

  if (!patient) return <div>加载中...</div>;

  return (
    <div>
      <div className="header">
        <div>
          <button className="btn" onClick={() => navigate('/patients')} style={{ marginRight: '12px', background: '#95a5a6', color: '#fff' }}>← 返回</button>
          <h2 style={{ display: 'inline-block' }}>{patient.name} 的档案</h2>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="detail-grid">
          <div className="detail-item">
            <label>病历号</label>
            <div className="value">{patient.patient_no}</div>
          </div>
          <div className="detail-item">
            <label>性别</label>
            <div className="value">{patient.gender}</div>
          </div>
          <div className="detail-item">
            <label>年龄</label>
            <div className="value">{patient.age} 岁</div>
          </div>
          <div className="detail-item">
            <label>电话</label>
            <div className="value">{patient.phone || '-'}</div>
          </div>
          <div className="detail-item">
            <label>主治治疗师</label>
            <div className="value">{patient.therapist_name || '-'}</div>
          </div>
          <div className="detail-item">
            <label>训练周期</label>
            <div className="value">{patient.training_cycle || '-'}</div>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <label>诊断</label>
            <div className="value">{patient.diagnosis || '-'}</div>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <label>禁忌症</label>
            <div className="value">{patient.contraindications || '-'}</div>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <label>康复目标</label>
            <div className="value">{patient.goals || '-'}</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'assessment' ? 'active' : ''}`} onClick={() => setActiveTab('assessment')}>
          功能评估
        </div>
        <div className={`tab ${activeTab === 'prescription' ? 'active' : ''}`} onClick={() => setActiveTab('prescription')}>
          处方记录
        </div>
        <div className={`tab ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
          训练记录
        </div>
      </div>

      {activeTab === 'assessment' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>功能评估记录（含历史版本）</h3>
            <button className="btn btn-primary" onClick={() => setShowAssessmentModal(true)}>
              + 新增评估
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>量表名称</th>
                <th>版本号</th>
                <th>得分</th>
                <th>评分变化</th>
                <th>评估人</th>
                <th>评估时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无评估记录</td></tr>
              ) : (
                assessments.map((a, idx) => {
                  const prevScore = idx < assessments.length - 1 ? assessments[idx + 1].score : null;
                  const scoreDiff = prevScore !== null ? a.score - prevScore : null;
                  return (
                    <tr key={a.id}>
                      <td>{a.scale_name}</td>
                      <td><span className="badge badge-active">v{a.scale_version}</span></td>
                      <td><strong>{a.score}</strong></td>
                      <td>
                        {scoreDiff !== null && (
                          scoreDiff > 0 
                            ? <span style={{ color: '#27ae60' }}>↑{scoreDiff}</span>
                            : scoreDiff < 0 
                            ? <span style={{ color: '#e74c3c' }}>↓{Math.abs(scoreDiff)}</span>
                            : <span style={{ color: '#7f8c8d' }}>-</span>
                        )}
                      </td>
                      <td>{a.assessor_name || '-'}</td>
                      <td>{a.assessed_at}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => {
                            let content = a.content;
                            try {
                              const parsed = JSON.parse(a.content);
                              content = Object.entries(parsed).map(([k, v]) => `  ${k}: ${v}`).join('\n');
                            } catch (e) {}
                            alert(`【${a.scale_name}】\n版本：${a.scale_version}\n得分：${a.score}分\n评估人：${a.assessor_name || '-'}\n时间：${a.assessed_at}\n\n评估详情：\n${content}`);
                          }}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'prescription' && (
        <div className="card">
          <h3>处方记录</h3>
          <table>
            <thead>
              <tr>
                <th>创建人</th>
                <th>确认人</th>
                <th>频次</th>
                <th>强度</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无处方记录</td></tr>
              ) : (
                prescriptions.map(p => (
                  <tr key={p.id}>
                    <td>{p.creator_name}</td>
                    <td>{p.confirmer_name || '-'}</td>
                    <td>{p.frequency || '-'}</td>
                    <td>{p.intensity || '-'}</td>
                    <td>
                      <span className={`badge ${p.status === 'confirmed' ? 'badge-confirmed' : p.status === 'pending' ? 'badge-pending' : ''}`}>
                        {p.status === 'confirmed' ? '已确认' : p.status === 'pending' ? '待确认' : p.status}
                      </span>
                    </td>
                    <td>{p.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'training' && (
        <div className="card">
          <h3>训练记录</h3>
          <table>
            <thead>
              <tr>
                <th>训练日期</th>
                <th>完成状态</th>
                <th>疼痛评分</th>
                <th>动作质量</th>
                <th>记录人</th>
              </tr>
            </thead>
            <tbody>
              {trainingRecords.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无训练记录</td></tr>
              ) : (
                trainingRecords.map(t => (
                  <tr key={t.id}>
                    <td>{t.training_date}</td>
                    <td>{t.completion_status}</td>
                    <td>{t.pain_score} 分</td>
                    <td>{t.movement_quality || '-'}</td>
                    <td>{t.creator_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAssessmentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>新增功能评估</h3>
              <button className="close-btn" onClick={() => setShowAssessmentModal(false)}>×</button>
            </div>
            <form onSubmit={handleAssessmentSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>量表名称</label>
                  <input
                    type="text"
                    value={assessmentForm.scale_name}
                    onChange={e => setAssessmentForm({ ...assessmentForm, scale_name: e.target.value })}
                    placeholder="例如：Fugl-Meyer 评估量表"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>版本</label>
                    <input
                      type="text"
                      value={assessmentForm.scale_version}
                      onChange={e => setAssessmentForm({ ...assessmentForm, scale_version: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>得分</label>
                    <input
                      type="number"
                      value={assessmentForm.score}
                      onChange={e => setAssessmentForm({ ...assessmentForm, score: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>评估内容</label>
                  <textarea
                    value={assessmentForm.content}
                    onChange={e => setAssessmentForm({ ...assessmentForm, content: e.target.value })}
                    rows="4"
                    placeholder="请输入评估内容详情"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#95a5a6', color: '#fff' }} onClick={() => setShowAssessmentModal(false)}>
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

export default PatientDetail;
