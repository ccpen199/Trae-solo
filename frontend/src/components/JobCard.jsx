import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function JobCard({ job, user, showActions = true, compact = false }) {
  const navigate = useNavigate();
  const [showMatchDetail, setShowMatchDetail] = useState(false);
  const [applying, setApplying] = useState(false);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <span style={{ color: '#faad14' }}>
        {'★'.repeat(fullStars)}
        {hasHalf && '☆'}
        {'☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0))}
      </span>
    );
  };

  const handleQuickApply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${job.id}`, requiredRole: 'jobseeker' } });
      return;
    }
    if (user.role !== 'jobseeker') {
      if (confirm('需要使用求职者账号才能投递，是否切换身份登录？')) {
        navigate('/login', { state: { from: `/jobs/${job.id}`, requiredRole: 'jobseeker' } });
      }
      return;
    }
    if (!job.employer_verified && job.risk_level === 'high') {
      if (!confirm('⚠️ 该企业尚未通过资质认证，投递存在风险。确定继续投递？')) {
        return;
      }
    }
    setApplying(true);
    try {
      await api.post('/applications', { jobId: job.id });
      alert('✅ 投递成功！HR会在24小时内与您联系\n\n可在「我的投递」中查看面试→录用→签约→到岗全流程进度');
    } catch (error) {
      alert(error.response?.data?.error || '投递失败，请重试');
    } finally {
      setApplying(false);
    }
  };

  const handleStartChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: `/messages/${job.employer_id}`, requiredRole: 'jobseeker' } });
      return;
    }
    if (user.role !== 'jobseeker') {
      navigate('/login', { state: { from: `/messages/${job.employer_id}`, requiredRole: 'jobseeker' } });
      return;
    }
    navigate(`/messages/${job.employer_id}`);
  };

  const handleViewProgress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: '/jobseeker/applications', requiredRole: 'jobseeker' } });
      return;
    }
    if (user.role !== 'jobseeker') {
      navigate('/login', { state: { from: '/jobseeker/applications', requiredRole: 'jobseeker' } });
      return;
    }
    navigate('/jobseeker/applications');
  };

  const renderBenefits = () => {
    const benefits = [];
    if (job.has_food) benefits.push('包吃');
    if (job.has_lodging) benefits.push('包住');
    if (job.has_insurance) benefits.push('五险');
    if (job.has_fund) benefits.push('公积金');
    return benefits;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '随时到岗';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return '可立即到岗';
    if (diffDays <= 7) return `${diffDays}天内到岗`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}周内到岗`;
    return `${dateStr} 可到岗`;
  };

  const getMatchColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getMatchLevel = (score) => {
    if (score >= 80) return '高匹配';
    if (score >= 60) return '中匹配';
    return '低匹配';
  };

  return (
    <Link
      to={`/jobs/${job.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="card job-card" style={{ position: 'relative' }}>
        {job.matchScore !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMatchDetail(!showMatchDetail);
            }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${getMatchColor(job.matchScore)} 0%, ${getMatchColor(job.matchScore)}dd 100%)`,
              color: 'white',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              匹配度 {job.matchScore}%
              <span style={{ fontSize: '10px', opacity: 0.8 }}>{showMatchDetail ? '▲' : '▼'}</span>
            </div>
          </div>
        )}

        {showMatchDetail && job.matchBreakdown && (
          <div
            style={{
              position: 'absolute',
              top: '52px',
              right: '16px',
              zIndex: 11,
              background: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '280px',
              fontSize: '13px'
            }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div style={{ fontWeight: '600', marginBottom: '8px', color: '#262626' }}>
              匹配度分解 · {getMatchLevel(job.matchScore)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: '技能匹配', value: job.skillMatch, weight: '35%' },
                { label: '薪资匹配', value: job.salaryMatch, weight: '25%' },
                { label: '地点匹配', value: job.locationMatch, weight: '20%' },
                { label: '企业评分', value: job.companyMatch, weight: '15%' },
                { label: '到岗时间', value: job.availableDateMatch, weight: '5%' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '70px', color: '#595959' }}>{item.label}</span>
                  <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${item.value}%`,
                      height: '100%',
                      background: getMatchColor(item.value),
                      borderRadius: '4px',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ width: '40px', textAlign: 'right', fontWeight: '500', color: getMatchColor(item.value) }}>
                    {item.value}%
                  </span>
                  <span style={{ width: '32px', textAlign: 'right', color: '#8c8c8c', fontSize: '11px' }}>
                    ×{item.weight}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0', color: '#8c8c8c', fontSize: '12px' }}>
              {job.matchBreakdown}
            </div>
          </div>
        )}

        <div className="flex flex-between">
          <div style={{ flex: 1, paddingRight: '20px' }}>
            <div className="flex flex-center gap-8 mb-8">
              <div className="job-title">{job.title}</div>
              {job.is_urgent && <span className="badge badge-error" style={{ fontSize: '12px' }}>急聘</span>}
            </div>

            <div className="flex flex-center gap-12 mb-8">
              <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>{job.company_name}</span>
              {job.employer_verified ? (
                <span className="badge badge-success" style={{ fontSize: '12px' }}>✓ 已认证</span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '12px' }}>⚠ 未认证</span>
              )}
              {job.company_rating && (
                <span className="text-sm">
                  {renderStars(job.company_rating)}
                  <span className="text-secondary" style={{ marginLeft: '4px' }}>{job.company_rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            {!job.employer_verified && (
              <div style={{
                background: '#fff7e6',
                border: '1px solid #ffd666',
                borderRadius: '6px',
                padding: '6px 12px',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#d48806',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⚠️ 该企业尚未通过平台资质认证，投递前请确认企业真实性。认证企业更安全可靠。
              </div>
            )}

            <div className="text-secondary mb-12 text-sm">
              <span>📍 {job.location}</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span>{job.work_type || '全职'}</span>
              {job.available_date && (
                <>
                  <span style={{ margin: '0 8px' }}>·</span>
                  <span style={{ color: '#52c41a' }}>{formatDate(job.available_date)}</span>
                </>
              )}
              {job.hr_response_time && (
                <>
                  <span style={{ margin: '0 8px' }}>·</span>
                  <span style={{ color: '#1890ff' }}>HR {job.hr_response_time}内响应</span>
                </>
              )}
            </div>

            {!compact && job.skills && job.skills.length > 0 && (
              <div className="mb-12">
                {job.skills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="tag tag-outline" style={{ marginRight: '6px', marginBottom: '6px' }}>
                    {skill}
                  </span>
                ))}
                {job.skills.length > 5 && (
                  <span className="text-secondary text-sm">等{job.skills.length}项技能</span>
                )}
              </div>
            )}

            <div className="mb-12">
              {renderBenefits().map((b, i) => (
                <span key={i} className="tag tag-primary" style={{ marginRight: '6px', marginBottom: '6px' }}>{b}</span>
              ))}
            </div>

            <div className="mt-12" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="text-secondary" style={{ fontSize: '12px' }}>硬性条件</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-color)', overflowWrap: 'anywhere' }}>
                    {job.hard_requirements || job.requirements || '详见岗位要求'}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="text-secondary" style={{ fontSize: '12px' }}>通勤半径</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-color)' }}>
                    {job.commute_estimate || '根据定位计算'}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="text-secondary" style={{ fontSize: '12px' }}>企业核验</div>
                  <div style={{ fontSize: '13px', color: job.employer_verified ? '#52c41a' : '#d48806' }}>
                    {job.employer_audit_status || (job.employer_verified ? '企业资质已认证' : '企业资质待复核')}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="text-secondary" style={{ fontSize: '12px' }}>HR响应</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-color)' }}>
                    {job.hr_response_sla || job.hr_response_time || '24小时内响应'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(job.onboarding_flow || ['投递简历', '在线沟通', '面试确认', '签约到岗']).map((step) => (
                  <span key={step} className="tag tag-primary">{step}</span>
                ))}
                <span className="tag tag-outline" style={{ color: job.risk_level === 'high' ? '#d48806' : '#52c41a' }}>
                  {job.risk_review || '风控可追踪'}
                </span>
                <span className="tag tag-outline">
                  📊 {job.recruiting_effect || '招聘效果可复盘'}
                </span>
                {job.exposure_rate > 0 && (
                  <span className="tag tag-outline">
                    转化率 {job.exposure_rate}%
                  </span>
                )}
              </div>
            </div>

            {showActions && (
              <div className="flex gap-8 mt-16">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleQuickApply}
                  disabled={applying}
                >
                  {applying ? '投递中...' : (job.employer_verified ? '立即投递' : '⚠ 投递(未认证)')}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleStartChat}
                >
                  💬 在线沟通
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleViewProgress}
                >
                  📊 简历/进度
                </button>
              </div>
            )}

            {job.match_fallback && (
              <div className="text-warning text-sm mt-12" style={{ fontSize: '12px' }}>
                ⚠️ {job.match_reason}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', minWidth: '140px' }}>
            <div className="salary">¥{job.salary_min}-{job.salary_max}</div>
            <div className="text-secondary text-sm">/月</div>
            {job.view_count !== undefined && (
              <div className="text-secondary text-sm mt-8">
                👁 {job.view_count}次浏览 · 📩 {job.apply_count || 0}次投递
              </div>
            )}
            {job.exposure_rate > 0 && (
              <div className="text-sm mt-4" style={{ color: '#52c41a' }}>
                转化率 {job.exposure_rate}%
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default JobCard;
