import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '../utils/api.js';
import JobCard from '../components/JobCard.jsx';

function JobseekerDashboard({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [creditRecords, setCreditRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [onboardingSteps, setOnboardingSteps] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    phone: '',
    expectedSalaryMin: '',
    expectedSalaryMax: '',
    availableDate: '',
    location: '',
    commuteRadius: '',
    workExperience: '',
    education: '',
    skills: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'jobseeker') {
      setActiveTab(path);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfile();
    } else if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'recommended') {
      fetchRecommended();
    } else if (activeTab === 'credit') {
      fetchCreditRecords();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/jobseekers/profile');
      const p = res.data.profile;
      if (p) {
        setProfile(p);
        setFormData({
          name: p.name || '',
          gender: p.gender || '',
          age: p.age || '',
          phone: p.phone || '',
          expectedSalaryMin: p.expected_salary_min || '',
          expectedSalaryMax: p.expected_salary_max || '',
          availableDate: p.available_date || '',
          location: p.location || '',
          commuteRadius: p.commute_radius || '',
          workExperience: p.work_experience || '',
          education: p.education || '',
          skills: p.skills || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications/my');
      setApplications(res.data.applications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const res = await api.get('/matching/jobs/recommended');
      setRecommendedJobs(res.data.jobs);
    } catch (error) {
      console.error('Failed to fetch recommended jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditRecords = async () => {
    try {
      const res = await api.get('/jobseekers/credit-records');
      setCreditRecords(res.data.records || []);
    } catch (error) {
      console.error('Failed to fetch credit records:', error);
      setCreditRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingSteps = async (appId) => {
    try {
      const res = await api.get(`/applications/${appId}/onboarding`);
      setOnboardingSteps(res.data.steps);
    } catch (error) {
      console.error('Failed to fetch onboarding steps:', error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');

    try {
      await api.put('/jobseekers/profile', formData);
      setSuccess('个人信息保存成功，智能推荐已更新');
      fetchProfile();
    } catch (error) {
      console.error('Failed to save profile:', error);
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

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '待处理', class: 'badge-warning' },
      reviewing: { text: '审核中', class: 'badge-info' },
      interview: { text: '面试中', class: 'badge-info' },
      accepted: { text: '已录用', class: 'badge-success' },
      rejected: { text: '已拒绝', class: 'badge-error' },
      hired: { text: '已入职', class: 'badge-success' }
    };
    const s = statusMap[status] || { text: status, class: '' };
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  };

  const getStepLabel = (type) => {
    const labels = {
      interview: '面试',
      offer: '录用',
      contract: '签约',
      onboarding: '到岗'
    };
    return labels[type] || type;
  };

  const getStepIcon = (type) => {
    const icons = {
      interview: '📞',
      offer: '📋',
      contract: '✍️',
      onboarding: '🎉'
    };
    return icons[type] || '📌';
  };

  const menuItems = [
    { key: 'profile', label: '👤 个人信息', path: '/jobseeker/profile' },
    { key: 'recommended', label: '🎯 智能推荐', path: '/jobseeker/recommended' },
    { key: 'applications', label: '📋 我的投递', path: '/jobseeker/applications' },
    { key: 'credit', label: '📈 信用档案', path: '/jobseeker/credit' },
    { key: 'messages', label: '💬 消息中心', path: '/messages' }
  ];

  const renderOnboardingTimeline = (application) => {
    const stepOrder = ['interview', 'offer', 'contract', 'onboarding'];
    const currentIdx = stepOrder.findIndex(s => s === application.status.replace('hired', 'onboarding'));

    return (
      <div className="card mt-16" style={{ background: '#fafafa' }}>
        <h4 style={{ marginBottom: '20px' }}>入职进度追踪</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '5%', 
            right: '5%', 
            height: '4px', 
            background: '#e8e8e8',
            zIndex: 0 
          }}></div>
          {stepOrder.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={step} style={{ textAlign: 'center', position: 'relative', zIndex: 1, flex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isCompleted ? '#52c41a' : '#fff',
                  border: `3px solid ${isCompleted ? '#52c41a' : '#d9d9d9'}`,
                  color: isCompleted ? '#fff' : '#bfbfbf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div style={{ fontWeight: isCurrent ? '600' : '400', color: isCompleted ? '#389e0d' : '#8c8c8c' }}>
                  {getStepIcon(step)} {getStepLabel(step)}
                </div>
                {onboardingSteps && onboardingSteps[idx]?.scheduled_at && (
                  <div className="text-xs text-secondary" style={{ marginTop: '4px' }}>
                    预计：{onboardingSteps[idx].scheduled_at.split('T')[0]}
                  </div>
                )}
                {onboardingSteps && onboardingSteps[idx]?.notes && (
                  <div className="text-xs" style={{ marginTop: '4px', color: '#8c8c8c' }}>
                    {onboardingSteps[idx].notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-end gap-8 mt-16">
          <button className="btn btn-outline btn-sm" onClick={() => setSelectedApplication(null)}>
            收起
          </button>
          <Link 
            to={`/messages/${application.employer_id}`} 
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            联系HR
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="main-layout">
      <div className="sidebar">
        {profile && (
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{profile.name}</div>
            <div className="text-sm text-secondary">{profile.phone}</div>
            {profile.credit_score !== undefined && (
              <div className="text-sm mt-8" style={{ color: '#52c41a' }}>
                信用分：{profile.credit_score}
              </div>
            )}
            {profile.attendance_rate !== undefined && (
              <div className="text-sm text-secondary">
                出勤率：{profile.attendance_rate}%
              </div>
            )}
          </div>
        )}
        {menuItems.map(item => (
          <Link
            key={item.key}
            to={item.path}
            className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="main-content">
        {success && <div className="alert alert-success">{success}</div>}
        
        <Routes>
          <Route path="profile" element={
            <div>
              <h2 className="page-title">个人信息</h2>
              <p className="text-secondary mb-24">完善您的信息以获得更精准的岗位推荐</p>
              
              <div className="card">
                <form onSubmit={handleSaveProfile}>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">姓名 *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">性别</label>
                      <select
                        className="form-select"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">请选择</option>
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">年龄</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">手机号</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">期望薪资下限（元/月）</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.expectedSalaryMin}
                        onChange={(e) => setFormData({ ...formData, expectedSalaryMin: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">期望薪资上限（元/月）</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.expectedSalaryMax}
                        onChange={(e) => setFormData({ ...formData, expectedSalaryMax: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">可到岗日期</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.availableDate}
                        onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">期望工作地点</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="如：上海市"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">通勤半径（公里）</label>
                      <select
                        className="form-select"
                        value={formData.commuteRadius}
                        onChange={(e) => setFormData({ ...formData, commuteRadius: e.target.value })}
                      >
                        <option value="">不限</option>
                        <option value="5">5公里内</option>
                        <option value="10">10公里内</option>
                        <option value="20">20公里内</option>
                        <option value="30">30公里内</option>
                        <option value="50">50公里内</option>
                        <option value="100">100公里内</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">学历</label>
                      <select
                        className="form-select"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      >
                        <option value="">请选择</option>
                        <option value="小学">小学</option>
                        <option value="初中">初中</option>
                        <option value="高中">高中</option>
                        <option value="中专">中专</option>
                        <option value="大专">大专</option>
                        <option value="本科">本科</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">技能标签</label>
                    <div className="flex gap-8" style={{ marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="输入技能后按回车添加，如：电工、焊工、叉车司机"
                        style={{ flex: 1 }}
                      />
                      <button type="button" className="btn btn-outline" onClick={addSkill}>添加</button>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      {formData.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="tag tag-primary" 
                          style={{ cursor: 'pointer', marginRight: '6px', marginBottom: '6px' }} 
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </span>
                      ))}
                    </div>
                    <div className="text-secondary text-sm" style={{ marginBottom: '8px' }}>常用技能（点击添加）：</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {['电工', '焊工', '叉车司机', '搬运工', '包装工', '厨师', '服务员', '保安', '快递员', '家政', '装修工', '木工', '水电工', '司机', '仓管员', '质检员', '普工', '技工', '销售', '客服']
                        .filter(s => !formData.skills.includes(s))
                        .slice(0, 12)
                        .map(skill => (
                          <span
                            key={skill}
                            className="tag tag-outline"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setFormData({ ...formData, skills: [...formData.skills, skill] })}
                          >
                            + {skill}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">工作经验</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '100px' }}
                      value={formData.workExperience}
                      onChange={(e) => setFormData({ ...formData, workExperience: e.target.value })}
                      placeholder="描述您的工作经历、技能特长、证书资质等..."
                    />
                  </div>

                  <div className="flex gap-8">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? '保存中...' : '💾 保存信息'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => navigate('/jobseeker/recommended')}
                    >
                      🎯 查看智能推荐
                    </button>
                  </div>
                </form>
              </div>
            </div>
          } />

          <Route path="recommended" element={
            <div>
              <div className="flex flex-between flex-center mb-24">
                <div>
                  <h2 className="page-title" style={{ marginBottom: '4px' }}>智能推荐岗位</h2>
                  <p className="text-secondary">基于您的技能、薪资期望、地点偏好和可到岗时间智能匹配</p>
                </div>
                <Link to="/jobseeker/profile" className="btn btn-outline btn-sm">完善匹配条件</Link>
              </div>
              
              {recommendedJobs.length === 0 ? (
                <div className="card text-center">
                  <p className="text-secondary mb-16">请先完善个人信息以获取智能推荐</p>
                  <Link to="/jobseeker/profile" className="btn btn-primary">完善个人信息</Link>
                </div>
              ) : (
                recommendedJobs.map(job => (
                  <JobCard key={job.id} job={job} user={user} />
                ))
              )}
            </div>
          } />

          <Route path="applications" element={
            <div>
              <div className="flex flex-between flex-center mb-24">
                <div>
                  <h2 className="page-title" style={{ marginBottom: '4px' }}>我的投递</h2>
                  <p className="text-secondary">追踪您的申请进度，查看面试安排</p>
                </div>
                <Link to="/jobs" className="btn btn-primary btn-sm">投递更多岗位</Link>
              </div>
              
              {applications.length === 0 ? (
                <div className="card text-center">
                  <p className="text-secondary mb-16">暂无投递记录</p>
                  <Link to="/jobs" className="btn btn-primary">去找工作</Link>
                </div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="card" style={{ marginBottom: '16px' }}>
                    <div className="flex flex-between flex-center">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{app.title}</div>
                        <div className="text-secondary mb-8">{app.company_name}</div>
                        <div className="text-secondary text-sm">{app.location} · ¥{app.salary_min}-{app.salary_max}/月</div>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '150px' }}>
                        {getStatusBadge(app.status)}
                        {app.match_score && <div className="text-sm mt-8">匹配度：{app.match_score}%</div>}
                        <div className="text-xs text-secondary mt-8">投递：{app.applied_at.split('T')[0]}</div>
                      </div>
                    </div>
                    <div className="flex gap-8 mt-16">
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (selectedApplication?.id === app.id) {
                            setSelectedApplication(null);
                            setOnboardingSteps([]);
                          } else {
                            setSelectedApplication(app);
                            fetchOnboardingSteps(app.id);
                          }
                        }}
                      >
                        {selectedApplication?.id === app.id ? '收起进度' : '📊 查看入职进度'}
                      </button>
                      <Link 
                        to={`/jobs/${app.job_id}`}
                        className="btn btn-outline btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        查看岗位
                      </Link>
                      <Link 
                        to={`/messages/${app.employer_id}`}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        💬 沟通
                      </Link>
                    </div>
                    {selectedApplication?.id === app.id && renderOnboardingTimeline(app)}
                  </div>
                ))
              )}
            </div>
          } />

          <Route path="credit" element={
            <div>
              <h2 className="page-title" style={{ marginBottom: '4px' }}>蓝领信用档案</h2>
              <p className="text-secondary mb-24">您的出勤记录、离职原因、技能认证等信用信息</p>
              
              {profile && (
                <div className="card mb-24" style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', border: 'none' }}>
                  <div className="grid grid-3">
                    <div className="text-center">
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#389e0d' }}>
                        {profile.credit_score || 100}
                      </div>
                      <div className="text-secondary">信用评分</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1890ff' }}>
                        {profile.attendance_rate || 100}%
                      </div>
                      <div className="text-secondary">历史出勤率</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#722ed1' }}>
                        {profile.skills?.length || 0}
                      </div>
                      <div className="text-secondary">已认证技能</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>信用记录</h3>
                {creditRecords.length === 0 ? (
                  <p className="text-secondary">暂无信用记录</p>
                ) : (
                  <div>
                    {creditRecords.map(record => (
                      <div key={record.id} style={{ 
                        padding: '16px 0', 
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                            {record.type === 'attendance' ? '📅 出勤记录' : 
                             record.type === 'skill' ? '🎓 技能认证' :
                             record.type === 'resign' ? '📝 离职记录' :
                             record.type === 'award' ? '🏆 奖励记录' :
                             record.type === 'penalty' ? '⚠️ 处罚记录' : '📌 其他记录'}
                          </div>
                          <div className="text-sm text-secondary">{record.reason}</div>
                          <div className="text-xs text-secondary mt-4">{record.created_at}</div>
                        </div>
                        <div style={{ 
                          fontWeight: 'bold',
                          color: record.score_change > 0 ? '#52c41a' : record.score_change < 0 ? '#ff4d4f' : '#8c8c8c'
                        }}>
                          {record.score_change > 0 ? '+' : ''}{record.score_change} 分
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          } />

          <Route path="*" element={<Navigate to="profile" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default JobseekerDashboard;
