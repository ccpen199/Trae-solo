import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function EmployerDashboard({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    salaryMin: '',
    salaryMax: '',
    location: '',
    workType: '',
    requirements: '',
    benefits: '',
    hasFood: false,
    hasLodging: false,
    hasInsurance: false,
    hasFund: false,
    skills: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'employer') {
      setActiveTab(path);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    } else if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs/employer/my');
      setJobs(res.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
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

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/jobs', jobForm);
      setShowJobForm(false);
      setJobForm({
        title: '',
        description: '',
        salaryMin: '',
        salaryMax: '',
        location: '',
        workType: '',
        requirements: '',
        benefits: '',
        hasFood: false,
        hasLodging: false,
        hasInsurance: false,
        hasFund: false,
        skills: []
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('发布岗位失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      fetchApplications();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !jobForm.skills.includes(skillInput.trim())) {
      setJobForm({ ...jobForm, skills: [...jobForm.skills, skillInput.trim()] });
      setSkillInput('');
    }
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

  const menuItems = [
    { key: 'jobs', label: '岗位管理', path: '/employer/jobs' },
    { key: 'applications', label: '求职申请', path: '/employer/applications' }
  ];

  return (
    <div className="main-layout">
      <div className="sidebar">
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
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <Routes>
            <Route path="jobs" element={
              <div>
                <div className="flex flex-between flex-center mb-24">
                  <h2 className="page-title" style={{ marginBottom: 0 }}>岗位管理</h2>
                  <button className="btn btn-primary" onClick={() => setShowJobForm(true)}>发布新岗位</button>
                </div>

                {showJobForm && (
                  <div className="modal-overlay" onClick={() => setShowJobForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <span>发布新岗位</span>
                        <button className="close-btn" onClick={() => setShowJobForm(false)}>×</button>
                      </div>
                      <form onSubmit={handleSubmitJob}>
                        <div className="form-group">
                          <label className="form-label">岗位名称 *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={jobForm.title}
                            onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">薪资下限（元/月） *</label>
                            <input
                              type="number"
                              className="form-input"
                              value={jobForm.salaryMin}
                              onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">薪资上限（元/月） *</label>
                            <input
                              type="number"
                              className="form-input"
                              value={jobForm.salaryMax}
                              onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label className="form-label">工作地点</label>
                            <input
                              type="text"
                              className="form-input"
                              value={jobForm.location}
                              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">工作类型</label>
                            <select
                              className="form-select"
                              value={jobForm.workType}
                              onChange={(e) => setJobForm({ ...jobForm, workType: e.target.value })}
                            >
                              <option value="">请选择</option>
                              <option value="全职">全职</option>
                              <option value="兼职">兼职</option>
                              <option value="临时工">临时工</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">技能要求</label>
                          <div className="flex gap-8" style={{ marginBottom: '8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                              placeholder="输入技能后按回车添加"
                              style={{ flex: 1 }}
                            />
                            <button type="button" className="btn btn-outline" onClick={addSkill}>添加</button>
                          </div>
                          <div>
                            {jobForm.skills.map((skill, index) => (
                              <span key={index} className="tag tag-primary" style={{ cursor: 'pointer' }} onClick={() => setJobForm({ ...jobForm, skills: jobForm.skills.filter(s => s !== skill) })}>
                                {skill} ×
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">岗位描述</label>
                          <textarea
                            className="form-input"
                            style={{ minHeight: '100px' }}
                            value={jobForm.description}
                            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">福利待遇</label>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <label className="flex flex-center gap-8">
                              <input
                                type="checkbox"
                                checked={jobForm.hasFood}
                                onChange={(e) => setJobForm({ ...jobForm, hasFood: e.target.checked })}
                              />
                              包吃
                            </label>
                            <label className="flex flex-center gap-8">
                              <input
                                type="checkbox"
                                checked={jobForm.hasLodging}
                                onChange={(e) => setJobForm({ ...jobForm, hasLodging: e.target.checked })}
                              />
                              包住
                            </label>
                            <label className="flex flex-center gap-8">
                              <input
                                type="checkbox"
                                checked={jobForm.hasInsurance}
                                onChange={(e) => setJobForm({ ...jobForm, hasInsurance: e.target.checked })}
                              />
                              五险
                            </label>
                            <label className="flex flex-center gap-8">
                              <input
                                type="checkbox"
                                checked={jobForm.hasFund}
                                onChange={(e) => setJobForm({ ...jobForm, hasFund: e.target.checked })}
                              />
                              公积金
                            </label>
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                          {submitting ? '发布中...' : '发布岗位'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {jobs.length === 0 ? (
                  <div className="card text-center">
                    <p className="text-secondary">暂无岗位，点击发布新岗位</p>
                  </div>
                ) : (
                  jobs.map(job => (
                    <div key={job.id} className="card">
                      <div className="flex flex-between flex-center">
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{job.title}</div>
                          <div className="salary">¥{job.salary_min}-{job.salary_max}/月</div>
                          <div className="text-secondary text-sm mt-8">{job.location} · 浏览：{job.view_count} · 投递：{job.apply_count}</div>
                        </div>
                        <div className="flex gap-8">
                          <span className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                            {job.status === 'active' ? '招聘中' : '已关闭'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            } />

            <Route path="applications" element={
              <div>
                <h2 className="page-title">求职申请</h2>
                {applications.length === 0 ? (
                  <div className="card text-center">
                    <p className="text-secondary">暂无申请记录</p>
                  </div>
                ) : (
                  applications.map(app => (
                    <div key={app.id} className="card">
                      <div className="flex flex-between flex-start">
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{app.jobseeker_name}</div>
                          <div className="text-secondary">申请岗位：{app.title}</div>
                          <div className="text-secondary text-sm">联系方式：{app.phone}</div>
                          {app.match_score && <div className="text-sm mt-8">匹配度：{app.match_score}%</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="mb-8">{getStatusBadge(app.status)}</div>
                          <div className="flex gap-8">
                            {app.status === 'pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(app.id, 'interview')}>邀请面试</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(app.id, 'rejected')}>拒绝</button>
                              </>
                            )}
                            {app.status === 'interview' && (
                              <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(app.id, 'accepted')}>录用</button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-secondary text-sm mt-16">申请时间：{app.applied_at}</div>
                    </div>
                  ))
                )}
              </div>
            } />

            <Route path="*" element={
              <Navigate to="jobs" />
            } />
          </Routes>
        )}
      </div>
    </div>
  );
}

function Navigate({ to }) {
  React.useEffect(() => {
    window.location.hash = to;
  }, [to]);
  return null;
}

export default EmployerDashboard;
