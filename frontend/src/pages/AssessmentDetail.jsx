import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentsAPI, evidencesAPI, rectificationsAPI } from '../api.js';

function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [evidences, setEvidences] = useState([]);
  const [rectifications, setRectifications] = useState([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('certificate');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [assessmentRes, answersRes, summaryRes, evidencesRes, rectificationsRes] = await Promise.all([
        assessmentsAPI.getById(id),
        assessmentsAPI.getAnswers(id),
        assessmentsAPI.getSummary(id),
        evidencesAPI.getAll({ assessment_id: id }),
        rectificationsAPI.getAll({ assessment_id: id })
      ]);
      setAssessment(assessmentRes.data);
      setAnswers(answersRes.data);
      setSummary(summaryRes.data);
      setEvidences(evidencesRes.data);
      setRectifications(rectificationsRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleOptionSelect = async (answerId, optionText, optionScore, hasEvidence) => {
    try {
      await assessmentsAPI.updateAnswer(id, answerId, {
        answer: optionText,
        score: optionScore,
        has_evidence: hasEvidence
      });
      setAnswers(prev => prev.map(a => 
        a.id === answerId ? { ...a, answer: optionText, score: optionScore, has_evidence: hasEvidence ? 1 : 0 } : a
      ));
    } catch (error) {
      console.error('保存答案失败:', error);
    }
  };

  const handleEvidenceToggle = async (answerId, answer, score, hasEvidence) => {
    try {
      await assessmentsAPI.updateAnswer(id, answerId, {
        answer: answer,
        score: score,
        has_evidence: hasEvidence
      });
      setAnswers(prev => prev.map(a => 
        a.id === answerId ? { ...a, has_evidence: hasEvidence ? 1 : 0 } : a
      ));
    } catch (error) {
      console.error('保存答案失败:', error);
    }
  };

  const handleSubmit = async () => {
    if (confirm('确定提交评估吗？提交后将无法修改。')) {
      try {
        await assessmentsAPI.submit(id);
        loadData();
        alert('评估提交成功');
      } catch (error) {
        console.error('提交失败:', error);
      }
    }
  };

  const handleApprove = async () => {
    if (confirm('确定通过该评估吗？')) {
      try {
        await assessmentsAPI.approve(id);
        loadData();
        alert('评估已通过');
      } catch (error) {
        console.error('审核失败:', error);
      }
    }
  };

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !uploadingEvidence) return;

    const formData = new FormData();
    formData.append('file', evidenceFile);
    formData.append('assessment_id', id);
    formData.append('question_id', uploadingEvidence);
    formData.append('type', evidenceType);

    try {
      await evidencesAPI.upload(formData);
      setUploadingEvidence(null);
      setEvidenceFile(null);
      loadData();
      alert('上传成功');
    } catch (error) {
      console.error('上传失败:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-secondary',
      in_progress: 'badge-info',
      submitted: 'badge-warning',
      approved: 'badge-success'
    };
    const labels = {
      draft: '草稿',
      in_progress: '进行中',
      submitted: '待审核',
      approved: '已通过'
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{labels[status] || status}</span>;
  };

  const getRiskBadge = (level) => {
    const badges = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-danger',
      critical: 'badge-danger'
    };
    const labels = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    };
    return <span className={`badge ${badges[level] || 'badge-secondary'}`}>{labels[level] || level}</span>;
  };

  const getEvidenceStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    const labels = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{labels[status] || status}</span>;
  };

  const getRectificationStatusBadge = (status) => {
    const badges = {
      pending: 'badge-secondary',
      submitted: 'badge-warning',
      completed: 'badge-success'
    };
    const labels = {
      pending: '待整改',
      submitted: '待确认',
      completed: '已完成'
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{labels[status] || status}</span>;
  };

  const groupedAnswers = answers.reduce((acc, answer) => {
    if (!acc[answer.category]) acc[answer.category] = [];
    acc[answer.category].push(answer);
    return acc;
  }, {});

  if (!assessment) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-default" style={{ marginRight: '12px' }} onClick={() => navigate('/assessments')}>
            &larr; 返回
          </button>
          <h1 style={{ display: 'inline' }}>{assessment.supplier_name} - ESG 评估</h1>
        </div>
        <div>
          {assessment.status === 'draft' && (
            <button className="btn btn-success" onClick={handleSubmit}>提交评估</button>
          )}
          {assessment.status === 'submitted' && (
            <button className="btn btn-success" onClick={handleApprove}>审核通过</button>
          )}
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>问卷版本</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{assessment.questionnaire_name} {assessment.questionnaire_version}</div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>状态</div>
          <div>{getStatusBadge(assessment.status)}</div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>总分</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{assessment.total_score ?? '-'}</div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>风险等级</div>
          <div>{assessment.risk_level ? getRiskBadge(assessment.risk_level) : '-'}</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>问卷填写</div>
        <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>评分结果</div>
        <div className={`tab ${activeTab === 'evidences' ? 'active' : ''}`} onClick={() => setActiveTab('evidences')}>证据管理</div>
        <div className={`tab ${activeTab === 'rectifications' ? 'active' : ''}`} onClick={() => setActiveTab('rectifications')}>整改项</div>
      </div>

      {activeTab === 'questions' && (
        <div className="card">
          {Object.entries(groupedAnswers).map(([category, categoryAnswers]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb' }}>{category}</h3>
              {categoryAnswers.map(answer => {
                const options = answer.options ? JSON.parse(answer.options) : [];
                return (
                  <div key={answer.id} className="question-card">
                    <div className="category">权重: {answer.weight} | 满分: {answer.max_score}</div>
                    <div className="text">{answer.question_text}</div>
                    <div className="options-list" style={{ marginTop: '12px' }}>
                      {options.map((option, idx) => (
                        <div key={idx} 
                          style={{
                            padding: '10px 12px',
                            marginBottom: '8px',
                            borderRadius: '6px',
                            border: answer.answer === option.text ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                            background: answer.answer === option.text ? '#eff6ff' : 'white',
                            cursor: assessment.status === 'draft' ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (assessment.status === 'draft') {
                              handleOptionSelect(answer.id, option.text, option.score, answer.has_evidence);
                            }
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: answer.answer === option.text ? 600 : 400 }}>
                              {option.text}
                            </span>
                            <span className={`badge ${option.score === 10 ? 'badge-success' : option.score === 5 ? 'badge-warning' : 'badge-danger'}`}>
                              {option.score} 分
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: assessment.status === 'draft' ? 'pointer' : 'default' }}>
                        <input type="checkbox"
                          checked={answer.has_evidence}
                          onChange={(e) => handleEvidenceToggle(answer.id, answer.answer, answer.score, e.target.checked)}
                          disabled={assessment.status !== 'draft'} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>有证据支撑</span>
                      </label>
                      {assessment.status === 'draft' && (
                        <button className="btn btn-default" style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => setUploadingEvidence(answer.question_id)}>
                          上传证据
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'summary' && summary && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>类别得分</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {Object.entries(summary.category_scores).map(([category, data]) => (
                <div key={category} style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>{category}</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {data.count > 0 ? Math.round(data.total / data.count) : '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>平均分</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>扣分项 / 改进建议</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>类别</th>
                  <th>问题</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {summary.deduction_items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.category}</td>
                    <td>{item.question}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
                {summary.deduction_items.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#22c55e' }}>所有问题表现良好，无改进建议</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'evidences' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>文件名称</th>
                <th>类型</th>
                <th>状态</th>
                <th>上传时间</th>
              </tr>
            </thead>
            <tbody>
              {evidences.map(evidence => (
                <tr key={evidence.id}>
                  <td>{evidence.file_name}</td>
                  <td>{evidence.type}</td>
                  <td>{getEvidenceStatusBadge(evidence.status)}</td>
                  <td>{evidence.uploaded_at?.split('T')[0]}</td>
                </tr>
              ))}
              {evidences.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#6b7280' }}>暂无证据文件</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rectifications' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>相关问题</th>
                <th>整改说明</th>
                <th>截止日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rectifications.map(rect => (
                <tr key={rect.id}>
                  <td>{rect.question_text || '-'}</td>
                  <td>{rect.description}</td>
                  <td>{rect.deadline || '-'}</td>
                  <td>{getRectificationStatusBadge(rect.status)}</td>
                  <td>
                    {rect.status === 'submitted' && (
                      <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={async () => {
                          await rectificationsAPI.approve(rect.id);
                          loadData();
                        }}>
                        确认完成
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rectifications.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280' }}>暂无整改项</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {uploadingEvidence && (
        <div className="modal-overlay" onClick={() => setUploadingEvidence(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上传证据</h3>
              <button className="close-btn" onClick={() => setUploadingEvidence(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>证据类型</label>
                <select className="form-control" value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)}>
                  <option value="certificate">证书</option>
                  <option value="policy">制度文件</option>
                  <option value="data">能耗数据</option>
                  <option value="report">审计报告</option>
                  <option value="photo">整改照片</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="form-group">
                <label>选择文件</label>
                <input type="file" className="form-control" onChange={(e) => setEvidenceFile(e.target.files[0])} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setUploadingEvidence(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleUploadEvidence}>上传</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentDetail;
