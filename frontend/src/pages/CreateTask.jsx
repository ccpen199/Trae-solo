import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function CreateTask({ showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'online',
    category: '问卷填写',
    budget: '',
    total_count: '1',
    skills_required: '',
    location: '',
    latitude: '',
    longitude: '',
    radius: '5',
    start_time: '',
    end_time: '',
    require_verification: 'true'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.budget || !formData.category) {
      showToast('请填写所有必填项', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const taskData = {
        ...formData,
        budget: parseFloat(formData.budget),
        total_count: parseInt(formData.total_count),
        radius: formData.radius ? parseInt(formData.radius) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        skills_required: formData.skills_required 
          ? formData.skills_required.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        require_verification: formData.require_verification === 'true'
      };
      
      const response = await api.post('/tasks', taskData);
      showToast('任务发布成功，等待审核', 'success');
      navigate(`/tasks/${response.data.id}`);
    } catch (error) {
      showToast(error.response?.data?.error || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const taskCategories = [
    { type: 'online', categories: ['问卷填写', '内容审核', '试玩推广', '数据录入', '在线客服'] },
    { type: 'offline', categories: ['地推', '快闪活动', '门店驻点', '配送', '搬运'] },
    { type: 'hybrid', categories: ['社区团购', '校园代理', '销售推广', '活动执行'] }
  ];

  const currentCategories = taskCategories.find(t => t.type === formData.task_type)?.categories || [];

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '32px', fontSize: '32px' }}>发布任务</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">任务类型 *</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'online', label: '线上任务', icon: '💻' },
                { value: 'offline', label: '线下任务', icon: '🏪' },
                { value: 'hybrid', label: '混合任务', icon: '🔄' }
              ].map(option => (
                <label
                  key={option.value}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: formData.task_type === option.value 
                      ? '2px solid #667eea' 
                      : '2px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: formData.task_type === option.value ? '#f0f4ff' : 'white'
                  }}
                >
                  <input
                    type="radio"
                    name="task_type"
                    value={option.value}
                    checked={formData.task_type === option.value}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{option.icon}</div>
                  <div style={{ fontWeight: 500 }}>{option.label}</div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">任务标题 *</label>
            <input
              type="text"
              className="form-input"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="简洁描述您的任务"
              maxLength={50}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">任务分类 *</label>
            <select
              className="form-select"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {currentCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">任务描述 *</label>
            <textarea
              className="form-textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="详细描述任务要求、交付标准等"
              rows={6}
            />
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">单人佣金 (元) *</label>
              <input
                type="number"
                className="form-input"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="100"
                min="1"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">招募人数 *</label>
              <input
                type="number"
                className="form-input"
                name="total_count"
                value={formData.total_count}
                onChange={handleChange}
                placeholder="10"
                min="1"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">技能要求（逗号分隔）</label>
            <input
              type="text"
              className="form-input"
              name="skills_required"
              value={formData.skills_required}
              onChange={handleChange}
              placeholder="如：写作, 设计, 销售, 沟通"
            />
          </div>
          
          {formData.task_type !== 'online' && (
            <>
              <div className="form-group">
                <label className="form-label">工作地点</label>
                <input
                  type="text"
                  className="form-input"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="如：北京市朝阳区建国路88号"
                />
              </div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">纬度</label>
                  <input
                    type="text"
                    className="form-input"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="39.9042"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">经度</label>
                  <input
                    type="text"
                    className="form-input"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="116.4074"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">服务半径 (公里)</label>
                <input
                  type="number"
                  className="form-input"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  placeholder="5"
                  min="1"
                />
              </div>
            </>
          )}
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">开始时间</label>
              <input
                type="datetime-local"
                className="form-input"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">结束时间</label>
              <input
                type="datetime-local"
                className="form-input"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">接单要求</label>
            <select
              className="form-select"
              name="require_verification"
              value={formData.require_verification}
              onChange={handleChange}
            >
              <option value="true">仅限实名认证用户</option>
              <option value="false">所有注册用户</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tasks')}
              style={{ padding: '12px 32px' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '12px 48px' }}
            >
              {loading ? '发布中...' : '发布任务'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateTask;
