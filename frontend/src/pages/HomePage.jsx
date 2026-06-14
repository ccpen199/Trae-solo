import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';
import JobCard from '../components/JobCard.jsx';

function HomePage({ user }) {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ jobseekers: 0, employers: 0, jobs: 0, matchRate: 0 });
  const [recruitStats, setRecruitStats] = useState(null);

  useEffect(() => {
    fetchFeaturedJobs();
    fetchStats();
    fetchRecruitStats();
  }, []);

  const fetchFeaturedJobs = async () => {
    try {
      const res = await api.get('/jobs?limit=6&sortBy=rating');
      setFeaturedJobs(res.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats/public');
      setStats(res.data);
    } catch (error) {
      setStats({ jobseekers: 5000, employers: 1000, jobs: 8000, matchRate: 95 });
    }
  };

  const fetchRecruitStats = async () => {
    try {
      const res = await api.get('/admin/stats/public');
      setRecruitStats(res.data);
    } catch (error) {
      setRecruitStats(null);
    }
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', padding: '80px 0', color: 'white', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>蓝领就业精准撮合平台</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px' }}>智能匹配·快速入职·安全可靠</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/jobs" className="btn btn-lg" style={{ background: 'white', color: '#1890ff' }}>
              🔍 搜索筛选岗位
            </Link>
            {user && user.role === 'jobseeker' && (
              <Link to="/jobseeker/recommended" className="btn btn-lg btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                🎯 智能推荐岗位
              </Link>
            )}
            {user && user.role === 'jobseeker' && (
              <Link to="/jobseeker/applications" className="btn btn-lg btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                📋 我的投递进度
              </Link>
            )}
            {user && user.role === 'employer' && (
              <Link to="/employer/jobs" className="btn btn-lg" style={{ background: 'white', color: '#1890ff' }}>
                📝 发布招聘岗位
              </Link>
            )}
            {!user && (
              <Link to="/register" className="btn btn-lg btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                免费注册
              </Link>
            )}
            {user && (
              <Link to="/messages" className="btn btn-lg btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                💬 消息中心
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '60px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '60px' }}>
          {[
            { icon: '🎯', title: '智能匹配', desc: '技能35%+薪资25%+地点20%+企业15%+到岗5%多维度加权', link: '/jobs', linkText: '体验智能匹配' },
            { icon: '⚡', title: '快速入职', desc: '投递→沟通→面试→录用→签约→到岗全流程追踪', link: '/jobs', linkText: '搜索热门岗位' },
            { icon: '🛡️', title: '安全保障', desc: '企业资质认证、风险拦截、举报下架、风控复查', link: user?.role === 'admin' ? '/admin/risk' : '/jobs', linkText: '查看安全体系' },
            { icon: '📈', title: '信用档案', desc: '蓝领信用评分、出勤率、技能认证、招聘效果复盘', link: user?.role === 'jobseeker' ? '/jobseeker/credit' : '/jobseeker/profile', linkText: '完善个人档案' }
          ].map((item, index) => (
            <Link key={index} to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card text-center" style={{ height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ marginBottom: '12px' }}>{item.title}</h3>
                <p className="text-secondary mb-16">{item.desc}</p>
                <span style={{ color: 'var(--primary-color)' }}>{item.linkText} →</span>
              </div>
            </Link>
          ))}
        </div>

        <div>
          <div className="flex flex-between flex-center mb-24">
            <div>
              <h2 className="page-title" style={{ marginBottom: '4px' }}>热门岗位</h2>
              <p className="text-secondary">精选高评分企业认证岗位 · 点击匹配度查看分解说明</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {user && user.role === 'jobseeker' && (
                <Link to="/jobseeker/recommended" className="btn btn-outline btn-sm">
                  🎯 为我推荐
                </Link>
              )}
              <Link to="/jobs" className="text-secondary">查看更多 →</Link>
            </div>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="grid grid-3">
              {featuredJobs.slice(0, 6).map(job => (
                <JobCard key={job.id} job={job} user={user} showActions={true} compact={false} />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '60px' }}>
          <h2 className="page-title" style={{ marginBottom: '4px' }}>招聘效果与风控全景</h2>
          <p className="text-secondary mb-24">曝光率·投递转化率·到岗周期·企业核验·举报下架·信用档案</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: 'none' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#096dd9' }}>
                {recruitStats?.jobs || stats.jobs || 0}
              </div>
              <div style={{ color: '#096dd9', fontWeight: '500' }}>活跃岗位</div>
              <div className="text-sm text-secondary mt-8">浏览量·投递量实时更新</div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', border: 'none' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#389e0d' }}>
                {recruitStats?.employers || stats.employers || 0}
              </div>
              <div style={{ color: '#389e0d', fontWeight: '500' }}>认证企业</div>
              <div className="text-sm text-secondary mt-8">资质核验·风险分级·持续复查</div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe58f 100%)', border: 'none' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d48806' }}>
                {stats.matchRate || 0}%
              </div>
              <div style={{ color: '#d48806', fontWeight: '500' }}>匹配成功率</div>
              <div className="text-sm text-secondary mt-8">五维加权·动态匹配·可分解查看</div>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)', border: 'none' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#cf1322' }}>
                风控巡查
              </div>
              <div style={{ color: '#cf1322', fontWeight: '500' }}>安全护航</div>
              <div className="text-sm text-secondary mt-8">举报下架·企业拦截·信用档案</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <h3 style={{ marginBottom: '20px' }}>业务闭环流程</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {[
              { icon: '🔍', label: '智能搜索', desc: '多维筛选匹配', link: '/jobs' },
              { icon: '📩', label: '投递简历', desc: '身份校验投递', link: '/jobs' },
              { icon: '💬', label: '在线沟通', desc: '文字/语音/附件', link: user ? '/messages' : '/login' },
              { icon: '📞', label: '面试确认', desc: '进度实时追踪', link: user?.role === 'jobseeker' ? '/jobseeker/applications' : '/login' },
              { icon: '✍️', label: '签约录用', desc: '状态变更记录', link: user?.role === 'jobseeker' ? '/jobseeker/applications' : '/login' },
              { icon: '🎉', label: '到岗入职', desc: '闭环完成复查', link: user?.role === 'jobseeker' ? '/jobseeker/applications' : '/login' }
            ].map((step, idx) => (
              <Link key={idx} to={step.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card text-center" style={{ padding: '20px 12px', position: 'relative' }}>
                  {idx < 5 && (
                    <div style={{
                      position: 'absolute', right: '-12px', top: '50%',
                      transform: 'translateY(-50%)', color: '#d9d9d9', fontSize: '18px', zIndex: 2
                    }}>→</div>
                  )}
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{step.icon}</div>
                  <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>{step.label}</div>
                  <div className="text-xs text-secondary">{step.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <h2 className="page-title">平台数据</h2>
          <p className="text-secondary mb-24">曝光率·投递转化率·到岗周期·企业核验率全透明</p>
          <div className="grid grid-4" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {[
              { num: `${stats.jobseekers}+`, label: '注册求职者' },
              { num: `${stats.employers}+`, label: '认证企业' },
              { num: `${stats.jobs}+`, label: '发布岗位' },
              { num: `${stats.matchRate}%`, label: '匹配成功率' }
            ].map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-value">{stat.num}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <h3 style={{ marginBottom: '20px' }}>管理入口</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/login'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div style={{ fontWeight: '600' }}>数据仪表盘</div>
                <div className="text-sm text-secondary mt-4">招聘转化漏斗·运营效率·今日待办</div>
              </div>
            </Link>
            <Link to={user?.role === 'admin' ? '/admin/employers' : '/login'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
                <div style={{ fontWeight: '600' }}>企业核验</div>
                <div className="text-sm text-secondary mt-4">资质审核·岗位查重·高风险拦截</div>
              </div>
            </Link>
            <Link to={user?.role === 'admin' ? '/admin/reports' : '/login'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚨</div>
                <div style={{ fontWeight: '600' }}>举报下架</div>
                <div className="text-sm text-secondary mt-4">虚假信息·收费诈骗·违规招聘</div>
              </div>
            </Link>
            <Link to={user?.role === 'admin' ? '/admin/risk' : '/login'} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
                <div style={{ fontWeight: '600' }}>风控中心</div>
                <div className="text-sm text-secondary mt-4">风险分级·警告封禁·复查记录</div>
              </div>
            </Link>
          </div>
        </div>

        {user && user.role === 'jobseeker' && (
          <div style={{ marginTop: '60px' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', border: 'none', padding: '32px' }}>
              <div className="flex flex-between flex-center">
                <div>
                  <h2 style={{ marginBottom: '8px', color: '#389e0d' }}>🎯 开启您的职业新旅程</h2>
                  <p className="text-secondary" style={{ color: '#52c41a' }}>完善个人信息，获取精准岗位推荐，实时追踪入职进度</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link to="/jobseeker/profile" className="btn btn-primary btn-lg">完善个人信息</Link>
                  <Link to="/jobseeker/recommended" className="btn btn-outline btn-lg">查看智能推荐</Link>
                  <Link to="/jobseeker/applications" className="btn btn-outline btn-lg">查看入职进度</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {user && user.role === 'employer' && (
          <div style={{ marginTop: '60px' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: 'none', padding: '32px' }}>
              <div className="flex flex-between flex-center">
                <div>
                  <h2 style={{ marginBottom: '8px', color: '#096dd9' }}>💼 高效招聘，精准匹配</h2>
                  <p className="text-secondary" style={{ color: '#1890ff' }}>发布岗位获取智能推荐求职者，实时沟通，快速到岗</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link to="/employer/jobs/new" className="btn btn-primary btn-lg">发布新岗位</Link>
                  <Link to="/employer/applications" className="btn btn-outline btn-lg">查看投递简历</Link>
                  <Link to="/employer/dashboard" className="btn btn-outline btn-lg">招聘效果分析</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {user && user.role === 'admin' && (
          <div style={{ marginTop: '60px' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', border: 'none', padding: '32px' }}>
              <div className="flex flex-between flex-center">
                <div>
                  <h2 style={{ marginBottom: '8px', color: '#722ed1' }}>🛡️ 平台管理中枢</h2>
                  <p className="text-secondary" style={{ color: '#9254de' }}>数据仪表盘·企业核验·举报下架·风控复查·信用档案</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link to="/admin/dashboard" className="btn btn-primary btn-lg">数据仪表盘</Link>
                  <Link to="/admin/employers" className="btn btn-outline btn-lg">企业核验</Link>
                  <Link to="/admin/risk" className="btn btn-outline btn-lg">风控中心</Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
