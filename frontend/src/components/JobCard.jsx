import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const MOCK_POLICIES = {
  '财税〔2020〕32号': { title: '海南自贸港高端紧缺人才个人所得税优惠政策', titleEn: 'Hainan FTP High-end Talent Individual Income Tax Policy' },
  '琼府〔2020〕41号': { title: '海南自贸港鼓励类产业企业所得税优惠政策', titleEn: 'Hainan FTP Encouraged Industry Corporate Income Tax Policy' },
  '财税〔2025〕10号': { title: '海南自贸港跨境服务贸易负面清单', titleEn: 'Hainan FTP Cross-border Services Trade Negative List' },
  '琼人社〔2024〕88号': { title: '海南自贸港住房补贴实施细则', titleEn: 'Hainan FTP Housing Subsidy Implementation Rules' },
  '琼公发〔2023〕56号': { title: '海南自贸港外籍人才签证便利措施', titleEn: 'Hainan FTP Foreign Talent Visa Facilitation Measures' },
  'RCEP-2022-HN01': { title: 'RCEP框架下海南跨境电商人才扶持政策', titleEn: 'RCEP Hainan Cross-border E-commerce Talent Support Policy' },
};

const FOREIGN_LANGUAGES = ['韩语', '日语', '泰语', '印尼语', '越南语', '马来西亚语', 'Korean', 'Japanese', 'Thai', 'Indonesian', 'Vietnamese', 'Malay'];

export default function JobCard({ job, onPolicyClick, onPolicyMatchClick }) {
  const { user, isJobseeker, language } = useApp();
  const isEnglish = language === 'en';
  const title = isEnglish ? (job.title_en || job.title_cn) : job.title_cn;
  const categoryName = isEnglish ? (job.category_name_en || job.category_name || job.category) : (job.category_name || job.category);
  const description = isEnglish ? (job.description_en || job.description_cn) : job.description_cn;
  
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showApplyToast, setShowApplyToast] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [matchBadges, setMatchBadges] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('ftz_preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setPreferences(prefs);
      calculateMatchBadges(prefs);
    }
  }, [job, isEnglish]);

  const calculateMatchBadges = (prefs) => {
    const badges = [];
    if (job.has_ftz_subsidy === true) {
      badges.push({ icon: '🎯', text: isEnglish ? 'Tax Benefit' : '税收优惠', type: 'tax' });
    }
    if (job.salary_min >= 20000) {
      badges.push({ icon: '🏠', text: isEnglish ? 'Housing Subsidy' : '住房补贴', type: 'housing' });
    }
    if (job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) {
      badges.push({ icon: '✈️', text: isEnglish ? 'Visa Assistance' : '签证协助', type: 'visa' });
    }
    if (prefs?.rcep_languages?.length > 0 && job.rcep_skills?.some(skill => prefs.rcep_languages.includes(skill))) {
      badges.push({ icon: '🌍', text: isEnglish ? 'Language Match' : '语言匹配', type: 'language' });
    }
    setMatchBadges(badges);
  };

  const getMatchedPolicies = () => {
    const policyRefs = job.subsidy_policy_ref ? job.subsidy_policy_ref.split(',').map(p => p.trim()) : [];
    return policyRefs.map(ref => ({
      number: ref,
      title: MOCK_POLICIES[ref]?.[isEnglish ? 'titleEn' : 'title'] || ref,
      eligible: checkEligibility(ref),
      reason: getEligibilityReason(ref),
    }));
  };

  const checkEligibility = (policyRef) => {
    if (!policyRef) return false;
    if (policyRef.includes('财税〔2020〕32号') && job.has_ftz_subsidy) return true;
    if (policyRef.includes('琼府〔2020〕41号') && job.is_encouraged_industry) return true;
    if (policyRef.includes('琼人社〔2024〕88号') && job.salary_min >= 20000) return true;
    if (policyRef.includes('琼公发〔2023〕56号') && job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) return true;
    if (policyRef.includes('RCEP-2022-HN01') && job.rcep_skills?.length > 0) return true;
    if (policyRef.includes('财税〔2025〕10号') && job.is_encouraged_industry) return true;
    return false;
  };

  const getEligibilityReason = (policyRef) => {
    if (policyRef.includes('财税〔2020〕32号')) {
      return job.has_ftz_subsidy 
        ? (isEnglish ? 'Job has FTZ subsidy eligibility' : '岗位具备自贸港补贴资格')
        : (isEnglish ? 'FTZ subsidy not available for this position' : '该岗位不享受自贸港补贴');
    }
    if (policyRef.includes('琼府〔2020〕41号')) {
      return job.is_encouraged_industry
        ? (isEnglish ? 'Company is in encouraged industry catalog' : '企业属于鼓励类产业目录')
        : (isEnglish ? 'Company not in encouraged industry' : '企业不属于鼓励类产业');
    }
    if (policyRef.includes('琼人社〔2024〕88号')) {
      return job.salary_min >= 20000
        ? (isEnglish ? 'Salary meets minimum threshold for housing subsidy' : '薪资达到住房补贴最低标准')
        : (isEnglish ? 'Salary below minimum threshold' : '薪资未达到最低标准');
    }
    if (policyRef.includes('琼公发〔2023〕56号')) {
      return job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))
        ? (isEnglish ? 'Foreign language skills required for visa assistance' : '具备外语技能，可享受签证协助')
        : (isEnglish ? 'No foreign language requirement for visa' : '无相关外语技能要求');
    }
    if (policyRef.includes('RCEP-2022-HN01')) {
      return job.rcep_skills?.length > 0
        ? (isEnglish ? 'RCEP skills required for this position' : '岗位要求RCEP相关技能')
        : (isEnglish ? 'No RCEP skills required' : '无RCEP技能要求');
    }
    if (policyRef.includes('财税〔2025〕10号')) {
      return job.is_encouraged_industry
        ? (isEnglish ? 'Cross-border services trade policy applicable' : '适用跨境服务贸易政策')
        : (isEnglish ? 'Not applicable for cross-border services' : '不适用跨境服务贸易政策');
    }
    return isEnglish ? 'Policy eligibility to be confirmed' : '政策资格待确认';
  };

  const calculateMatchScore = (matchedPolicies) => {
    if (matchedPolicies.length === 0) return 0;
    const eligibleCount = matchedPolicies.filter(p => p.eligible).length;
    return Math.round((eligibleCount / matchedPolicies.length) * 100);
  };

  const matchedPolicies = getMatchedPolicies();
  const matchScore = calculateMatchScore(matchedPolicies);
  const isRecorded = job.recording?.status === 'recorded' || job.is_recorded;

  const handlePolicyTagClick = (policyRef, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPolicyClick) {
      onPolicyClick(policyRef);
    }
  };

  const handlePolicyMatchClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPolicyMatchClick) {
      onPolicyMatchClick(job);
    } else {
      setShowPolicyModal(true);
    }
  };

  const handleQuickApply = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowApplyToast(true);
    setTimeout(() => setShowApplyToast(false), 3000);
  };

  const handleModalOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowPolicyModal(false);
    }
  };

  return (
    <>
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <Link to={`/jobs/${job.id}`} style={{ fontSize: '18px', fontWeight: '600', color: '#212121' }}>
              {title}
            </Link>
            {job.title_en && !isEnglish && (
              <div style={{ fontSize: '13px', color: '#9e9e9e', marginTop: '2px' }}>{job.title_en}</div>
            )}
          </div>

          {job.subsidy_policy_ref && (
            <div style={{ marginBottom: '12px' }}>
              <div className="text-xs text-secondary" style={{ marginBottom: '6px' }}>
                {isEnglish ? 'Policy Basis' : '政策依据'}：
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {job.subsidy_policy_ref.split(',').map((ref, idx) => (
                  <Link
                    key={idx}
                    to={`/policies?policyNumber=${encodeURIComponent(ref.trim())}`}
                    onClick={(e) => handlePolicyTagClick(ref.trim(), e)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: '#e0f2f1',
                      color: '#00897b',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: '1px solid #80cbc4',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#b2dfdb';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#e0f2f1';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    📋 {ref.trim()}
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#ff5722', fontWeight: '600', fontSize: '18px' }}>
              {job.salary_min && job.salary_max 
                ? (job.salary_min / 10000) + '万-' + (job.salary_max / 10000) + '万/月'
                : '面议'}
            </span>
            <span className="text-sm text-secondary">{job.location || '海南'}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <span className="badge badge-primary">{categoryName}</span>
            {job.has_ftz_subsidy && (
              <span
                className="subsidy-tag"
                title={isEnglish ? 'This position qualifies for Hainan Free Trade Port special subsidy benefits, including personal income tax preferences and talent support policies' : '该岗位符合海南自贸港专项补贴待遇，可享受个人所得税优惠及人才扶持政策'}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#fff3e0',
                  color: '#e65100',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid #ffcc80',
                  cursor: 'help',
                }}
              >
                💰 {isEnglish ? 'FTZ Subsidy' : '自贸港补贴'}
              </span>
            )}
            {isRecorded ? (
              <span
                title={job.recording?.bureau_response || (isEnglish ? 'This position has been officially recorded with the Hainan Employment Bureau' : '该岗位已在海南省就业局完成官方备案')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid #a5d6a7',
                  cursor: 'help',
                }}
              >
                📋 {isEnglish ? 'Recorded' : '已备案'}
              </span>
            ) : (
              <span
                title={isEnglish ? 'This position is pending official recording with the Employment Bureau' : '该岗位正在等待就业局官方备案'}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#f5f5f5',
                  color: '#757575',
                  fontSize: '11px',
                  fontWeight: '500',
                  border: '1px solid #e0e0e0',
                  cursor: 'help',
                }}
              >
                ⏳ {isEnglish ? 'Pending Filing' : '待备案'}
              </span>
            )}
            {job.is_encouraged_industry && (
              <span className="badge badge-success">
                {isEnglish ? 'Encouraged Industry' : '鼓励类产业'}
              </span>
            )}
          </div>

          {matchBadges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {matchBadges.map((badge, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: '#fce4ec',
                    color: '#ad1457',
                    fontSize: '11px',
                    fontWeight: '500',
                    border: '1px solid #f8bbd0',
                  }}
                >
                  {badge.icon} {badge.text}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {job.tags && job.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag tag-primary">{tag}</span>
            ))}
            {job.rcep_skills && job.rcep_skills.slice(0, 2).map((skill, index) => (
              <span key={`rcep-${index}`} className="tag tag-accent">{skill}</span>
            ))}
          </div>

          <p className="text-sm text-secondary line-clamp-2" style={{ marginBottom: '12px' }}>
            {description}
          </p>
        </div>

        <div className="divider"></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span className="text-sm text-secondary">{job.company_name}</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handlePolicyMatchClick}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
                color: '#ad1457',
                border: 'none',
              }}
            >
              🎯 {isEnglish ? 'Policy Match' : '政策匹配'}
            </button>
            {isJobseeker && user && (
              <button
                onClick={handleQuickApply}
                className="btn btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #ffd54f, #ffb300)',
                  color: '#bf360c',
                  border: 'none',
                  fontWeight: '600',
                }}
              >
                ⚡ {isEnglish ? 'Quick Apply' : '快速申请'}
              </button>
            )}
            <Link to={'/jobs/' + job.id} className="btn btn-primary btn-sm">
              {isEnglish ? 'Details' : '查看详情'}
            </Link>
          </div>
        </div>
      </div>

      {showApplyToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#43a047',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideDown 0.3s ease',
          }}
        >
          ✅ {isEnglish ? 'Application submitted successfully! The company will contact you soon.' : '申请已成功提交！企业将尽快与您联系。'}
        </div>
      )}

      {showPolicyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleModalOverlayClick}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                🎯 {isEnglish ? 'Policy Matching Results' : '政策匹配结果'}
              </h3>
              <button
                onClick={() => setShowPolicyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9e9e9e',
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-sm text-secondary">{isEnglish ? 'Match Score' : '匹配度'}</span>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{matchScore}%</span>
              </div>
              <div style={{
                height: '8px',
                background: '#e0e0e0',
                borderRadius: '4px',
                marginTop: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #66bb6a, #43a047)',
                  width: matchScore + '%',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}></div>
              </div>
            </div>

            <h4 style={{ marginBottom: '12px' }}>
              {isEnglish ? 'Matched Policies' : '命中政策明细'} ({matchedPolicies.length})
            </h4>

            {matchedPolicies.length === 0 ? (
              <div className="text-secondary text-center" style={{ padding: '24px' }}>
                {isEnglish ? 'No matching policies found' : '暂无匹配政策'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {matchedPolicies.map((policy, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid ' + (policy.eligible ? '#a5d6a7' : '#ef9a9a'),
                      background: policy.eligible ? '#f1f8e9' : '#ffebee',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {policy.number}
                        </div>
                        <div className="text-sm" style={{ color: '#424242' }}>
                          {policy.title}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: policy.eligible ? '#2e7d32' : '#c62828',
                      }}>
                        {policy.eligible ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="text-xs" style={{ marginTop: '8px', color: '#616161' }}>
                      {isEnglish ? 'Eligibility' : '补贴资格'}：{policy.eligible ? (isEnglish ? 'Eligible' : '符合') : (isEnglish ? 'Not Eligible' : '不符合')}
                      <br />
                      {isEnglish ? 'Reason' : '原因'}：{policy.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="divider"></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <Link
                to={`/jobs/${job.id}`}
                className="btn btn-secondary btn-sm"
                onClick={() => setShowPolicyModal(false)}
              >
                {isEnglish ? 'View Details' : '查看详情'}
              </Link>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="btn btn-primary"
              >
                {isEnglish ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @media (max-width: 600px) {
          .card {
            margin: 0 -8px;
          }
        }
      `}</style>
    </>
  );
}
