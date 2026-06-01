import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resumeAPI, chatAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResume();
  }, [id]);

  const loadResume = async () => {
    try {
      const res = await resumeAPI.getResume(id);
      setResume(res.data.resume);
    } catch (err) {
      console.error('Failed to load resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'hr' && user.role !== 'admin') {
      alert('只有企业HR可以联系求职者');
      return;
    }
    try {
      const res = await chatAPI.createChat({
        target_user_id: resume.user_id,
      });
      navigate(`/chat/${res.data.chat_id}`);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  if (loading) return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  if (!resume) return <div className="empty-state">简历不存在或已下架</div>;

  return (
    <div className="grid-3">
      <div style={{ gridColumn: 'span 2' }}>
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div className="avatar" style={{ width: 80, height: 80, fontSize: 28 }}>
                {resume.real_name?.charAt(0) || '求'}
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{resume.title}</h1>
                <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', alignItems: 'center' }}>
                  <span>{resume.real_name}</span>
                  <span>·</span>
                  <span>{resume.work_years}年工作经验</span>
                  <span>·</span>
                  <span>{resume.education}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--secondary-color)' }}>
                {resume.expected_salary_min}K - {resume.expected_salary_max}K
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>期望薪资</div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="tag tag-primary">📍 {resume.city}</span>
              <span className="tag tag-success">可到岗: {resume.available_date || '随时'}</span>
              <span className="tag">👁️ {resume.view_count} 次浏览</span>
            </div>

            {resume.skills && (
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>💡 技能标签</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {resume.skills.map((skill, i) => (
                    <span key={i} className="tag tag-primary">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user?.role === 'hr' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button className="btn btn-primary btn-lg" onClick={handleChat}>
                💬 发起沟通
              </button>
              <button className="btn btn-outline btn-lg">
                ⭐ 收藏
              </button>
            </div>
          )}

          <div className="divider" />

          {resume.self_intro && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📝 自我介绍</h2>
              <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {resume.self_intro}
              </p>
            </section>
          )}

          {resume.work_experience && resume.work_experience.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>💼 工作经历</h2>
              {resume.work_experience.map((exp, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{exp.company} - {exp.position}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{exp.start_date} - {exp.end_date || '至今'}</div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'pre-wrap' }}>{exp.description}</p>
                </div>
              ))}
            </section>
          )}

          {resume.education_experience && resume.education_experience.length > 0 && (
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🎓 教育经历</h2>
              {resume.education_experience.map((edu, i) => (
                <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600 }}>{edu.school} - {edu.major}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{edu.start_date} - {edu.end_date}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{edu.degree}</div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      <div>
        <div className="card" style={{ padding: 24, position: 'sticky', top: 88 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📊 简历概览</h3>
          <div style={{ fontSize: 14, lineHeight: 2.5, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>浏览次数</span>
              <span className="font-medium">{resume.view_count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>所在城市</span>
              <span className="font-medium">{resume.city}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>工作经验</span>
              <span className="font-medium">{resume.work_years}年</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>学历</span>
              <span className="font-medium">{resume.education}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>可到岗时间</span>
              <span className="font-medium">{resume.available_date || '随时'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>更新时间</span>
              <span className="font-medium">{resume.updated_at?.split('T')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeDetail;
