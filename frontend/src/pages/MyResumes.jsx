import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumeAPI } from '../utils/api';

function MyResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const res = await resumeAPI.getMyResumes();
      setResumes(res.data.resumes);
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (resume) => {
    try {
      await resumeAPI.updateResume(resume.id, { is_active: resume.is_active ? 0 : 1 });
      loadResumes();
    } catch (err) {
      console.error('Failed to update resume:', err);
    }
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📄 我的简历</h1>
        <Link to="/my/resumes/new" className="btn btn-primary">
          + 创建简历
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <p style={{ marginBottom: 16 }}>您还没有创建简历</p>
          <Link to="/my/resumes/new" className="btn btn-primary">创建第一份简历</Link>
        </div>
      ) : (
        <div className="grid-2">
          {resumes.map(resume => (
            <div key={resume.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{resume.title}</h3>
                  <span className={`badge ${resume.is_active ? 'badge-success' : 'badge-warning'}`}>
                    {resume.is_active ? '已发布' : '已下架'}
                  </span>
                </div>
                <div style={{ color: 'var(--secondary-color)', fontWeight: 600 }}>
                  {resume.expected_salary_min}K-{resume.expected_salary_max}K
                </div>
              </div>

              {resume.skills && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {resume.skills.slice(0, 5).map((skill, i) => (
                    <span key={i} className="tag tag-primary">{skill}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                <span>👁️ {resume.view_count} 浏览</span>
                <span>📮 {resume.application_count || 0} 投递</span>
                <span>🕐 更新于 {resume.updated_at?.split('T')[0]}</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/my/resumes/${resume.id}/edit`} className="btn btn-sm btn-secondary">
                  编辑
                </Link>
                <button
                  className={`btn btn-sm ${resume.is_active ? 'btn-outline' : 'btn-success'}`}
                  onClick={() => toggleActive(resume)}
                >
                  {resume.is_active ? '下架' : '发布'}
                </button>
                <Link to={`/resumes/${resume.id}`} className="btn btn-sm btn-outline" target="_blank">
                  预览
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyResumes;
