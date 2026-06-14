import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../i18n';

export default function CompanyCenter() {
  const { user, t, language } = useApp();
  const { t: translate } = useTranslation(language);
  const isEnglish = language === 'en';
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const texts = {
    title: isEnglish ? 'Company Center' : '企业中心',
    welcome: isEnglish ? `Welcome back, ${user?.name}! Manage your jobs and recruitment` : `欢迎回来，${user?.name}！管理您的职位和招聘信息`,
    postNewJob: isEnglish ? '+ Post New Job' : '+ 发布新职位',
    jobManagement: isEnglish ? 'Job Management' : '职位管理',
    applications: isEnglish ? 'Applications' : '申请管理',
    contractTemplates: isEnglish ? 'Contract Templates' : '合同模板',
    policyMatch: isEnglish ? 'Policy Matching Engine' : '政策匹配引擎',
    companySettings: isEnglish ? 'Company Settings' : '企业设置',
    totalJobs: isEnglish ? 'Total Jobs' : '总职位数',
    approved: isEnglish ? 'Approved' : '已审核通过',
    ftzSubsidies: isEnglish ? 'FTZ Subsidies' : '享受自贸港补贴',
    pendingReview: isEnglish ? 'Pending Review' : '待审核',
    ftzSubsidyTag: isEnglish ? 'FTZ Subsidy' : '自贸港补贴',
    created: isEnglish ? 'Created' : '创建时间',
    view: isEnglish ? 'View' : '查看',
    edit: isEnglish ? 'Edit' : '编辑',
    unpublish: isEnglish ? 'Unpublish' : '下架',
    publish: isEnglish ? 'Publish' : '上架',
    noJobs: isEnglish ? 'No jobs posted yet' : '暂无发布的职位',
    noJobsDesc: isEnglish ? 'Post your first job now!' : '立即发布您的第一个职位吧！',
    postJob: isEnglish ? 'Post Job' : '发布职位',
    contractTemplatesTitle: isEnglish ? 'Contract Templates' : '合同模板库',
    contractTemplatesDesc: isEnglish ? 'Built-in foreign-related labor contract templates, bilingual generation supported' : '系统内置涉外劳动合同模板，支持双语生成',
    viewTemplates: isEnglish ? 'View Templates' : '查看合同模板',
    companySettingsTitle: isEnglish ? 'Company Settings' : '企业设置',
    settingsInDev: isEnglish ? 'Company settings feature in development...' : '企业信息设置功能开发中...',
    published: isEnglish ? 'Published' : '已发布',
    policyMatchTitle: isEnglish ? 'Policy Matching Engine' : '政策匹配引擎',
    policyMatchDesc: isEnglish ? 'Auto-match Hainan FTZ encouraged industry catalog and talent subsidy policies to help enterprises maximize policy benefits' : '自动匹配海南自贸港鼓励类产业目录和人才补贴政策，帮助企业享受最大政策红利',
    matchedPolicies: isEnglish ? 'Matched Policies' : '已匹配政策',
    applicableSubsidies: isEnglish ? 'Applicable Subsidies' : '可申请补贴',
    estimatedAnnualRelief: isEnglish ? 'Estimated Annual Relief' : '预计年减免',
    runMatching: isEnglish ? '🔍 Run Matching Now' : '🔍 立即匹配',
    viewAllPolicies: isEnglish ? '📋 View All Policies' : '📋 查看全部政策',
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const response = await api.get('/jobs/company/my');
      setJobs(response.data);
    } catch (error) {
      console.error('获取职位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="loading"></div>
      </div>
    );
  }

  const getStatusBadge = (job) => {
    if (!job.is_active && job.is_approved) {
      return <span className="badge badge-success">{isEnglish ? 'Published' : '已发布'}</span>;
    } else if (!job.is_approved) {
      return <span className="badge badge-warning">{texts.pendingReview}</span>;
    } else {
      return <span className="badge badge-danger">{texts.unpublish}</span>;
    }
  };

  const menuItems = [
    { key: 'jobs', label: { cn: '职位管理', en: 'Job Management' }, icon: '💼' },
    { key: 'applications', label: { cn: '申请管理', en: 'Applications' }, icon: '📋' },
    { key: 'templates', label: { cn: '合同模板', en: 'Contract Templates' }, icon: '📄' },
    { key: 'policy-match', label: { cn: '政策匹配引擎', en: 'Policy Matching Engine' }, icon: '🔍' },
    { key: 'settings', label: { cn: '企业设置', en: 'Company Settings' }, icon: '⚙️' },
  ];

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>{texts.title}</h1>
          <p className="text-secondary">{texts.welcome}</p>
        </div>
        <Link to="/company/post-job" className="btn btn-primary">
          {texts.postNewJob}
        </Link>
      </div>

      <div className="grid grid-4">
        <div style={{ gridColumn: 'span 1' }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{
              background: 'linear-gradient(135deg, #2e7d32, #1b5e20',
              color: 'white',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '12px',
              }}>
                🏢
              </div>
              <h3 style={{ marginBottom: '4px' }}>{user?.name}</h3>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>{user?.email}</p>
            </div>
            <div style={{ padding: '16px' }}>
              {menuItems.map(item => (
                <div
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    background: activeTab === item.key ? '#e8f5e9' : 'transparent',
                    color: activeTab === item.key ? '#2e7d32' : '#424242',
                    fontWeight: activeTab === item.key ? '600' : '400',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{item.icon}</span>
                  {isEnglish ? item.label.en : item.label.cn}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          {activeTab === 'jobs' && (
            <div className="card">
              <h2 style={{ marginBottom: '24px' }}>{texts.jobManagement}</h2>
              
              <div className="grid grid-4 mb-lg">
                <div className="card" style={{ background: '#f0fdf4' }}>
                  <div className="text-2xl font-bold text-primary">{jobs.length}</div>
                  <div className="text-sm text-secondary">{texts.totalJobs}</div>
                </div>
                <div className="card" style={{ background: '#fff8e1' }}>
                  <div className="text-2xl font-bold text-warning">
                    {jobs.filter(j => j.is_approved).length}
                  </div>
                  <div className="text-sm text-secondary">{texts.approved}</div>
                </div>
                <div className="card" style={{ background: '#e3f2fd' }}>
                  <div className="text-2xl font-bold text-info">
                    {jobs.filter(j => j.has_ftz_subsidy).length}
                  </div>
                  <div className="text-sm text-secondary">{texts.ftzSubsidies}</div>
                </div>
                <div className="card" style={{ background: '#fce4ec' }}>
                  <div className="text-2xl font-bold text-danger">
                    {jobs.filter(j => !j.is_approved).length}
                  </div>
                  <div className="text-sm text-secondary">{texts.pendingReview}</div>
                </div>
              </div>

              {jobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {jobs.map(job => (
                    <div key={job.id} className="card" style={{ padding: '20px', margin: 0 }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <Link to={'/jobs/' + job.id} style={{ fontSize: '18px', fontWeight: '600', color: '#212121' }}>
                            {job.title_cn}
                          </Link>
                          {job.title_en && (
                            <div className="text-xs text-secondary">{job.title_en}</div>
                          )}
                          <div className="text-sm text-secondary mt-sm">
                            {job.category_name} · {job.salary_min/10000}万-{job.salary_max/10000}万/月 · {job.location || (isEnglish ? 'Hainan' : '海南')}
                          </div>
                        </div>
                        <div className="flex items-center gap-sm">
                          {getStatusBadge(job)}
                          {job.has_ftz_subsidy && (
                            <span className="subsidy-tag">{texts.ftzSubsidyTag}</span>
                          )}
                        </div>
                      </div>
                      <div className="divider"></div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-secondary">
                          {texts.created}：{job.created_at}</div>
                        <div className="flex gap-sm">
                          <Link to={'/jobs/' + job.id} className="btn btn-secondary btn-sm">{texts.view}</Link>
                          <button className="btn btn-secondary btn-sm">{texts.edit}</button>
                          <button className="btn btn-danger btn-sm">
                            {job.is_active ? texts.unpublish : texts.publish}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>💼</div>
                  <h3>{texts.noJobs}</h3>
                  <p className="text-secondary">{texts.noJobsDesc}</p>
                  <Link to="/company/post-job" className="btn btn-primary mt-md">{texts.postJob}</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'policy-match' && (
            <div className="card">
              <h2 style={{ marginBottom: '16px' }}>{texts.policyMatchTitle}</h2>
              <p className="text-secondary mb-lg">{texts.policyMatchDesc}</p>

              <div className="grid grid-3 mb-lg">
                <div className="card" style={{ background: '#f0fdf4' }}>
                  <div className="text-2xl font-bold text-primary">12</div>
                  <div className="text-sm text-secondary">{texts.matchedPolicies}</div>
                </div>
                <div className="card" style={{ background: '#fff8e1' }}>
                  <div className="text-2xl font-bold text-warning">8</div>
                  <div className="text-sm text-secondary">{texts.applicableSubsidies}</div>
                </div>
                <div className="card" style={{ background: '#e3f2fd' }}>
                  <div className="text-2xl font-bold text-info">¥500万</div>
                  <div className="text-sm text-secondary">{texts.estimatedAnnualRelief}</div>
                </div>
              </div>

              <div className="flex gap-md">
                <button className="btn btn-primary">{texts.runMatching}</button>
                <Link to="/policies" className="btn btn-secondary">{texts.viewAllPolicies}</Link>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="card">
              <h2 style={{ marginBottom: '24px' }}>{texts.contractTemplatesTitle}</h2>
              <p className="text-secondary mb-lg">
                {texts.contractTemplatesDesc}</p>
              <Link to="/contracts" className="btn btn-primary">{texts.viewTemplates}</Link>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card">
              <h2 style={{ marginBottom: '24px' }}>{texts.companySettingsTitle}</h2>
              <p className="text-secondary">{texts.settingsInDev}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
