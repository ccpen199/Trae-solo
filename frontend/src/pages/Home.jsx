
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store.js';
import { jobAPI, userAPI, referralAPI } from '../api.js';

export default function Home() {
  const { user } = useStore();
  const [friendJobs, setFriendJobs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, referralsRes] = await Promise.all([
          userAPI.getFriendsJobs(),
          referralAPI.list({ type: user?.role === 'employer' ? 'company' : 'received' })
        ]);
        setFriendJobs(jobsRes.data.jobs || []);
        setReferrals(referralsRes.data.referrals || []);
      } catch (e) {
        console.error('获取首页数据失败:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  const getStatusText = (status) => {
    const map = {
      pending: '待处理',
      reviewing: '审核中',
      interviewing: '面试中',
      offer: '已发Offer',
      hired: '已入职',
      rejected: '已拒绝',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const getRoleWorkbench = () => {
    if (user?.role === 'admin') {
      return [
        { icon: '📊', title: '数据统计', desc: '查看平台运营数据统计', link: '/admin' },
        { icon: '🏢', title: '企业审核', desc: '审核企业认证申请', link: '/admin' },
        { icon: '📋', title: '审计日志', desc: '查看系统操作审计记录', link: '/admin' },
        { icon: '🔒', title: 'IP管理', desc: '管理IP限流和解封', link: '/admin' }
      ];
    }
    if (user?.role === 'employer') {
      return [
        { icon: '🏢', title: '企业管理', desc: '管理企业信息和资质', link: '/companies' },
        { icon: '💼', title: '发布职位', desc: '发布新职位并设置福利', link: '/post-job' },
        { icon: '🎁', title: '内推奖励', desc: '设置内推奖励规则', link: '/companies' },
        { icon: '📸', title: '门店照片', desc: '上传带地理围栏的实景照片', link: '/companies' },
        { icon: '📋', title: '内推管理', desc: '审核和管理内推申请', link: '/referrals?type=company' },
        { icon: '✅', title: '关系核验', desc: '验证推荐人微信关系', link: '/referrals' },
        { icon: '📝', title: '入职流程', desc: '管理3小时极速入职流程', link: '/onboarding' }
      ];
    }
    return [
      { icon: '🔍', title: '浏览职位', desc: '查看所有在招职位', link: '/jobs' },
      { icon: '👥', title: '好友公司', desc: '授权查看好友在职企业岗位', link: '/friends' },
      { icon: '📨', title: '发起内推', desc: '向好友申请内推机会', link: '/jobs' },
      { icon: '📋', title: '内推追踪', desc: '查看内推申请状态', link: '/referrals?type=received' },
      { icon: '💬', title: '简历沟通', desc: '发送富文本/图片/视频简历', link: '/messages' },
      { icon: '📝', title: '极速入职', desc: '3小时完成合同签署和培训', link: '/onboarding' }
    ];
  };

  const workbench = getRoleWorkbench();

  return (
    <div>
      <div className="home-hero">
        <div className="container">
          <h1>欢迎回来，{user?.username}！</h1>
          <p>
            <span className="tag verified" style={{ marginRight: 8, fontSize: 14 }}>
              {user?.role === 'admin' ? '⚙️ 管理员' : user?.role === 'employer' ? '🏢 企业用户' : '👤 求职者'}
            </span>
            基于熟人信任的招聘平台，让好工作找到靠谱的人。
            通过好友内推，获得更靠谱的工作机会和更丰厚的内推奖励。
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to={workbench[0]?.link || '/jobs'} className="btn btn-primary btn-lg">
              {workbench[0]?.icon} {workbench[0]?.title}
            </Link>
            <Link to="/friends" className="btn btn-secondary btn-lg">
              👥 管理好友
            </Link>
            {user?.role === 'jobseeker' && (
              <Link to="/referrals?type=received" className="btn btn-secondary btn-lg">
                📨 我的内推
              </Link>
            )}
            {user?.role === 'employer' && (
              <Link to="/post-job" className="btn btn-success btn-lg">
                ➕ 发布职位
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-warning btn-lg">
                ⚙️ 管理后台
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container page-content">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 className="page-title">
              {user?.role === 'admin' ? '⚙️ 管理员工作台' : 
               user?.role === 'employer' ? '🏢 企业端工作台' : '👤 求职者工作台'}
            </h2>
          </div>
          <div className="features">
            {workbench.map((item, index) => (
              <Link key={index} to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="feature-card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} 
                     onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="feature-icon">{item.icon}</div>
                  <div className="feature-title">{item.title}</div>
                  <div className="feature-desc">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <div className="feature-title">熟人内推</div>
            <div className="feature-desc">
              基于真实好友关系，让求职更靠谱，避免简历石沉大海
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <div className="feature-title">丰厚奖励</div>
            <div className="feature-desc">
              成功推荐好友入职，可获得现金或假期奖励，最高可达数万元
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">极速入职</div>
            <div className="feature-desc">
              3小时极速入职流程，电子合同签署+岗前培训，高效便捷
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">安全可信</div>
            <div className="feature-desc">
              企业营业执照认证，微信关系验证，所有消息加密存储
            </div>
          </div>
        </div>

        {friendJobs.length > 0 && (
          <div className="card">
            <div className="page-header" style={{ marginBottom: 16 }}>
              <h2 className="page-title">🔥 好友公司在招职位</h2>
              <Link to="/jobs" className="btn btn-sm btn-primary">查看全部</Link>
            </div>
            <div className="job-list">
              {friendJobs.slice(0, 4).map(job => (
                <Link to={`/jobs/${job.id}`} key={job.id} className="job-card">
                  <div className="job-title">{job.title}</div>
                  <div className="job-salary">{job.salary_min}-{job.salary_max}K</div>
                  <div className="job-company">
                    {job.company_verified && <span className="tag verified">✓ 已认证</span>}
                    {' '}{job.company_name}
                  </div>
                  <div className="job-tags">
                    <span className="tag">{job.location}</span>
                    <span className="tag">{job.position_level === 'senior' ? '高级' : job.position_level === 'middle' ? '中级' : '初级'}</span>
                    {job.reward_amount && (
                      <span className="tag reward">🎁 推荐奖 ¥{job.reward_amount}</span>
                    )}
                    {job.reward_days && (
                      <span className="tag reward">🎁 推荐奖 {job.reward_days}天假期</span>
                    )}
                  </div>
                  <div className="job-footer">
                    <div className="referrer-info">
                      <span>👤 推荐人: {job.referrer_name}</span>
                      {job.wechat_verified && <span className="tag verified" style={{ marginLeft: 8 }}>✓ 微信已验证</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {referrals.length > 0 && (
          <div className="card">
            <div className="page-header" style={{ marginBottom: 16 }}>
              <h2 className="page-title">📋 最近内推记录</h2>
              <Link to="/referrals" className="btn btn-sm btn-primary">查看全部</Link>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>职位</th>
                  <th>公司</th>
                  {user?.role !== 'jobseeker' && <th>候选人</th>}
                  {user?.role === 'jobseeker' && <th>推荐人</th>}
                  <th>状态</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 5).map(r => (
                  <tr key={r.id}>
                    <td><Link to={`/referrals/${r.id}`} style={{ color: '#667eea' }}>{r.job_title}</Link></td>
                    <td>{r.company_name}</td>
                    {user?.role !== 'jobseeker' && <td>{r.candidate_name}</td>}
                    {user?.role === 'jobseeker' && <td>{r.referrer_name}</td>}
                    <td>
                      <span className={`status-badge status-${r.status}`}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td style={{ color: '#999', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="how-it-works">
          <h2 className="section-title">如何使用</h2>
          <div className="steps-row">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-title">添加好友</div>
              <div className="step-desc">通过手机号或微信ID添加好友，建立信任关系</div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-title">浏览职位</div>
              <div className="step-desc">查看好友所在公司的在招职位，了解内推奖励</div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-title">发起内推</div>
              <div className="step-desc">选择心仪职位，让好友帮你内推或推荐给好友</div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-title">极速入职</div>
              <div className="step-desc">3小时内完成电子合同签署和岗前培训，快速入职</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
