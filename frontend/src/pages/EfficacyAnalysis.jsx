import React, { useState, useEffect } from 'react';
import api from '../api';

function EfficacyAnalysis({ user }) {
  const [analyses, setAnalyses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    start_assessment_id: '',
    end_assessment_id: '',
    adherence_rate: '',
    goal_achievement: '',
    analysis: '',
    recommendations: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analysesRes, patientsRes] = await Promise.all([
        api.get('/efficacy-analyses'),
        api.get('/patients')
      ]);
      setAnalyses(analysesRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handlePatientChange = async (patientId) => {
    setSelectedPatient(patientId);
    setFormData({ ...formData, patient_id: patientId, start_assessment_id: '', end_assessment_id: '' });
    if (patientId) {
      const res = await api.get(`/patients/${patientId}/assessments`);
      setAssessments(res.data);
    } else {
      setAssessments([]);
    }
  };

  const generateAnalysis = () => {
    const start = assessments.find(a => a.id == formData.start_assessment_id);
    const end = assessments.find(a => a.id == formData.end_assessment_id);
    if (start && end) {
      const scoreDiff = end.score - start.score;
      const improvement = scoreDiff > 0 ? '有改善' : scoreDiff < 0 ? '有所下降' : '无明显变化';
      const analysisText = `起始评分：${start.score}分，末次评分：${end.score}分，评分变化：${scoreDiff}分，整体${improvement}。训练依从性：${formData.adherence_rate || 0}%，目标达成度：${formData.goal_achievement || 0}%。`;
      
      let recommendations = '';
      if (parseFloat(formData.goal_achievement) < 60) {
        recommendations = '患者目标达成度较低，建议：1. 调整训练强度，适当降低难度；2. 增加治疗师一对一指导时间；3. 重新评估康复目标，制定更切合实际的计划；4. 加强患者心理疏导，提高训练积极性。';
      } else if (parseFloat(formData.adherence_rate) < 70) {
        recommendations = '患者训练依从性一般，建议：1. 了解缺席原因，针对性解决；2. 制定更灵活的训练时间表；3. 加强与患者家属的沟通，共同监督训练执行。';
      } else if (scoreDiff <= 0) {
        recommendations = '患者评分无明显提升，建议：1. 评估当前处方有效性；2. 考虑更换训练项目；3. 增加评估频次，密切关注病情变化。';
      } else {
        recommendations = '患者康复进展良好，建议继续执行当前训练方案，定期评估，根据恢复情况适时调整训练强度和项目。';
      }
      
      setFormData({
        ...formData,
        analysis: analysisText,
        recommendations: recommendations
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/efficacy-analyses', {
        ...formData,
        analyzed_by: user.id
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('保存失败');
    }
  };

  const getAchievementBadge = (rate) => {
    if (rate >= 80) return 'badge-confirmed';
    if (rate >= 60) return 'badge-pending';
    return 'badge-warning';
  };

  return (
    <div>
      <div className="header">
        <h2>疗效分析</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建分析
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>患者</th>
              <th>起始评分</th>
              <th>末次评分</th>
              <th>依从性</th>
              <th>目标达成度</th>
              <th>分析人</th>
              <th>分析时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无疗效分析记录</td></tr>
            ) : (
              analyses.map(a => (
                <tr key={a.id}>
                  <td>{a.patient_name}</td>
                  <td>{a.start_score || '-'}</td>
                  <td>{a.end_score || '-'}</td>
                  <td>{a.adherence_rate}%</td>
                  <td>
                    <span className={`badge ${getAchievementBadge(a.goal_achievement)}`}>
                      {a.goal_achievement}%
                    </span>
                  </td>
                  <td>{a.analyzer_name || '-'}</td>
                  <td>{a.created_at}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => alert(a.analysis + '\n\n建议：' + a.recommendations)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>新建疗效分析</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>选择患者</label>
                  <select 
                    value={formData.patient_id} 
                    onChange={e => handlePatientChange(e.target.value)}
                    required
                  >
                    <option value="">请选择患者</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.patient_no}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>起始评估</label>
                    <select 
                      value={formData.start_assessment_id}
                      onChange={e => setFormData({ ...formData, start_assessment_id: e.target.value })}
                    >
                      <option value="">请选择</option>
                      {assessments.map(a => (
                        <option key={a.id} value={a.id}>{a.scale_name} - {a.score}分</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>末次评估</label>
                    <select 
                      value={formData.end_assessment_id}
                      onChange={e => setFormData({ ...formData, end_assessment_id: e.target.value })}
                    >
                      <option value="">请选择</option>
                      {assessments.map(a => (
                        <option key={a.id} value={a.id}>{a.scale_name} - {a.score}分</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>训练依从性 (%)</label>
                    <input 
                      type="number"
                      min="0"
                      max="100" 
                      value={formData.adherence_rate}
                      onChange={e => setFormData({ ...formData, adherence_rate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>目标达成度 (%)</label>
                    <input 
                      type="number"
                      min="0"
                      max="100" 
                      value={formData.goal_achievement}
                      onChange={e => setFormData({ ...formData, goal_achievement: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <button type="button" className="btn" onClick={generateAnalysis} style={{ background: '#9b59b6', color: '#fff' }}>
                    智能生成分析
                  </button>
                </div>

                <div className="form-group">
                  <label>疗效分析</label>
                  <textarea 
                    value={formData.analysis}
                    onChange={e => setFormData({ ...formData, analysis: e.target.value })}
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>调整建议</label>
                  <textarea 
                    value={formData.recommendations}
                    onChange={e => setFormData({ ...formData, recommendations: e.target.value })}
                    rows="3"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" style={{ background: '#95a5a6', color: '#fff' }} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存分析
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EfficacyAnalysis;
