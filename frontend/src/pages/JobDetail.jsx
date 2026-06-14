import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../contexts/AppContext';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isJobseeker, t, language } = useApp();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [activeLang, setActiveLang] = useState(language);
  const [applySuccess, setApplySuccess] = useState(false);
  const isEnglish = language === 'en';

  useEffect(() => {
    setActiveLang(language);
  }, [language]);

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (error) {
      console.error(isEnglish ? 'Failed to fetch job details:' : '获取职位详情失败:', error);
      if (error.response?.status === 404) {
        navigate('/jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isJobseeker) {
      navigate('/login');
      return;
    }

    setApplying(true);
    try {
      await api.post(`/jobs/${id}/apply`, { cover_letter: coverLetter });
      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
        setCoverLetter('');
      }, 2000);
    } catch (error) {
      alert(error.response?.data?.error || (isEnglish ? 'Application failed, please try again' : '申请失败，请重试'));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="loading"></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #00695c, #00897b)',
        color: 'white',
        padding: '40px 0',
      }}>
        <div className="container">
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            {t('jobDetail.backToList')}
          </button>
          <div className="flex justify-between items-start" style={{ gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '8px' }}>{activeLang === 'cn' ? '职位详情' : 'Job Details'}</div>
              <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>
                {activeLang === 'cn' ? job.title_cn : (job.title_en || job.title_cn)}
              </h1>
              {job.title_en && activeLang === 'cn' && (
                <div style={{ opacity: 0.8, marginBottom: '16px' }}>{job.title_en}</div>
              )}
              <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
                <span style={{ fontSize: '28px', fontWeight: '700', color: '#ffd54f' }}>
                  {job.salary_min && job.salary_max
                    ? (job.salary_min / 10000) + (isEnglish ? 'k-' : '万-') + (job.salary_max / 10000) + (isEnglish ? 'k/month' : '万/月')
                    : t('jobDetail.negotiable')}
                </span>
                <span style={{ opacity: 0.9 }}>📍 {job.location || (isEnglish ? 'Hainan' : '海南')}</span>
                <span style={{ opacity: 0.9 }}>💼 {job.employment_type || (isEnglish ? 'Full-time' : '全职')}</span>
              </div>
              <div className="flex gap-sm mt-md" style={{ flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>
                  {job.category_name || job.category}
                </span>
                {job.has_ftz_subsidy && (
                  <span className="subsidy-tag" style={{ background: '#ff9800', color: 'white' }}>
                    {t('jobDetail.ftzSubsidy')}
                  </span>
                )}
                {job.is_encouraged_industry && (
                  <span className="badge badge-success" style={{ background: 'rgba(76,175,80,0.25)', color: '#c8e6c9' }}>
                    {t('jobDetail.encouragedIndustry')}
                  </span>
                )}
              </div>
            </div>
            <div>
              {isJobseeker ? (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="btn"
                  style={{
                    background: 'white',
                    color: '#00695c',
                    padding: '14px 40px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {t('jobDetail.applyNow')}
                </button>
              ) : user ? (
                <button className="btn" style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  padding: '14px 40px',
                  fontSize: '16px',
                }} disabled>
                  {t('jobDetail.applyWithJobseeker')}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="btn"
                  style={{
                    background: 'white',
                    color: '#00695c',
                    padding: '14px 40px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {t('jobDetail.loginToApply')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="grid grid-3" style={{ alignItems: 'flex-start' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card">
              <div className="bilingual-tabs">
                <div
                  className={`bilingual-tab ${activeLang === 'cn' ? 'active' : ''}`}
                  onClick={() => setActiveLang('cn')}
                >
                  {t('jobDetail.chinese')}
                </div>
                <div
                  className={`bilingual-tab ${activeLang === 'en' ? 'active' : ''}`}
                  onClick={() => setActiveLang('en')}
                >
                  {t('jobDetail.english')}
                </div>
              </div>

              <h3 style={{ marginBottom: '16px' }}>{t('jobDetail.jobDescription')}</h3>
              <p style={{ whiteSpace: 'pre-line', lineHeight: '2', color: '#424242' }}>
                {activeLang === 'cn' ? job.description_cn : (job.description_en || job.description_cn)}
              </p>

              <div className="divider"></div>

              <h3 style={{ marginBottom: '16px', marginTop: '24px' }}>{t('jobDetail.jobRequirements')}</h3>
              <p style={{ whiteSpace: 'pre-line', lineHeight: '2', color: '#424242' }}>
                {activeLang === 'cn' 
                  ? (job.requirements_cn || t('common.noData')) 
                  : (job.requirements_en || job.requirements_cn || t('common.noData'))}
              </p>

              <div className="divider"></div>

              <div style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>{t('jobDetail.tags')}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {job.tags && job.tags.map((tag, i) => (
                    <span key={i} className="tag tag-primary">{tag}</span>
                  ))}
                </div>
              </div>

              {job.rcep_skills && job.rcep_skills.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px' }}>{t('jobDetail.rcepSkills')}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {job.rcep_skills.map((skill, i) => (
                      <span key={i} className="tag tag-accent">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {job.has_ftz_subsidy && (
              <div className="card" style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#e65100' }}>
                  {t('jobDetail.ftzBenefits')}
                </h3>

                {job.subsidy_policy_ref && (
                  <div className="alert-info" style={{ marginBottom: '16px' }}>
                    <strong>{t('jobDetail.policyBasis')}：</strong>
                    {job.subsidy_policy_ref.split(',').map((ref, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && '、'}
                        <Link 
                          to={'/policies?policyNumber=' + ref.trim()} 
                          style={{ color: '#0288d1', textDecoration: 'underline', fontWeight: 600 }}
                        >
                          {ref.trim()}
                        </Link>
                      </React.Fragment>
                    ))}
                    <Link 
                      to="/policies" 
                      style={{ 
                        marginLeft: '12px', 
                        fontSize: '13px', 
                        color: '#00897b',
                        textDecoration: 'none'
                      }}
                    >
                      {t('jobDetail.viewAllPolicies')}
                    </Link>
                  </div>
                )}

                {job.policy_basis && (
                  <div style={{ 
                    marginBottom: '16px', 
                    whiteSpace: 'pre-line', 
                    color: '#5d4037',
                    padding: '16px',
                    background: '#fff8e1',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ff9800'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#e65100' }}>
                      📋 {t('jobDetail.subsidyEligibility')}
                    </div>
                    {job.policy_basis}
                  </div>
                )}

                {job.applicable_policies && job.applicable_policies.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '12px' }}>{t('jobDetail.applicablePolicies')}</h4>
                    {job.applicable_policies.map((policy, index) => (
                      <div key={index} className="policy-box" style={{ cursor: 'pointer' }}>
                        <Link 
                          to={'/policies?policyNumber=' + (policy.policy_number || '')} 
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <div className="policy-number" style={{ color: '#0288d1', fontWeight: 600 }}>
                            {policy.policy_number} {isEnglish ? '→' : '→'}
                          </div>
                          <div className="policy-title">{activeLang === 'cn' ? policy.title_cn : (policy.title_en || policy.title_cn)}</div>
                          <div className="policy-content">{activeLang === 'cn' ? policy.content_cn : (policy.content_en || policy.content_cn)}</div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>{t('jobDetail.companyInfo')}</h3>
              <h4 style={{ marginBottom: '8px' }}>{job.company_name}</h4>
              {job.is_encouraged_industry && (
                <span className="badge badge-success" style={{ marginBottom: '12px', display: 'inline-block' }}>
                  {t('jobDetail.encouragedIndustryTag')}
                </span>
              )}
              <p className="text-sm text-secondary" style={{ lineHeight: '1.8', marginTop: '12px' }}>
                {job.company_description || t('common.noData')}
              </p>
            </div>

            {job.recording && (
              <div className="card" style={{ marginTop: '16px' }}>
                <h4 style={{ marginBottom: '12px' }}>{t('jobDetail.recordingInfo')}</h4>
                <div className="text-sm">
                  <div style={{ marginBottom: '8px' }}>
                    <span className="text-secondary">{t('jobDetail.recordingStatus')}：</span>
                    <span className={`badge ${job.recording.recording_status === 'recorded' ? 'badge-success' : 'badge-warning'}`}>
                      {job.recording.recording_status === 'recorded' ? t('jobDetail.recorded') : t('jobDetail.pendingRecording')}
                    </span>
                  </div>
                  {job.recording.recorded_at && (
                    <div className="text-secondary">
                      {t('jobDetail.recordingTime')}：{job.recording.recorded_at}
                    </div>
                  )}
                  {job.recording.bureau_response && (
                    <div className="text-secondary mt-sm" style={{ marginTop: '8px' }}>
                      {job.recording.bureau_response}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card" style={{ marginTop: '16px' }}>
              <h4 style={{ marginBottom: '12px' }}>{t('jobDetail.tips')}</h4>
              <ul className="text-sm text-secondary" style={{ paddingLeft: '20px', lineHeight: '2' }}>
                <li>{t('jobDetail.tip1')}</li>
                <li>{t('jobDetail.tip2')}</li>
                <li>{t('jobDetail.tip3')}</li>
                <li>{t('jobDetail.tip4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {applySuccess ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3>{t('jobDetail.applySuccess')}</h3>
                <p className="text-secondary">{t('jobDetail.applySuccessDesc')}</p>
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: '20px' }}>{t('jobDetail.applyModalTitle')}：{activeLang === 'cn' ? job.title_cn : (job.title_en || job.title_cn)}</h3>
                <form onSubmit={handleApply}>
                  <div className="form-group">
                    <label className="form-label">{t('jobDetail.coverLetter')}</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder={t('jobDetail.coverLetterPlaceholder')}
                      className="form-textarea"
                      rows={5}
                    />
                  </div>
                  <div className="flex justify-end gap-sm">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="btn btn-secondary"
                    >
                      {t('common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={applying}>
                      {applying ? t('jobDetail.applying') : t('jobDetail.confirmApply')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
