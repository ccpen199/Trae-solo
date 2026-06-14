import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../contexts/AppContext';

function PolicyCenter() {
  const { t, language } = useApp();
  const [searchParams] = useSearchParams();
  const isEnglish = language === 'en';
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedPolicy, setExpandedPolicy] = useState(null);

  useEffect(() => {
    const policyNumber = searchParams.get('policyNumber');
    if (policyNumber && policies.length > 0) {
      const matched = policies.find(p => p.policy_number === policyNumber);
      if (matched) {
        setExpandedPolicy(matched.id);
        setTimeout(() => {
          const element = document.getElementById('policy-' + matched.id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [policies, searchParams]);

  const categories = [
    { key: 'all', label: 'policy.all' },
    { key: 'tax', label: 'policy.tax' },
    { key: 'talent', label: 'policy.talent' },
    { key: 'industry', label: 'policy.industry' },
    { key: 'visa', label: 'policy.visa' },
    { key: 'trade', label: 'policy.trade' },
    { key: 'general', label: 'policy.general' }
  ];

  useEffect(() => {
    loadPolicies();
  }, [activeCategory]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const res = await api.get('/policies', { params });
      setPolicies(res.data);
    } catch (err) {
      console.error(isEnglish ? 'Failed to load policies:' : '加载政策失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category) => {
    const badges = {
      tax: { className: 'badge badge-primary', text: t('policy.tax') },
      talent: { className: 'badge badge-success', text: t('policy.talent') },
      industry: { className: 'badge badge-warning', text: t('policy.industry') },
      visa: { className: 'badge badge-info', text: t('policy.visa') },
      trade: { className: 'badge badge-secondary', text: t('policy.trade') },
      general: { className: 'badge badge-dark', text: t('policy.general') }
    };
    return badges[category] || { className: 'badge', text: category };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <div className="page-header">
        <h1 className="page-title">{t('policy.title')}</h1>
        <p className="text-muted" style={{ marginTop: '8px' }}>
          {t('policy.subtitle')}
        </p>
      </div>

      <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`btn ${activeCategory === cat.key ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{ borderRadius: '20px' }}
            >
              {t(cat.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-1 gap-16">
        {policies.map(policy => {
          const badge = getCategoryBadge(policy.category);
          const isExpanded = expandedPolicy === policy.id;

          return (
            <div
              id={'policy-' + policy.id}
              key={policy.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: isExpanded ? '2px solid #0288d1' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={badge.className}>{badge.text}</span>
                    <span className="text-sm text-muted">{t('policy.documentNumber')}: {policy.policy_number}</span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#263238', marginBottom: '8px' }}>
                    {isEnglish ? (policy.title_en || policy.title_cn) : policy.title_cn}
                  </h3>
                  {!isEnglish && policy.title_en && (
                    <p className="text-sm" style={{ color: '#546e7a', fontStyle: 'italic', marginBottom: '12px' }}>
                    {policy.title_en}
                    </p>
                  )}

                  <p style={{ color: '#455a64', lineHeight: 1.7, marginBottom: '12px' }}>
                    {isEnglish
                      ? (policy.description_en || policy.content_en || policy.description_cn || policy.content_cn)
                      : (policy.description_cn || policy.content_cn)}
                  </p>

                  {isExpanded && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eceff1' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#263238', marginBottom: '12px' }}>
                        {t('policy.policyDetails')}
                      </h4>
                      <div style={{ background: '#f1f8e9', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ color: '#33691e', lineHeight: 1.8, marginBottom: '12px' }}>
                          {isEnglish ? (policy.content_en || policy.content_cn) : policy.content_cn}
                        </p>
                        {!isEnglish && policy.content_en && (
                          <p className="text-sm" style={{ color: '#689f38', fontStyle: 'italic' }}>
                          {policy.content_en}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-2 gap-12" style={{ marginTop: '16px' }}>
                        <div style={{ background: '#e3f2fd', padding: '16px', borderRadius: '8px' }}>
                          <div className="text-sm text-muted" style={{ marginBottom: '4px' }}>{t('policy.eligibleGroup')}</div>
                          <div style={{ color: '#1565c0', fontWeight: 500 }}>
                            {isEnglish ? (policy.eligible_group_en || policy.eligible_group_cn || 'Eligible enterprises and talents') : (policy.eligible_group_cn || '符合条件的企业与人才')}
                          </div>
                        </div>
                        <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '8px' }}>
                          <div className="text-sm text-muted" style={{ marginBottom: '4px' }}>{t('policy.benefitLevel')}</div>
                          <div style={{ color: '#e65100', fontWeight: 500 }}>
                            {isEnglish ? (policy.benefit_description_en || policy.benefit_description || 'Enjoy policy benefits after qualification verification') : (policy.benefit_description || '通过资格核验后享受政策优惠')}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                        <div className="text-sm" style={{ color: '#78909c', marginBottom: '8px' }}>
                          📅 {t('policy.issueDate')}: {policy.issue_date || '2020-06-23'} &nbsp;|&nbsp; 
                          🏢 {t('policy.issuingAuthority')}: {isEnglish ? (policy.issuing_authority_en || policy.issuing_authority || 'Relevant Hainan Provincial Authorities') : (policy.issuing_authority || '海南省相关主管部门')}
                        </div>
                        <div className="text-sm" style={{ color: '#78909c' }}>
                          🔗 {t('policy.officialLink')}: <a href={policy.official_url || 'https://www.hainan.gov.cn/'} target="_blank" rel="noopener noreferrer" style={{ color: '#0288d1' }}>{policy.official_url || 'https://www.hainan.gov.cn/'}</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}
                  className="btn btn-outline-primary btn-sm"
                >
                  {isExpanded ? `${t('policy.collapse')} ↑` : `${t('policy.viewDetails')} ↓`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {policies.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#90a4ae' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <p>{t('policy.noPolicies')}</p>
        </div>
      )}
    </div>
  );
}

export default PolicyCenter;
