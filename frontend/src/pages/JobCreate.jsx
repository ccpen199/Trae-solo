import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api.js';

function JobCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary_min: '',
    salary_max: '',
    location: '',
    department: ''
  });
  const [diagnosis, setDiagnosis] = useState(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const res = await jobsAPI.create({
        ...formData,
        salary_min: parseInt(formData.salary_min) || 0,
        salary_max: parseInt(formData.salary_max) || 0
      });
      setDiagnosis(res.data.diagnosis);
    } catch (error) {
      console.error('Failed to diagnose job:', error);
    } finally {
      setDiagnosing(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-medium';
    return 'score-poor';
  };

  const getIssueClass = (type) => {
    if (type === 'error') return 'issue-error';
    if (type === 'warning') return 'issue-warning';
    return 'issue-info';
  };

  return (
    <div>
      <div className="page-header">
        <h1>➕ 发布新职位</h1>
        <p>填写职位信息，系统将自动进行智能诊断和合规审查</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">职位信息</div>
          
          <div className="form-group">
            <label className="form-label">职位名称</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：高级前端开发工程师"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">最低薪资 (元/月)</label>
              <input
                type="number"
                name="salary_min"
                className="form-input"
                value={formData.salary_min}
                onChange={handleChange}
                placeholder="15000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">最高薪资 (元/月)</label>
              <input
                type="number"
                name="salary_max"
                className="form-input"
                value={formData.salary_max}
                onChange={handleChange}
                placeholder="25000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">工作地点</label>
              <select
                name="location"
                className="form-select"
                value={formData.location}
                onChange={handleChange}
              >
                <option value="">请选择</option>
                <option value="北京">北京</option>
                <option value="上海">上海</option>
                <option value="深圳">深圳</option>
                <option value="杭州">杭州</option>
                <option value="广州">广州</option>
                <option value="成都">成都</option>
                <option value="远程">远程</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">所属部门</label>
              <input
                type="text"
                name="department"
                className="form-input"
                value={formData.department}
                onChange={handleChange}
                placeholder="技术部"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">职位描述 (JD)</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="请详细描述岗位职责、任职要求、技能要求、公司福利等..."
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleDiagnose}
            disabled={diagnosing}
          >
            {diagnosing ? '🔍 诊断中...' : '🔍 智能诊断'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">诊断结果</div>
          
          {diagnosis ? (
            <div>
              <div className={`score-circle ${getScoreClass(diagnosis.overallScore)}`}>
                {diagnosis.overallScore}
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {diagnosis.canPublish ? (
                  <span className="badge badge-published">✅ 可以发布</span>
                ) : (
                  <span className="badge badge-draft">⚠️ 需要优化</span>
                )}
              </div>

              <div className="form-row">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#1e3a5f' }}>
                    {diagnosis.titleAnalysis.score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>标题得分</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#1e3a5f' }}>
                    {diagnosis.salaryAnalysis.score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>薪资得分</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#1e3a5f' }}>
                    {diagnosis.jdAnalysis.score}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>JD得分</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: diagnosis.compliance.passed ? '#4caf50' : '#f44336' }}>
                    {diagnosis.compliance.passed ? '✓' : '✗'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>合规审查</div>
                </div>
              </div>

              {diagnosis.recommendations.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '12px', color: '#1e3a5f' }}>优化建议</h4>
                  {diagnosis.recommendations.map((rec, idx) => (
                    <div key={idx} className={`issue-item ${getIssueClass(rec.type)}`}>
                      {rec.message}
                      {rec.examples && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          示例：{rec.examples.join('、')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <button 
                  className="btn btn-success"
                  onClick={() => navigate('/jobs')}
                  disabled={!diagnosis.canPublish}
                >
                  📤 保存并返回
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div>填写职位信息后点击"智能诊断"</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                系统将自动分析标题、薪资、JD内容和合规性
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobCreate;
