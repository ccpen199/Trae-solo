import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../services/api.js';

function CandidateCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume_text: '',
    tech_stack: '',
    project_experience: '',
    resignation_reason: '',
    job_activity: 'active'
  });
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ category: 'tech', value: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (newTag.value.trim()) {
      setTags([...tags, { category: newTag.category, value: newTag.value.trim() }]);
      setNewTag({ category: 'tech', value: '' });
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const res = await candidatesAPI.create({
        ...formData,
        tags
      });
      navigate(`/candidates/${res.data.id}`);
    } catch (error) {
      console.error('Failed to create candidate:', error);
    }
  };

  const getTagClass = (category) => {
    const classes = {
      tech: 'tag-tech',
      project: 'tag-project',
      reason: 'tag-reason',
      activity: 'tag-activity'
    };
    return classes[category] || 'tag';
  };

  return (
    <div>
      <div className="page-header">
        <h1>➕ 添加人才</h1>
        <p>录入候选人信息并设置多维标签</p>
      </div>

      <div className="card">
        <div className="card-title">基本信息</div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">姓名 *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="候选人姓名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">电话</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="13800138000"
            />
          </div>
          <div className="form-group">
            <label className="form-label">求职活跃度</label>
            <select
              name="job_activity"
              className="form-select"
              value={formData.job_activity}
              onChange={handleChange}
            >
              <option value="active">活跃</option>
              <option value="passive">待激活</option>
              <option value="inactive">不活跃</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">详细信息</div>
        
        <div className="form-group">
          <label className="form-label">技术栈</label>
          <input
            type="text"
            name="tech_stack"
            className="form-input"
            value={formData.tech_stack}
            onChange={handleChange}
            placeholder="React, TypeScript, Node.js（逗号分隔）"
          />
        </div>

        <div className="form-group">
          <label className="form-label">项目经历</label>
          <input
            type="text"
            name="project_experience"
            className="form-input"
            value={formData.project_experience}
            onChange={handleChange}
            placeholder="电商平台、企业管理系统（逗号分隔）"
          />
        </div>

        <div className="form-group">
          <label className="form-label">离职原因</label>
          <select
            name="resignation_reason"
            className="form-select"
            value={formData.resignation_reason}
            onChange={handleChange}
          >
            <option value="">请选择</option>
            <option value="career_development">职业发展</option>
            <option value="salary">薪资待遇</option>
            <option value="location">地理位置</option>
            <option value="team">团队氛围</option>
            <option value="layoff">公司裁员</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">简历内容</label>
          <textarea
            name="resume_text"
            className="form-textarea"
            value={formData.resume_text}
            onChange={handleChange}
            placeholder="粘贴完整简历内容..."
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">多维标签</div>
        
        <div className="form-row" style={{ marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select
              className="form-select"
              value={newTag.category}
              onChange={(e) => setNewTag({ ...newTag, category: e.target.value })}
            >
              <option value="tech">技术栈</option>
              <option value="project">项目经历</option>
              <option value="reason">离职原因</option>
              <option value="activity">活跃度</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={newTag.value}
              onChange={(e) => setNewTag({ ...newTag, value: e.target.value })}
              placeholder="标签值"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <button type="button" className="btn btn-primary" onClick={addTag}>
              添加
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
          {tags.map((tag, idx) => (
            <span 
              key={idx} 
              className={`tag ${getTagClass(tag.category)}`}
              style={{ cursor: 'pointer' }}
              onClick={() => removeTag(idx)}
              title="点击删除"
            >
              {tag.value} ×
            </span>
          ))}
          {tags.length === 0 && (
            <span style={{ color: '#999', fontSize: '14px' }}>暂无标签，添加后点击标签可删除</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-success" onClick={handleSubmit} disabled={!formData.name}>
          💾 保存人才信息
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/candidates')}
        >
          取消
        </button>
      </div>
    </div>
  );
}

export default CandidateCreate;
