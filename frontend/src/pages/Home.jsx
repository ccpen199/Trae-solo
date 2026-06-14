import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import JobCard from '../components/JobCard';
import { useApp } from '../contexts/AppContext';

const CATEGORIES = [
  { code: 'C01', name: '跨境贸易', nameEn: 'Cross-border Trade', icon: '🌐', topPolicy: '财税〔2020〕31号', jobCount: 156 },
  { code: 'C02', name: '游艇经济', nameEn: 'Yacht Economy', icon: '⛵', topPolicy: '琼府〔2020〕30号', jobCount: 48 },
  { code: 'C03', name: '离岸数据中心', nameEn: 'Offshore Data Center', icon: '💾', topPolicy: '财税〔2020〕32号', jobCount: 203 },
  { code: 'C04', name: '国际航运', nameEn: 'International Shipping', icon: '🚢', topPolicy: '交运发〔2019〕145号', jobCount: 87 },
  { code: 'C05', name: '旅游文化', nameEn: 'Tourism and Culture', icon: '🏝️', topPolicy: '琼办发〔2019〕41号', jobCount: 312 },
  { code: 'C06', name: '医疗健康', nameEn: 'Healthcare', icon: '🏥', topPolicy: '财税〔2020〕32号', jobCount: 178 },
  { code: 'C07', name: '金融服务', nameEn: 'Financial Services', icon: '💰', topPolicy: '琼府〔2020〕30号', jobCount: 134 },
  { code: 'C08', name: '教育服务', nameEn: 'Education Services', icon: '📚', topPolicy: '财税〔2020〕31号', jobCount: 95 },
];

const POLICIES = [
  { title: '企业所得税减按15%征收', titleEn: '15% Corporate Income Tax', desc: '鼓励类产业企业享受税收优惠', descEn: 'Tax incentive for encouraged industry enterprises', tag: '财税〔2020〕31号', filterParam: 'is_encouraged_industry=1', prefKey: 'tax_benefit' },
  { title: '高端人才个税15%优惠', titleEn: '15% Talent Income Tax Cap', desc: '紧缺人才个人所得税实际税负超15%部分免征', descEn: 'Exemption for tax burden above 15% for qualified talents', tag: '财税〔2020〕32号', filterParam: 'has_ftz_subsidy=1&tax_benefit_jobs=1', prefKey: 'tax_benefit' },
  { title: '人才落户补贴', titleEn: 'Talent Settlement Subsidy', desc: '住房租赁补贴/购房补贴', descEn: 'Housing rental and purchase subsidies', tag: '琼办发〔2019〕41号', filterParam: 'min_salary=20000', prefKey: 'housing_subsidy' },
  { title: '外籍人员工作便利', titleEn: 'Foreign Work Permit Support', desc: '放宽外籍人员来琼工作许可条件', descEn: 'Facilitated work permits for foreign professionals', tag: '琼府〔2020〕30号', filterParam: 'has_visa_assistance=1', prefKey: 'visa_assistance' },
];

const SEARCH_SUGGESTIONS = [
  { keyword: '韩语', type: 'skill' },
  { keyword: '日语', type: 'skill' },
  { keyword: '跨境贸易', type: 'category' },
  { keyword: '个税优惠', type: 'filter' },
  { keyword: '游艇设计', type: 'job' },
  { keyword: '数据分析师', type: 'job' },
  { keyword: '跨境电商', type: 'category' },
  { keyword: '国际航运', type: 'category' },
];

const QUICK_FILTERS = [
  { label: '韩语职位', labelEn: 'Korean Jobs', param: 'rcep_skills=韩语' },
  { label: '跨境贸易', labelEn: 'Cross-border Trade', param: 'category=C01' },
  { label: '个税优惠', labelEn: 'Tax Preference', param: 'has_ftz_subsidy=1' },
];

const FOREIGN_LANGUAGES = ['英语', '日语', '韩语', '越南语', '泰语', '印尼语', '马来西亚语', 'English', 'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Indonesian', 'Malay'];

const PREFERENCE_TYPES = [
  { key: 'tax_benefit', icon: '🎯', label: '税收优惠', labelEn: 'Tax Benefit' },
  { key: 'housing_subsidy', icon: '🏠', label: '住房补贴', labelEn: 'Housing Subsidy' },
  { key: 'visa_assistance', icon: '✈️', label: '签证协助', labelEn: 'Visa Assistance' },
  { key: 'rcep_languages', icon: '🌍', label: 'RCEP语言', labelEn: 'RCEP Languages' },
];

export default function Home() {
  const { isJobseeker, isCompany, language, t, user } = useApp();
  const isEnglish = language === 'en';
  const isAdmin = user?.role === 'admin';
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const searchRef = useRef(null);

  const [preferences, setPreferences] = useState(null);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [tempPreferences, setTempPreferences] = useState({
    tax_benefit: false,
    housing_subsidy: false,
    visa_assistance: false,
    rcep_languages: [],
  });

  const [jobFilter, setJobFilter] = useState('all');

  const [showPostingWizard, setShowPostingWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const [filingStats, setFilingStats] = useState({ recorded: 45, total: 68 });
  const [auditStats, setAuditStats] = useState({ pending: 12, approved: 156 });

  const [enterpriseStats, setEnterpriseStats] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastMatchedCount, setLastMatchedCount] = useState(0);

  useEffect(() => {
    loadPreferences();
    fetchFeaturedJobs();
    fetchAllJobs();
    if (isCompany || isAdmin) {
      loadEnterpriseStats();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPreferences = () => {
    const saved = localStorage.getItem('ftz_preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setPreferences(prefs);
      setTempPreferences(prefs);
    }
  };

  const savePreferences = () => {
    localStorage.setItem('ftz_preferences', JSON.stringify(tempPreferences));
    setPreferences(tempPreferences);
    const newCount = calculateTempMatchedJobs(tempPreferences);
    setLastMatchedCount(newCount);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const getPreferenceFilterParams = () => {
    const params = new URLSearchParams();
    if (preferences?.tax_benefit) params.append('has_ftz_subsidy', '1');
    if (preferences?.housing_subsidy) params.append('min_salary', '20000');
    if (preferences?.visa_assistance) params.append('has_visa_assistance', '1');
    if (preferences?.rcep_languages?.length > 0) {
      params.append('rcep_skills', preferences.rcep_languages.join(','));
    }
    params.append('ftz_match', 'true');
    return params.toString();
  };

  const fetchFeaturedJobs = async () => {
    try {
      const response = await api.get('/jobs', {
        params: { has_ftz_subsidy: 1, limit: 6 }
      });
      setFeaturedJobs(response.data.jobs);
    } catch (error) {
      console.error('获取推荐职位失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const response = await api.get('/jobs', { limit: 100 });
      setAllJobs(response.data.jobs);
    } catch (error) {
      console.error('获取所有职位失败:', error);
    }
  };

  const loadEnterpriseStats = async () => {
    try {
      const response = await api.get('/company/stats');
      if (response.data) {
        setEnterpriseStats(response.data);
      }
    } catch (error) {
      console.error('获取企业统计失败:', error);
    }
  };

  const calculateMatchedJobs = () => {
    if (!preferences) return 0;
    let count = 0;
    allJobs.forEach(job => {
      let match = false;
      if (preferences.tax_benefit && job.has_ftz_subsidy) match = true;
      if (preferences.housing_subsidy && job.salary_min >= 20000) match = true;
      if (preferences.visa_assistance && job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) match = true;
      if (preferences.rcep_languages?.length > 0 && job.rcep_skills?.some(skill => preferences.rcep_languages.includes(skill))) match = true;
      if (match) count++;
    });
    return count;
  };

  const calculateMatchedByPreference = (prefs) => {
    const result = {
      tax_benefit: 0,
      housing_subsidy: 0,
      visa_assistance: 0,
      rcep_languages: 0,
    };
    allJobs.forEach(job => {
      if (prefs.tax_benefit && job.has_ftz_subsidy) result.tax_benefit++;
      if (prefs.housing_subsidy && job.salary_min >= 20000) result.housing_subsidy++;
      if (prefs.visa_assistance && job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) result.visa_assistance++;
      if (prefs.rcep_languages?.length > 0 && job.rcep_skills?.some(skill => prefs.rcep_languages.includes(skill))) result.rcep_languages++;
    });
    return result;
  };

  const calculateTempMatchedJobs = (prefs) => {
    let count = 0;
    allJobs.forEach(job => {
      let match = false;
      if (prefs.tax_benefit && job.has_ftz_subsidy) match = true;
      if (prefs.housing_subsidy && job.salary_min >= 20000) match = true;
      if (prefs.visa_assistance && job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) match = true;
      if (prefs.rcep_languages?.length > 0 && job.rcep_skills?.some(skill => prefs.rcep_languages.includes(skill))) match = true;
      if (match) count++;
    });
    return count;
  };

  const getEnterpriseMatchCount = (policyTag) => {
    const mockCounts = {
      '财税〔2020〕31号': 4,
      '财税〔2020〕32号': 5,
      '琼办发〔2019〕41号': 3,
      '琼府〔2020〕30号': 4,
    };
    return mockCounts[policyTag] || 3;
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);
    if (value.length > 0) {
      const filtered = SEARCH_SUGGESTIONS.filter(s =>
        s.keyword.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchKeyword(suggestion.keyword);
    setShowSearchSuggestions(false);
  };

  const handleQuickFilterClick = (param) => {
    window.location.href = `/jobs?${param}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (selectedCategory) params.append('category', selectedCategory);
    window.location.href = `/jobs?${params.toString()}`;
  };

  const isPolicyEligible = (policy) => {
    if (!preferences) return false;
    return preferences[policy.prefKey];
  };

  const countJobsForPolicy = (policy) => {
    return allJobs.filter(job => {
      if (policy.prefKey === 'tax_benefit' && job.has_ftz_subsidy) return true;
      if (policy.prefKey === 'housing_subsidy' && job.salary_min >= 20000) return true;
      if (policy.prefKey === 'visa_assistance' && job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) return true;
      return false;
    }).length;
  };

  const getFilteredJobs = () => {
    let jobs = featuredJobs;
    if (jobFilter === 'ftz') {
      jobs = jobs.filter(j => j.has_ftz_subsidy);
    } else if (jobFilter === 'encouraged') {
      jobs = jobs.filter(j => j.is_encouraged_industry);
    } else if (jobFilter === 'rcep') {
      jobs = jobs.filter(j => j.rcep_skills && j.rcep_skills.length > 0);
    }
    return jobs;
  };

  const handleSmartMatch = () => {
    const params = new URLSearchParams();
    if (preferences?.tax_benefit) params.append('has_ftz_subsidy', '1');
    if (preferences?.housing_subsidy) params.append('min_salary', '20000');
    if (preferences?.visa_assistance) params.append('has_visa_assistance', '1');
    if (preferences?.rcep_languages?.length > 0) {
      params.append('rcep_skills', preferences.rcep_languages.join(','));
    }
    params.append('ftz_match', 'true');
    window.location.href = `/jobs?${params.toString()}`;
  };

  const handleSyncProgress = async () => {
    try {
      await api.post('/company/sync-filing');
      setFilingStats(prev => ({ ...prev, recorded: prev.recorded + 1 }));
      alert(isEnglish ? 'Sync completed!' : '同步完成！');
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  const handleQuickPost = () => {
    if (isCompany) {
      window.location.href = '/company/post-job';
    } else {
      window.location.href = '/register?role=company';
    }
  };

  const handleGenerateContract = (type) => {
    setSelectedContract(type);
    window.location.href = `/contracts?type=${type}`;
  };

  const handleViewAuditDetails = () => {
    if (isAdmin) {
      window.location.href = '/admin/recordings';
    } else if (isCompany) {
      window.location.href = '/company';
    } else {
      window.location.href = '/register?role=company';
    }
  };

  const handlePolicyClick = (policy) => {
    window.location.href = `/policies?policyNumber=${encodeURIComponent(policy.tag)}&filter=${policy.filterParam}`;
  };

  const matchedJobsCount = calculateMatchedJobs();
  const filteredJobs = getFilteredJobs();

  const activePreferences = PREFERENCE_TYPES.filter(p => preferences?.[p.key]);
  const tempMatchedCount = calculateTempMatchedJobs(tempPreferences);
  const tempMatchedByPreference = calculateMatchedByPreference(tempPreferences);

  const renderPreferenceBadge = (pref) => {
    const isActive = preferences?.[pref.key];
    if (!isActive) return null;
    return (
      <span
        key={pref.key}
        style={{
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.2)',
          fontSize: '13px',
          fontWeight: '500',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
          {pref.icon} {isEnglish ? pref.labelEn : pref.label}
          {pref.key === 'rcep_languages' && preferences?.rcep_languages?.length > 0 && (
            <span style={{ marginLeft: '4px', opacity: 0.8 }}>
              ({preferences.rcep_languages.join(', ')})
            </span>
          )}
        </span>
    );
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #00695c 0%, #00897b 50%, #26a69a 100%)',
        color: 'white',
        padding: '80px 0',
      }}>
        <div className="container">
          <h1 style={{ fontSize: '42px', marginBottom: '16px', fontWeight: '700' }}>
            {t('home.title')}
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '40px', opacity: 0.9 }}>
            {t('home.subtitle')}
          </p>

          <div ref={searchRef} style={{ position: 'relative', maxWidth: '800px' }}>
            <form onSubmit={handleSearch} style={{
              display: 'flex',
              gap: '12px',
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}>
              <input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchKeyword}
                onChange={handleSearchInput}
                onFocus={() => searchKeyword && setShowSearchSuggestions(true)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  color: '#212121',
                }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  minWidth: '180px',
                  color: '#212121',
                }}
              >
                <option value="">{t('home.allCategories')}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.code} value={cat.code}>{cat.icon} {isEnglish ? cat.nameEn : cat.name}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '16px' }}>
                {t('common.search')}
              </button>
            </form>

            {showSearchSuggestions && filteredSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                marginTop: '4px',
                zIndex: 100,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px 16px', background: '#f5f5f5', fontSize: '12px', color: '#757575' }}>
                  {t('home.searchSuggestions')}
                </div>
                {filteredSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      color: '#212121',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    {s.type === 'skill' && '🌍 '}
                    {s.type === 'category' && '📂 '}
                    {s.type === 'job' && '💼 '}
                    {s.type === 'filter' && '🏷️ '}
                    {s.keyword}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', opacity: 0.8, alignSelf: 'center' }}>{t('home.quickFilters')}:</span>
            {QUICK_FILTERS.map((filter, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickFilterClick(filter.param)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '13px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
              >
                {isEnglish ? filter.labelEn : filter.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
            {CATEGORIES.slice(0, 6).map(cat => (
              <Link
                key={cat.code}
                to={`/jobs?category=${cat.code}`}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '14px',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
              >
                {cat.icon} {isEnglish ? cat.nameEn : cat.name}
              </Link>
            ))}
          </div>

          <div style={{
            marginTop: '32px',
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{t('home.preferenceStatus')}</span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: activePreferences.length > 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(158, 158, 158, 0.3)',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {activePreferences.length > 0 ? t('home.preferenceMatchMode') : t('home.normalQueryMode')}
                </span>
                {activePreferences.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {PREFERENCE_TYPES.map(pref => renderPreferenceBadge(pref))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', opacity: 0.9 }}>
                      <span>{t('home.matchingCriteriaSummary')}: {activePreferences.map(p => isEnglish ? p.labelEn : p.label).join(' + ')}</span>
                      <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={handleSmartMatch}>
                        {t('home.clickToViewResults')} →
                      </span>
                    </div>
                  </div>
                ) : (
                  <span style={{ opacity: 0.8, fontSize: '14px' }}>{t('home.noPreferences')}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {preferences && (
                  <span style={{ fontSize: '14px', opacity: 0.9 }}>
                    {t('home.matchedJobs')} <strong style={{ fontSize: '18px' }}>{matchedJobsCount}</strong> {t('home.jobsCount')}
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowSuccessMessage(false);
                    setShowPreferenceModal(true);
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '20px',
                    background: 'white',
                    color: '#00897b',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ⚙️ {t('home.quickSetup')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-60px', position: 'relative', zIndex: 10 }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: '#212121' }}>
          {t('home.policyMatchResults')}
        </h2>
        <div className="grid grid-4">
          {POLICIES.map((policy, index) => {
            const isEligible = isPolicyEligible(policy);
            const jobCount = countJobsForPolicy(policy);
            const enterpriseMatchCount = getEnterpriseMatchCount(policy.tag);
            return (
              <div
                key={index}
                className="card"
                onClick={() => handlePolicyClick(policy)}
                style={{
                  background: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #00897b, #26a69a)',
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="text-xs" style={{ color: '#00897b', fontWeight: '600' }}>
                    {policy.tag}
                  </div>
                  {isEligible && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}>
                      ✅ {t('home.youAreEligible')}
                    </span>
                  )}
                </div>
                <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>{isEnglish ? policy.titleEn : policy.title}</h4>
                <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>{isEnglish ? policy.descEn : policy.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                  <span className="text-sm" style={{ color: '#ff5722', fontWeight: '500' }}>
                    {jobCount} {t('home.jobsWithPolicy')}
                  </span>
                  {isCompany && (
                    <span className="text-sm" style={{ color: '#1976d2' }}>
                      {t('home.enterpriseMatchedPositions').replace('{count}', enterpriseMatchCount)}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/jobs?${policy.filterParam}&policy_ref=${encodeURIComponent(policy.tag)}`;
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    marginTop: '12px',
                    width: '100%',
                  }}
                >
                  🔍 {t('home.viewMatchedJobs')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '40px' }}>
          {t('home.quickEntry')}
        </h2>
        <div className="grid grid-4" style={{ marginBottom: '60px' }}>
          <div
            className="card"
            style={{
              height: '100%',
              border: '2px solid #e3f2fd',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2196f3'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e3f2fd'}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h4 style={{ marginBottom: '8px', color: '#1565c0', fontSize: '18px' }}>
              {t('home.postingWizard')}
            </h4>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(step => (
                  <div
                    key={step}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: step <= wizardStep ? '#2196f3' : '#e0e0e0',
                      color: step <= wizardStep ? 'white' : '#757575',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div style={{ height: '4px', background: '#e0e0e0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: ((wizardStep / 5) * 100) + '%', background: 'linear-gradient(90deg, #2196f3, #64b5f6)', transition: 'width 0.3s' }}></div>
              </div>
              <div className="text-xs text-secondary" style={{ marginTop: '8px', textAlign: 'center' }}>
                {wizardStep}/5 {t('home.steps')}
              </div>
            </div>
            <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
              {isEnglish ? 'Complete bilingual posting in 5 steps' : '5步完成双语职位发布'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="text-xs text-secondary">
                {t('home.enterprisesUsing')} <strong style={{ color: '#1565c0' }}>1,234</strong> {t('home.enterprisesUsingSuffix')}
              </span>
            </div>
            <button
              onClick={handleQuickPost}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              🚀 {t('home.quickPost')}
            </button>
          </div>

          <div
            className="card"
            style={{
              height: '100%',
              border: '2px solid #fce4ec',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e91e63'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#fce4ec'}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📑</div>
            <h4 style={{ marginBottom: '16px', color: '#ad1457', fontSize: '18px' }}>
              {t('home.contractTemplates')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { type: 'fulltime', label: '全职合同', labelEn: 'Full-time Contract', icon: '💼' },
                { type: 'foreign', label: '外籍人员合同', labelEn: 'Foreign Staff Contract', icon: '🌍' },
                { type: 'rcep', label: 'RCEP专项合同', labelEn: 'RCEP Special Contract', icon: '🤝' },
              ].map((template, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleGenerateContract(template.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#fce4ec',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8bbd0';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fce4ec';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{ marginRight: '8px', fontSize: '18px' }}>{template.icon}</span>
                    <span style={{ fontSize: '13px', color: '#ad1457', fontWeight: '500' }}>
                      {isEnglish ? template.labelEn : template.label}
                    </span>
                    <span style={{ marginLeft: 'auto', color: '#ad1457', fontSize: '16px' }}>→</span>
                  </div>
                ))}
            </div>
            <button
              onClick={() => window.location.href = '/contracts'}
              className="btn btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #e91e63, #ec407a)' }}
            >
              ✨ {t('home.generateNow')}
            </button>
          </div>

          <div
            className="card"
            style={{
              height: '100%',
              border: '2px solid #e8f5e9',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4caf50'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8f5e9'}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h4 style={{ marginBottom: '16px', color: '#2e7d32', fontSize: '18px' }}>
              {t('home.filingManagement')}
            </h4>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="text-sm text-secondary">{t('home.recorded')}</span>
                <span className="text-sm" style={{ color: '#2e7d32', fontWeight: '600' }}>{filingStats.recorded}/{filingStats.total} {t('home.totalJobs')}</span>
              </div>
              <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  height: '100%',
                  width: ((filingStats.recorded / filingStats.total) * 100) + '%',
                  background: 'linear-gradient(90deg, #66bb6a, #43a047)',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  fontSize: '11px',
                  fontWeight: '500',
                }}>
                  ✅ {filingStats.recorded} {t('home.recorded')}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#fff3e0',
                  color: '#e65100',
                  fontSize: '11px',
                  fontWeight: '500',
                }}>
                  ⏳ {filingStats.total - filingStats.recorded} {t('home.pending')}
                </span>
              </div>
            </div>
            <button
              onClick={handleSyncProgress}
              className="btn btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #4caf50, #66bb6a)' }}
            >
              🔄 {t('home.syncProgress')}
            </button>
          </div>

          <div
            className="card"
            style={{
              height: '100%',
              border: '2px solid #fff3e0',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ff9800'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#fff3e0'}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h4 style={{ marginBottom: '16px', color: '#e65100', fontSize: '18px' }}>
              {t('home.dataAudit')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                padding: '16px',
                background: '#fff3e0',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e65100' }}>{auditStats.pending}</div>
                <div className="text-xs" style={{ color: '#e65100' }}>{t('home.pendingReview')}</div>
              </div>
              <div style={{
                padding: '16px',
                background: '#e8f5e9',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{auditStats.approved}</div>
                <div className="text-xs" style={{ color: '#2e7d32' }}>{t('home.approved')}</div>
              </div>
            </div>
            <p className="text-sm text-secondary" style={{ marginBottom: '16px', minHeight: '40px' }}>
              {isEnglish ? 'Review and verify recruitment data compliance' : '审核招聘数据合规性'}
            </p>
            <button
              onClick={handleViewAuditDetails}
              className="btn btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #ff9800, #ffa726)' }}
            >
              📊 {t('home.viewDetails')}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>
            {t('home.featuredJobs')}
          </h2>
          <Link to="/jobs?ftz_match=true" style={{ color: '#00897b', textDecoration: 'none', fontWeight: '500' }}>
              🔗 {t('home.viewFullCycle')} →
            </Link>
          </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: '全部', labelEn: 'All', icon: '📋' },
            { key: 'ftz', label: '自贸港补贴', labelEn: 'FTP Subsidy', icon: '💰' },
            { key: 'encouraged', label: '鼓励类产业', labelEn: 'Encouraged Industry', icon: '🏭' },
            { key: 'rcep', label: 'RCEP小语种', labelEn: 'RCEP Languages', icon: '🌍' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setJobFilter(filter.key)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                background: jobFilter === filter.key ? '#00897b' : 'white',
                color: jobFilter === filter.key ? 'white' : '#424242',
                border: '1px solid #e0e0e0',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (jobFilter !== filter.key) {
                  e.target.style.background = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (jobFilter !== filter.key) {
                  e.target.style.background = 'white';
                }
              }}
            >
              {filter.icon} {isEnglish ? filter.labelEn : filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9e9e9e' }}>
            {isEnglish ? 'No matching jobs' : '暂无匹配的职位'}
          </div>
        ) : (
          <div className="grid grid-3">
            {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} showPreferences={true} />
          ))}
          </div>
        )}
      </div>

      <div style={{ background: '#f0fdfa', padding: '60px 0', marginTop: '60px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700' }}>
              {t('home.newIndustries')}
            </h2>
            <button
              onClick={handleSmartMatch}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #00897b, #26a69a)',
              }}
            >
              🎯 {t('home.smartMatch')}
            </button>
          </div>
          <div className="grid grid-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.code}
                to={`/jobs?category=${cat.code}`}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{cat.icon}</div>
                <h4 style={{ marginBottom: '8px', fontSize: '18px' }}>{isEnglish ? cat.nameEn : cat.name}</h4>
                <div style={{ marginBottom: '12px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                    📊 {cat.jobCount} {t('home.jobsCount')}</span>
                </div>
                <div className="text-xs text-secondary" style={{ marginBottom: '8px' }}>
                  {t('home.topPolicy')}: <span style={{ color: '#00897b', fontWeight: '500' }}>{cat.topPolicy}</span>
                </div>
                <span
                  className="text-sm"
                  style={{ color: '#00897b', textDecoration: 'none', fontWeight: '500' }}
                >
                  🔥 {t('home.hotJobs')} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '32px' }}>
          {isEnglish ? '🎯 Core Features' : '🎯 核心功能'}
        </h2>
        <div className="grid grid-4" style={{ marginBottom: '60px' }}>
          <Link to={isJobseeker ? '/jobseeker' : '/register?role=jobseeker'} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ 
              height: '100%', 
              border: '2px solid #e3f2fd', 
              transition: 'all 0.2s',
              cursor: 'pointer'
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2196f3'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e3f2fd'}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h4 style={{ marginBottom: '8px', color: '#1565c0' }}>
                {isEnglish ? 'FTZ Preferences' : '自贸岗偏好设置'}
              </h4>
              <p className="text-sm text-secondary">
                {isEnglish 
                  ? 'Set tax benefit, housing subsidy, visa assistance preferences' 
                  : '设置税收优惠、住房补贴、签证协助等偏好'}
              </p>
            </div>
          </Link>
          
          <Link to={isCompany ? '/company' : '/register?role=company'} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ 
              height: '100%', 
              border: '2px solid #fce4ec', 
              transition: 'all 0.2s',
              cursor: 'pointer'
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e91e63'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#fce4ec'}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h4 style={{ marginBottom: '8px', color: '#ad1457' }}>
                {isEnglish ? 'Policy Matching' : '政策匹配引擎'}
              </h4>
              <p className="text-sm text-secondary">
                {isEnglish 
                  ? 'Auto-match encouraged industry catalog and talent subsidies' 
                  : '自动匹配鼓励类产业目录和人才补贴政策'}
              </p>
            </div>
          </Link>
          
          <Link to="/contracts" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ 
              height: '100%', 
              border: '2px solid #e8f5e9', 
              transition: 'all 0.2s',
              cursor: 'pointer'
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4caf50'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8f5e9'}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📑</div>
              <h4 style={{ marginBottom: '8px', color: '#2e7d32' }}>
                {isEnglish ? 'Contract Templates' : '合同模板库'}
              </h4>
              <p className="text-sm text-secondary">
                {isEnglish 
                  ? 'Bilingual foreign-related labor contract templates' 
                  : '中英双语涉外劳动合同模板，一键生成'}
              </p>
            </div>
          </Link>
          
          <Link to={isAdmin ? '/admin/recordings' : '/policies'} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ 
              height: '100%', 
              border: '2px solid #fff3e0', 
              transition: 'all 0.2s',
              cursor: 'pointer'
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ff9800'}
               onMouseLeave={(e) => e.currentTarget.style.borderColor = '#fff3e0'}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h4 style={{ marginBottom: '8px', color: '#e65100' }}>
                {isEnglish ? 'Filing Management' : '就业局备案管理'}
              </h4>
              <p className="text-sm text-secondary">
                {isEnglish 
                  ? 'Real-time sync with Hainan Employment Bureau' 
                  : '对接海南省就业局，招聘数据实时回传'}
              </p>
            </div>
          </Link>
        </div>

        <div className="grid grid-2">
          <div style={{
            background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
            borderRadius: '16px',
            padding: '40px',
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#e65100' }}>
              {t('home.jobseekerChannel')}
            </h3>
            <p style={{ marginBottom: '24px', color: '#5d4037' }}>
              {t('home.jobseekerDesc')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isJobseeker && !isCompany ? (
                <>
                  <Link to="/register?role=jobseeker" className="btn btn-primary">{t('home.registerNow')}</Link>
                  <Link to="/jobs" className="btn btn-secondary">{t('home.browseJobs')}</Link>
                </>
              ) : isJobseeker ? (
                <Link to="/jobseeker" className="btn btn-primary">{t('home.enterMyPage')}</Link>
              ) : (
                <Link to="/jobs" className="btn btn-primary">{t('home.browseJobs')}</Link>
              )}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
            borderRadius: '16px',
            padding: '40px',
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '16px', color: '#2e7d32' }}>
              {t('home.companyChannel')}
            </h3>
            <p style={{ marginBottom: '24px', color: '#33691e' }}>
              {t('home.companyDesc')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isCompany && !isJobseeker ? (
                <>
                  <Link to="/register?role=company" className="btn btn-primary">{t('home.companyRegister')}</Link>
                  <Link to="/policies" className="btn btn-secondary">{t('home.understandPolicies')}</Link>
                </>
              ) : isCompany ? (
                <>
                  <Link to="/company/post-job" className="btn btn-primary">{t('home.postJobNow')}</Link>
                  <Link to="/company" className="btn btn-secondary">{t('home.enterCompanyCenter')}</Link>
                </>
              ) : (
                <Link to="/policies" className="btn btn-primary">{t('home.understandPolicies')}</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreferenceModal && (
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
          onClick={() => setShowPreferenceModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>
                ⚙️ {isEnglish ? 'Set Your Preferences' : '设置您的求职偏好'}
              </h3>
              <button
                onClick={() => setShowPreferenceModal(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {PREFERENCE_TYPES.map(pref => (
                <label
                  key={pref.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#eeeeee'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                >
                  <input
                    type="checkbox"
                    checked={tempPreferences[pref.key] || (pref.key === 'rcep_languages' && tempPreferences.rcep_languages?.length > 0)}
                    onChange={(e) => {
                      if (pref.key === 'rcep_languages') {
                        setTempPreferences(prev => ({
                          ...prev,
                          rcep_languages: e.target.checked ? ['韩语', '日语'] : [],
                        }));
                      } else {
                        setTempPreferences(prev => ({
                          ...prev,
                          [pref.key]: e.target.checked,
                        }));
                      }
                    }}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#00897b',
                      marginTop: '2px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#212121' }}>
                      {pref.icon} {isEnglish ? pref.labelEn : pref.label}
                    </div>
                    <div className="text-sm text-secondary" style={{ marginTop: '4px' }}>
                      {pref.key === 'tax_benefit' && (isEnglish ? 'Prioritize jobs with tax benefits' : '优先推荐享受税收优惠的岗位')}
                      {pref.key === 'housing_subsidy' && (isEnglish ? 'Prioritize jobs with housing subsidies' : '优先推荐有住房补贴的岗位')}
                      {pref.key === 'visa_assistance' && (isEnglish ? 'Jobs offering visa assistance' : '需要提供签证办理服务')}
                      {pref.key === 'rcep_languages' && (isEnglish ? 'RCEP language skill requirements' : 'RCEP小语种技能要求岗位')}
                    </div>
                  </div>
                </label>
              ))}

              {tempPreferences.rcep_languages?.length > 0 && (
                <div style={{ paddingLeft: '44px', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '-8px' }}>
                  {['韩语', '日语', '越南语', '泰语', '印尼语', '马来西亚语'].map(lang => (
                    <label key={lang} style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      background: tempPreferences.rcep_languages.includes(lang) ? '#00897b' : '#e0e0e0',
                      color: tempPreferences.rcep_languages.includes(lang) ? 'white' : '#424242',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <input
                        type="checkbox"
                        checked={tempPreferences.rcep_languages.includes(lang)}
                        onChange={(e) => {
                          const newLangs = e.target.checked
                            ? [...tempPreferences.rcep_languages, lang]
                            : tempPreferences.rcep_languages.filter(l => l !== lang);
                          setTempPreferences(prev => ({ ...prev, rcep_languages: newLangs }));
                        }}
                        style={{ display: 'none' }}
                      />
                      {lang}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="divider"></div>

            <div style={{
              padding: '16px',
              background: '#f0fdfa',
              borderRadius: '8px',
              border: '1px solid #b2dfdb',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#00695c' }}>
                  📊 {t('home.matchingCriteria')}
                </h4>
                <span style={{ fontSize: '12px', color: '#00897b' }}>
                  👁️ {t('home.realtimePreview')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PREFERENCE_TYPES.map(pref => {
                  const isSelected = pref.key === 'rcep_languages' 
                    ? tempPreferences.rcep_languages?.length > 0 
                    : tempPreferences[pref.key];
                  if (!isSelected) return null;
                  return (
                    <div key={pref.key} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '13px',
                    }}>
                      <span style={{ color: '#424242' }}>
                        {pref.icon} {isEnglish ? pref.labelEn : pref.label}
                      </span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#00897b',
                        background: 'white',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        border: '1px solid #b2dfdb',
                      }}>
                        {tempMatchedByPreference[pref.key]} {t('home.jobsCount')}
                      </span>
                    </div>
                  );
                })}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '1px dashed #b2dfdb',
                  marginTop: '4px',
                }}>
                  <span style={{ fontWeight: '600', color: '#212121' }}>
                    {t('home.matchedJobs')}
                  </span>
                  <span style={{ 
                    fontWeight: '700', 
                    fontSize: '18px', 
                    color: '#00695c',
                  }}>
                    {tempMatchedCount} {t('home.jobsCount')}
                  </span>
                </div>
              </div>
            </div>

            {showSuccessMessage && (
              <div style={{
                padding: '16px',
                background: '#e8f5e9',
                borderRadius: '8px',
                border: '1px solid #a5d6a7',
                marginBottom: '16px',
              }}>
                <div style={{ marginBottom: '12px', color: '#2e7d32', fontWeight: '600' }}>
                  ✅ {t('home.saveSuccess')}
                </div>
                <div style={{ marginBottom: '12px', color: '#388e3c' }}>
                  {t('home.matchedCountText').replace('{count}', lastMatchedCount)}
                </div>
                <button
                  onClick={() => {
                    setShowPreferenceModal(false);
                    window.location.href = `/jobs?${getPreferenceFilterParams()}`;
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                    width: '100%',
                  }}
                >
                  🔍 {t('home.viewMatchedJobsNow')}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowPreferenceModal(false)}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={savePreferences}
                className="btn btn-primary"
              >
                ✅ {t('home.savePreferences')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
