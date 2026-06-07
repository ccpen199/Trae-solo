import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

function Home() {
  const { user } = useAuthStore();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [stats, setStats] = useState({ companies: 0, jobs: 0, jobseekers: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get('/api/jobs?limit=6');
      setFeaturedJobs(data.jobs.filter(j => j.video_status === 'approved').slice(0, 6));
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/stats');
      setStats({
        companies: data.companies || 0,
        jobs: data.jobs || 0,
        jobseekers: data.jobseekers || 0,
        applications: data.hired || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const getCreditColor = (score) => {
    if (score >= 90) return '#16a34a';
    if (score >= 80) return '#4f46e5';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  return (
    <div>
      <section style={{ 
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)',
        color: 'white',
        padding: '80px 0'
      }}>
        <div className="container">
          <div style={{ maxWidth: '700px' }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: '800', 
              marginBottom: '16px',
              lineHeight: '1.2'
            }}>
              视频驱动的<br/>职场连接平台
            </h1>
            <p style={{ 
              fontSize: '18px', 
              opacity: '0.9', 
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              企业通过视频展示真实工作环境，求职者用视频简历展现个人魅力。
              更直观、更高效、更真实的招聘体验。
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link to="/jobs" className="btn btn-lg" style={{ 
                background: 'white', 
                color: '#4f46e5',
                fontWeight: '600'
              }}>
                浏览岗位
              </Link>
              <Link to="/register" className="btn btn-lg" style={{ 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: '600'
              }}>
                立即注册
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 0' }}>
        <div className="grid grid-4" style={{ marginBottom: '60px' }}>
          <div className="card" style={{ padding: '28px', textAlign: 'center', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>{stats.companies}+</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>入驻企业</div>
          </div>
          <div className="card" style={{ padding: '28px', textAlign: 'center', background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', color: 'white' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>{stats.jobs}+</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>视频岗位</div>
          </div>
          <div className="card" style={{ padding: '28px', textAlign: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>{stats.jobseekers}+</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>求职者</div>
          </div>
          <div className="card" style={{ padding: '28px', textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>{stats.applications}+</div>
            <div style={{ fontSize: '14px', opacity: '0.9' }}>成功匹配</div>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginBottom: '60px' }}>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '40px', 
              marginBottom: '16px'
            }}>🎬</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>企业视频招聘</h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
              上传岗位介绍视频，展示真实工作环境、团队氛围和企业文化
            </p>
          </div>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '40px', 
              marginBottom: '16px'
            }}>📹</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>视频简历</h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
              录制个人视频简历，配合美颜和字幕功能，全方位展示个人能力
            </p>
          </div>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '40px', 
              marginBottom: '16px'
            }}>🤖</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>AI智能匹配</h3>
            <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
              基于视频语义和文本描述，智能计算岗位与求职者匹配度
            </p>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>热门岗位</h2>
            <Link to="/jobs" style={{ color: '#4f46e5', fontSize: '14px' }}>
              查看全部 →
            </Link>
          </div>

          {loading ? (
            <div className="text-center text-muted" style={{ padding: '40px 0' }}>加载中...</div>
          ) : featuredJobs.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
              <h3 style={{ marginBottom: '8px' }}>视频岗位正在加载中</h3>
              <p className="text-muted">马上就有精彩的视频招聘内容</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {featuredJobs.map(job => (
                <Link to={`/jobs/${job.id}`} key={job.id} className="card" style={{ 
                  padding: '24px', 
                  display: 'block',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  textDecoration: 'none',
                  color: 'inherit'
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                }} onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', 
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      🏢
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '15px', 
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {job.title}
                        <span className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          ▶ 视频
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{job.company_name}</span>
                        <span style={{ 
                          color: getCreditColor(job.company_credit || 80),
                          fontWeight: '500',
                          fontSize: '11px'
                        }}>
                          ⭐ {job.company_credit || 80}分
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#4f46e5',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px'
                  }}>
                    {job.salary_min}K - {job.salary_max}K
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '400' }}>
                      · {job.experience_required || '经验不限'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {job.skills?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="skill-tag" style={{ fontSize: '11px', padding: '2px 8px' }}>{skill}</span>
                    ))}
                    {job.skills?.length > 3 && (
                      <span className="skill-tag" style={{ fontSize: '11px', padding: '2px 8px' }}>+{job.skills.length - 3}</span>
                    )}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#6b7280',
                    paddingTop: '10px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <span>📍 {job.location || '不限'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>👁️ {job.views_count || 0}</span>
                      {job.company_verified === 1 && (
                        <span style={{ color: '#16a34a' }}>✓ 认证</span>
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: '#f9fafb', padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px' }}>
              准备好开启新的职业旅程了吗？
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '32px' }}>
              加入视聘，用视频连接更好的机会
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to="/register?role=jobseeker" className="btn btn-primary btn-lg">
                我要求职
              </Link>
              <Link to="/register?role=company" className="btn btn-outline btn-lg">
                我要招聘
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
