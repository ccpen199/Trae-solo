import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recAPI, jobAPI, resumeAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [hotJobs, setHotJobs] = useState([]);
  const [hotResumes, setHotResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, exploreJobsRes, exploreResumesRes] = await Promise.all([
        user?.role === 'jobseeker' ? recAPI.getRecommendedJobs() : { data: { recommendations: [] } },
        recAPI.getExplore({ type: 'jobs', limit: 6 }),
        recAPI.getExplore({ type: 'resumes', limit: 6 }),
      ]);
      
      setRecommendedJobs(jobsRes.data.recommendations || []);
      setHotJobs(exploreJobsRes.data.items || []);
      setHotResumes(exploreResumesRes.data.items || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        borderRadius: 20,
        padding: '60px 40px',
        marginBottom: 40,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
          <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 16 }}>
            ⚡ 职场即时匹配
          </h1>
          <p style={{ fontSize: 18, opacity: 0.95, marginBottom: 30, lineHeight: 1.8 }}>
            求职者创建动态简历卡片，企业发布带视频介绍的职位快闪页，
            基于 LBS 地理围栏和语义聚类的智能推荐，让人才与机会秒连。
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/jobs" className="btn btn-lg" style={{
              background: 'white',
              color: 'var(--primary-color)',
              fontWeight: 600,
            }}>
              🔍 浏览职位
            </Link>
            <Link to="/resumes" className="btn btn-lg" style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.5)',
              fontWeight: 600,
            }}>
              👥 发现人才
            </Link>
          </div>
        </div>
        <div style={{
          position: 'absolute',
          right: -50,
          bottom: -50,
          fontSize: 200,
          opacity: 0.15,
        }}>
          💼
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 40 }}>
        {[
          { icon: '📄', title: '动态简历卡片', desc: '技能标签、薪资区间、可到岗时间' },
          { icon: '🎬', title: '职位快闪页', desc: '视频介绍、办公环境、团队Vlog' },
          { icon: '💬', title: '实时聊天引擎', desc: '文字/语音/文件，智能意图解析' },
          { icon: '🎯', title: '双路召回推荐', desc: 'LBS 3km优先 + 语义聚类推荐' },
          { icon: '📺', title: '直播招聘间', desc: '弹幕提问、在线投递、虚拟展位' },
          { icon: '🏘️', title: '职业社群', desc: '行业/公司/校友聚类，内推通道' },
          { icon: '🛡️', title: '防刷机制', desc: '设备指纹 + 行为时序分析' },
          { icon: '✅', title: '资质核验', desc: '营业执照OCR + 对公账户打款' },
        ].map((item, i) => (
          <div key={i} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {user?.role === 'jobseeker' && recommendedJobs.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="page-header">
            <h2 className="page-title">🎯 为你推荐</h2>
            <Link to="/jobs" className="text-sm text-primary">查看全部 →</Link>
          </div>
          <div className="grid-3">
            {recommendedJobs.slice(0, 6).map(job => (
              <JobCard key={job.id} job={job} showScore />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 40 }}>
        <div className="page-header">
          <h2 className="page-title">🔥 热门职位</h2>
          <Link to="/jobs" className="text-sm text-primary">查看全部 →</Link>
        </div>
        <div className="grid-3">
          {hotJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      <section>
        <div className="page-header">
          <h2 className="page-title">👥 优质人才</h2>
          <Link to="/resumes" className="text-sm text-primary">查看全部 →</Link>
        </div>
        <div className="grid-3">
          {hotResumes.map(resume => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      </section>
    </div>
  );
}

function JobCard({ job, showScore }) {
  return (
    <Link to={`/jobs/${job.id}`} className="card card-hover" style={{ padding: 20, display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{job.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{job.company_name}</p>
        </div>
        <div style={{ color: 'var(--secondary-color)', fontWeight: 600, fontSize: 16 }}>
          {job.salary_min}K-{job.salary_max}K
        </div>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {job.requirements?.slice(0, 3).map((req, i) => (
          <span key={i} className="tag tag-primary">{req.split('，')[0].split('、')[0].substring(0, 10)}</span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        <span>📍 {job.city}</span>
        {showScore && job.distance !== undefined && (
          <span className="tag tag-success">{job.distance.toFixed(1)}km</span>
        )}
        <span>👁️ {job.view_count}</span>
      </div>
    </Link>
  );
}

function ResumeCard({ resume }) {
  return (
    <Link to={`/resumes/${resume.id}`} className="card card-hover" style={{ padding: 20, display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="avatar avatar-lg">
          {resume.real_name?.charAt(0) || '求'}
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{resume.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {resume.real_name} · {resume.work_years}年 · {resume.education}
          </p>
        </div>
      </div>

      <div style={{ color: 'var(--secondary-color)', fontWeight: 600, marginBottom: 12 }}>
        期望 {resume.expected_salary_min}K-{resume.expected_salary_max}K
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {resume.skills?.slice(0, 4).map((skill, i) => (
          <span key={i} className="tag">{skill}</span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
        <span>📍 {resume.city}</span>
        <span>👁️ {resume.view_count}</span>
      </div>
    </Link>
  );
}

export default Home;
