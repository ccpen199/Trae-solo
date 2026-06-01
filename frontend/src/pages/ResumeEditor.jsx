import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeAPI } from '../utils/api';

function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    skills: [],
    expected_salary_min: 15,
    expected_salary_max: 25,
    available_date: '',
    self_intro: '',
    work_experience: [],
    education_experience: [],
  });

  const [skillInput, setSkillInput] = useState('');
  const [workExp, setWorkExp] = useState({
    company: '', position: '', start_date: '', end_date: '', description: ''
  });
  const [eduExp, setEduExp] = useState({
    school: '', major: '', degree: '', start_date: '', end_date: ''
  });

  useEffect(() => {
    if (isEdit) {
      loadResume();
    }
  }, [id]);

  const loadResume = async () => {
    try {
      setLoading(true);
      const res = await resumeAPI.getResume(id);
      const r = res.data.resume;
      setFormData({
        title: r.title || '',
        skills: r.skills || [],
        expected_salary_min: r.expected_salary_min || 15,
        expected_salary_max: r.expected_salary_max || 25,
        available_date: r.available_date || '',
        self_intro: r.self_intro || '',
        work_experience: r.work_experience || [],
        education_experience: r.education_experience || [],
      });
    } catch (err) {
      console.error('Failed to load resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('请输入简历标题');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await resumeAPI.updateResume(id, formData);
      } else {
        await resumeAPI.createResume(formData);
      }
      navigate('/my/resumes');
    } catch (err) {
      alert(err.response?.data?.error || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const addWorkExp = () => {
    if (!workExp.company || !workExp.position) {
      alert('请填写公司和职位');
      return;
    }
    setFormData({
      ...formData,
      work_experience: [...formData.work_experience, { ...workExp }]
    });
    setWorkExp({ company: '', position: '', start_date: '', end_date: '', description: '' });
  };

  const removeWorkExp = (index) => {
    setFormData({
      ...formData,
      work_experience: formData.work_experience.filter((_, i) => i !== index)
    });
  };

  const addEduExp = () => {
    if (!eduExp.school || !eduExp.major) {
      alert('请填写学校和专业');
      return;
    }
    setFormData({
      ...formData,
      education_experience: [...formData.education_experience, { ...eduExp }]
    });
    setEduExp({ school: '', major: '', degree: '', start_date: '', end_date: '' });
  };

  const removeEduExp = (index) => {
    setFormData({
      ...formData,
      education_experience: formData.education_experience.filter((_, i) => i !== index)
    });
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ 编辑简历' : '➕ 创建简历'}</h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/my/resumes')}
        >
          取消
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>基本信息</h2>
          
          <div className="form-group">
            <label className="form-label">简历标题 *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="如：高级前端工程师、产品经理"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">期望薪资下限 (K)</label>
              <input
                type="number"
                className="form-input"
                value={formData.expected_salary_min}
                onChange={(e) => setFormData({ ...formData, expected_salary_min: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">期望薪资上限 (K)</label>
              <input
                type="number"
                className="form-input"
                value={formData.expected_salary_max}
                onChange={(e) => setFormData({ ...formData, expected_salary_max: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">可到岗时间</label>
            <input
              type="date"
              className="form-input"
              value={formData.available_date}
              onChange={(e) => setFormData({ ...formData, available_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">技能标签</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="form-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="输入技能后按回车添加，如 React、Python"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button type="button" className="btn btn-secondary" onClick={addSkill}>添加</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {formData.skills.map((skill, i) => (
                <span key={i} className="tag tag-primary" style={{ cursor: 'pointer' }} onClick={() => removeSkill(i)}>
                  {skill} ×
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">自我介绍</label>
            <textarea
              className="form-textarea"
              value={formData.self_intro}
              onChange={(e) => setFormData({ ...formData, self_intro: e.target.value })}
              placeholder="简单介绍一下自己，突出您的优势和特点..."
              rows={4}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>💼 工作经历</h2>
          
          {formData.work_experience.map((exp, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12, position: 'relative' }}>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                style={{ position: 'absolute', top: 12, right: 12 }}
                onClick={() => removeWorkExp(i)}
              >
                删除
              </button>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{exp.company} - {exp.position}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                {exp.start_date} - {exp.end_date || '至今'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{exp.description}</div>
            </div>
          ))}

          <div style={{ padding: 16, border: '2px dashed var(--border-color)', borderRadius: 8 }}>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="公司名称"
                value={workExp.company}
                onChange={(e) => setWorkExp({ ...workExp, company: e.target.value })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="职位"
                value={workExp.position}
                onChange={(e) => setWorkExp({ ...workExp, position: e.target.value })}
              />
            </div>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="开始时间 (如 2021-03)"
                value={workExp.start_date}
                onChange={(e) => setWorkExp({ ...workExp, start_date: e.target.value })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="结束时间 (如 2024-01，至今留空)"
                value={workExp.end_date}
                onChange={(e) => setWorkExp({ ...workExp, end_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="工作描述"
                value={workExp.description}
                onChange={(e) => setWorkExp({ ...workExp, description: e.target.value })}
                rows={3}
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={addWorkExp}>
              + 添加工作经历
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>🎓 教育经历</h2>
          
          {formData.education_experience.map((edu, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12, position: 'relative' }}>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                style={{ position: 'absolute', top: 12, right: 12 }}
                onClick={() => removeEduExp(i)}
              >
                删除
              </button>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{edu.school} - {edu.major}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {edu.degree} · {edu.start_date} - {edu.end_date}
              </div>
            </div>
          ))}

          <div style={{ padding: 16, border: '2px dashed var(--border-color)', borderRadius: 8 }}>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="学校名称"
                value={eduExp.school}
                onChange={(e) => setEduExp({ ...eduExp, school: e.target.value })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="专业"
                value={eduExp.major}
                onChange={(e) => setEduExp({ ...eduExp, major: e.target.value })}
              />
            </div>
            <div className="grid-3" style={{ gap: 12, marginBottom: 12 }}>
              <select
                className="form-select"
                value={eduExp.degree}
                onChange={(e) => setEduExp({ ...eduExp, degree: e.target.value })}
              >
                <option value="">学历</option>
                <option value="大专">大专</option>
                <option value="本科">本科</option>
                <option value="硕士">硕士</option>
                <option value="博士">博士</option>
              </select>
              <input
                type="text"
                className="form-input"
                placeholder="开始时间"
                value={eduExp.start_date}
                onChange={(e) => setEduExp({ ...eduExp, start_date: e.target.value })}
              />
              <input
                type="text"
                className="form-input"
                placeholder="结束时间"
                value={eduExp.end_date}
                onChange={(e) => setEduExp({ ...eduExp, end_date: e.target.value })}
              />
            </div>
            <button type="button" className="btn btn-secondary" onClick={addEduExp}>
              + 添加教育经历
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/my/resumes')}>
            取消
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? '保存中...' : (isEdit ? '保存修改' : '创建简历')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ResumeEditor;
