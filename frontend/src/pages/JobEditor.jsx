import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../utils/api';

function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [],
    salary_min: 15,
    salary_max: 25,
    city: '北京市朝阳区',
    location_lat: 39.9087,
    location_lng: 116.4074,
    address: '',
    work_type: '全职',
    experience_required: '1-3年',
    education_required: '本科',
    video_url: '',
    office_images: [],
    team_vlog_url: '',
  });

  const [reqInput, setReqInput] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const res = await jobAPI.getJob(id);
      const j = res.data.job;
      setFormData({
        title: j.title || '',
        description: j.description || '',
        requirements: j.requirements || [],
        salary_min: j.salary_min || 15,
        salary_max: j.salary_max || 25,
        city: j.city || '',
        location_lat: j.location_lat || 39.9087,
        location_lng: j.location_lng || 116.4074,
        address: j.address || '',
        work_type: j.work_type || '全职',
        experience_required: j.experience_required || '1-3年',
        education_required: j.education_required || '本科',
        video_url: j.video_url || '',
        office_images: j.office_images || [],
        team_vlog_url: j.team_vlog_url || '',
      });
    } catch (err) {
      console.error('Failed to load job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('请输入职位名称');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await jobAPI.updateJob(id, formData);
      } else {
        await jobAPI.createJob(formData);
      }
      navigate('/my/jobs');
    } catch (err) {
      alert(err.response?.data?.error || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    if (reqInput.trim() && !formData.requirements.includes(reqInput.trim())) {
      setFormData({ ...formData, requirements: [...formData.requirements, reqInput.trim()] });
      setReqInput('');
    }
  };

  const removeRequirement = (index) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  const addOfficeImage = () => {
    const imageUrl = `office_${Date.now()}.jpg`;
    setFormData({
      ...formData,
      office_images: [...formData.office_images, imageUrl]
    });
  };

  const removeOfficeImage = (index) => {
    setFormData({
      ...formData,
      office_images: formData.office_images.filter((_, i) => i !== index)
    });
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ 编辑职位' : '➕ 发布职位'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/my/jobs')}>取消</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>📋 基本信息</h2>

          <div className="form-group">
            <label className="form-label">职位名称 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="如：高级前端开发工程师"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">薪资下限 (K)</label>
              <input
                type="number"
                className="form-input"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">薪资上限 (K)</label>
              <input
                type="number"
                className="form-input"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">工作城市</label>
              <select
                className="form-select"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              >
                <option value="北京市朝阳区">北京市朝阳区</option>
                <option value="北京市海淀区">北京市海淀区</option>
                <option value="北京市西城区">北京市西城区</option>
                <option value="上海市浦东新区">上海市浦东新区</option>
                <option value="深圳市南山区">深圳市南山区</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">工作类型</label>
              <select
                className="form-select"
                value={formData.work_type}
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
              >
                <option value="全职">全职</option>
                <option value="兼职">兼职</option>
                <option value="实习">实习</option>
                <option value="远程">远程</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">经验要求</label>
              <select
                className="form-select"
                value={formData.experience_required}
                onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
              >
                <option value="不限">不限</option>
                <option value="应届生">应届生</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5-10年">5-10年</option>
                <option value="10年以上">10年以上</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">学历要求</label>
              <select
                className="form-select"
                value={formData.education_required}
                onChange={(e) => setFormData({ ...formData, education_required: e.target.value })}
              >
                <option value="不限">不限</option>
                <option value="大专">大专</option>
                <option value="本科">本科</option>
                <option value="硕士">硕士</option>
                <option value="博士">博士</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">详细地址</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="如：朝阳区望京SOHO T3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">职位描述</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述职位的职责和工作内容..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">任职要求</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="form-input"
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                placeholder="输入要求后按回车添加，如：3年以上前端开发经验"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <button type="button" className="btn btn-secondary" onClick={addRequirement}>添加</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {formData.requirements.map((req, i) => (
                <span key={i} className="tag tag-primary" style={{ cursor: 'pointer' }} onClick={() => removeRequirement(i)}>
                  {req} ×
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>🎬 多媒体内容</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
            添加视频介绍和办公环境照片，让求职者更了解您的公司
          </p>

          <div className="form-group">
            <label className="form-label">职位介绍视频 URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">团队 Vlog URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.team_vlog_url}
              onChange={(e) => setFormData({ ...formData, team_vlog_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">办公环境照片</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              {formData.office_images.map((img, i) => (
                <div key={i} style={{
                  width: 120, height: 90,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  color: 'white',
                  fontSize: 24,
                }}>
                  🏢
                  <button
                    type="button"
                    onClick={() => removeOfficeImage(i)}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 24, height: 24,
                      background: 'var(--danger-color)',
                      color: 'white',
                      borderRadius: '50%',
                      fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOfficeImage}
                style={{
                  width: 120, height: 90,
                  border: '2px dashed var(--border-color)',
                  borderRadius: 8,
                  background: 'transparent',
                  fontSize: 24,
                  color: 'var(--text-muted)',
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/my/jobs')}>
            取消
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? '保存中...' : (isEdit ? '保存修改' : '发布职位')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default JobEditor;
