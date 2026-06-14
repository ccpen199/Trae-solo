import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import JobCard from '../components/JobCard';
import { useApp } from '../contexts/AppContext';

const CATEGORIES = [
  { code: '', name: '全部', nameEn: 'All' },
  { code: 'C01', name: '跨境贸易', nameEn: 'Cross-border Trade' },
  { code: 'C02', name: '游艇经济', nameEn: 'Yacht Economy' },
  { code: 'C03', name: '离岸数据中心', nameEn: 'Offshore Data Center' },
  { code: 'C04', name: '国际航运', nameEn: 'International Shipping' },
  { code: 'C05', name: '旅游文化', nameEn: 'Tourism and Culture' },
  { code: 'C06', name: '医疗健康', nameEn: 'Healthcare' },
  { code: 'C07', name: '金融服务', nameEn: 'Financial Services' },
  { code: 'C08', name: '教育服务', nameEn: 'Education Services' },
];

const SALARY_RANGES = [
  { value: '', labelKey: 'jobs.salaryUnlimited' },
  { value: '10000', labelKey: 'jobs.salaryAbove10k' },
  { value: '20000', labelKey: 'jobs.salaryAbove20k' },
  { value: '30000', labelKey: 'jobs.salaryAbove30k' },
  { value: '50000', labelKey: 'jobs.salaryAbove50k' },
];

const MOCK_POLICIES = {
  '财税〔2020〕32号': { title: '海南自贸港高端紧缺人才个人所得税优惠政策', titleEn: 'Hainan FTP High-end Talent Individual Income Tax Policy', category: '税收优惠' },
  '琼府〔2020〕41号': { title: '海南自贸港鼓励类产业企业所得税优惠政策', titleEn: 'Hainan FTP Encouraged Industry Corporate Income Tax Policy', category: '产业鼓励' },
  '财税〔2025〕10号': { title: '海南自贸港跨境服务贸易负面清单', titleEn: 'Hainan FTP Cross-border Services Trade Negative List', category: '产业鼓励' },
  '琼人社〔2024〕88号': { title: '海南自贸港住房补贴实施细则', titleEn: 'Hainan FTP Housing Subsidy Implementation Rules', category: '人才补贴' },
  '琼公发〔2023〕56号': { title: '海南自贸港外籍人才签证便利措施', titleEn: 'Hainan FTP Foreign Talent Visa Facilitation Measures', category: '签证便利' },
  'RCEP-2022-HN01': { title: 'RCEP框架下海南跨境电商人才扶持政策', titleEn: 'RCEP Hainan Cross-border E-commerce Talent Support Policy', category: '人才补贴' },
};

const FOREIGN_LANGUAGES = ['英语', '日语', '韩语', '越南语', '泰语', '印尼语', '马来西亚语'];

export default function JobList() {
  const { t, language, user } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isEnglish = language === 'en';
  const isJobseeker = user?.role === 'jobseeker';
  const isCompany = user?.role === 'company';

  const [showPreferences, setShowPreferences] = useState(false);
  const [showPolicyEngineModal, setShowPolicyEngineModal] = useState(false);
  const [selectedPolicyRef, setSelectedPolicyRef] = useState('');
  const [policyRefSearch, setPolicyRefSearch] = useState('');
  const [policyMatchResults, setPolicyMatchResults] = useState(null);
  const [selectedJobForPolicyMatch, setSelectedJobForPolicyMatch] = useState(null);
  
  const FILTER_KEYS = ['keyword', 'category', 'salary_min', 'has_ftz_subsidy', 'rcep_skill', 'is_encouraged_industry', 'tax_benefit_jobs', 'policy_ref'];
  
  const getInitialFilters = () => {
    const initial = {};
    FILTER_KEYS.forEach(key => {
      initial[key] = searchParams.get(key) || '';
    });
    return initial;
  };
  
  const [filters, setFilters] = useState(getInitialFilters);
  
  const ftzMatch = searchParams.get('ftz_match') === 'true';
  
  const getActiveFilters = () => {
    const active = [];
    FILTER_KEYS.forEach(key => {
      if (filters[key] && filters[key] !== '') {
        active.push({ key, value: filters[key] });
      }
    });
    return active;
  };
  
  const activeFilters = getActiveFilters();
  
  const getFilterLabel = (key) => {
    const labels = {
      keyword: isEnglish ? 'Keyword' : '关键词',
      category: isEnglish ? 'Category' : '类别',
      salary_min: isEnglish ? 'Min Salary' : '最低薪资',
      has_ftz_subsidy: isEnglish ? 'FTZ Subsidy' : '自贸港补贴',
      rcep_skill: isEnglish ? 'RCEP Skill' : 'RCEP技能',
      is_encouraged_industry: isEnglish ? 'Encouraged Industry' : '鼓励类产业',
      tax_benefit_jobs: isEnglish ? 'Tax Benefit' : '个税优惠',
      policy_ref: isEnglish ? 'Policy Ref' : '政策依据',
    };
    return labels[key] || key;
  };
  
  const getFilterValueDisplay = (key, value) => {
    if (key === 'category') {
      const cat = CATEGORIES.find(c => c.code === value);
      return cat ? (isEnglish ? cat.nameEn : cat.name) : value;
    }
    if (key === 'salary_min') {
      const range = SALARY_RANGES.find(r => r.value === value);
      return range ? t(range.labelKey) : value;
    }
    if (key === 'has_ftz_subsidy' || key === 'is_encouraged_industry' || key === 'tax_benefit_jobs') {
      return value === '1' ? (isEnglish ? 'Yes' : '是') : value;
    }
    if (key === 'rcep_skill') {
      return isEnglish ? (RCEP_SKILL_LABELS[value] || value) : value;
    }
    return value;
  };
  
  const getUserPreferences = () => {
    try {
      const prefs = JSON.parse(localStorage.getItem('ftz_preferences') || '{}');
      return prefs;
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const mockPrefs = {
      tax_benefit: true,
      housing_subsidy: true,
      visa_assistance: true,
      rcep_languages: ['英语', '日语'],
      saved_at: new Date().toISOString(),
    };
    if (!localStorage.getItem('ftz_preferences')) {
      localStorage.setItem('ftz_preferences', JSON.stringify(mockPrefs));
    }
  }, []);

  const RCEP_SKILLS = [
    '英语', '日语', '韩语', '越南语', '泰语', '印尼语', '马来西亚语',
    'RCEP原产地规则', '跨境电商', '国际贸易', '国际物流', '国际结算'
  ];
  const RCEP_SKILL_LABELS = {
    英语: 'English',
    日语: 'Japanese',
    韩语: 'Korean',
    越南语: 'Vietnamese',
    泰语: 'Thai',
    印尼语: 'Indonesian',
    马来西亚语: 'Malay',
    'RCEP原产地规则': 'RCEP Rules of Origin',
    跨境电商: 'Cross-border E-commerce',
    国际贸易: 'International Trade',
    国际物流: 'International Logistics',
    国际结算: 'International Settlement'
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const newFilters = {};
      let hasChanges = false;
      FILTER_KEYS.forEach(key => {
        const urlValue = searchParams.get(key) || '';
        if (urlValue !== filters[key]) {
          newFilters[key] = urlValue;
          hasChanges = true;
        }
      });
      if (hasChanges) {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
      }
    };
    handleUrlChange();
  }, [searchParams]);
  
  useEffect(() => {
    fetchJobs();
  }, [filters, page]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page,
        limit: 9,
      };
      const response = await api.get('/jobs', { params });
      let filteredJobs = response.data.jobs;

      if (filters.tax_benefit_jobs === '1') {
        filteredJobs = filteredJobs.filter(job => {
          const hasRcepForeignLang = job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill));
          const hasHighSalary = (job.salary_min || 0) > 30000;
          return hasRcepForeignLang || hasHighSalary;
        });
      }

      if (filters.is_encouraged_industry === '1') {
        filteredJobs = filteredJobs.filter(job => job.is_encouraged_industry === true);
      }

      if (filters.policy_ref) {
        filteredJobs = filteredJobs.filter(job => 
          job.subsidy_policy_ref?.includes(filters.policy_ref)
        );
      }

      setJobs(filteredJobs);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('获取职位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };
  
  const handleRemoveFilter = (key) => {
    handleFilterChange(key, '');
    if (key === 'policy_ref') {
      setPolicyRefSearch('');
    }
  };
  
  const clearAllFilters = () => {
    const emptyFilters = {};
    FILTER_KEYS.forEach(key => {
      emptyFilters[key] = '';
    });
    setFilters(emptyFilters);
    setPolicyRefSearch('');
    setPage(1);
    
    const newParams = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach(key => {
      newParams.delete(key);
    });
    newParams.delete('page');
    newParams.delete('ftz_match');
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handlePolicyClick = (policyRef) => {
    handleFilterChange('policy_ref', filters.policy_ref === policyRef ? '' : policyRef);
    setPolicyRefSearch(policyRef);
  };

  const handlePolicyMatchClick = (job) => {
    setSelectedJobForPolicyMatch(job);
  };

  const getMatchedPolicies = (job) => {
    const policyRefs = job.subsidy_policy_ref ? job.subsidy_policy_ref.split(',').map(p => p.trim()) : [];
    return policyRefs.map(ref => ({
      number: ref,
      title: MOCK_POLICIES[ref]?.[isEnglish ? 'titleEn' : 'title'] || ref,
      category: MOCK_POLICIES[ref]?.category || '其他',
      eligible: checkEligibility(job, ref),
      reason: getEligibilityReason(job, ref),
    }));
  };

  const checkEligibility = (job, policyRef) => {
    if (!policyRef) return false;
    if (policyRef.includes('财税〔2020〕32号') && job.has_ftz_subsidy) return true;
    if (policyRef.includes('琼府〔2020〕41号') && job.is_encouraged_industry) return true;
    if (policyRef.includes('琼人社〔2024〕88号') && job.salary_min >= 20000) return true;
    if (policyRef.includes('琼公发〔2023〕56号') && job.rcep_skills?.some(skill => FOREIGN_LANGUAGES.includes(skill))) return true;
    if (policyRef.includes('RCEP-2022-HN01') && job.rcep_skills?.length > 0) return true;
    if (policyRef.includes('财税〔2025〕10号') && job.is_encouraged_industry) return true;
    return false;
  };

  const getEligibilityReason = (job, policyRef) => {
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

  const runPolicyMatching = async () => {
    try {
      const response = await api.get('/jobs', { params: { limit: 100 } });
      const allJobs = response.data.jobs;
      
      const matchedJobs = allJobs.filter(job => {
        const policies = getMatchedPolicies(job);
        return policies.some(p => p.eligible);
      });

      const matchedPoliciesMap = {};
      matchedJobs.forEach(job => {
        const policies = getMatchedPolicies(job);
        policies.filter(p => p.eligible).forEach(p => {
          if (!matchedPoliciesMap[p.number]) {
            matchedPoliciesMap[p.number] = {
              ...p,
              jobCount: 0,
              jobs: [],
            };
          }
          matchedPoliciesMap[p.number].jobCount++;
          matchedPoliciesMap[p.number].jobs.push(job);
        });
      });

      const results = {
        totalJobs: allJobs.length,
        matchedJobs: matchedJobs.length,
        matchRate: Math.round((matchedJobs.length / allJobs.length) * 100),
        matchedPolicies: Object.values(matchedPoliciesMap),
      };

      setPolicyMatchResults(results);
    } catch (error) {
      console.error('Policy matching failed:', error);
    }
  };

  const hasActiveFilters = activeFilters.length > 0;

  const getSelectedJobPolicyMatch = () => {
    if (!selectedJobForPolicyMatch) return null;
    const matchedPolicies = getMatchedPolicies(selectedJobForPolicyMatch);
    const matchScore = matchedPolicies.length > 0 
      ? Math.round((matchedPolicies.filter(p => p.eligible).length / matchedPolicies.length) * 100)
      : 0;
    return { job: selectedJobForPolicyMatch, matchedPolicies, matchScore };
  };

  const selectedJobMatch = getSelectedJobPolicyMatch();

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px' }}>
        {t('jobs.title')}
      </h1>
      <p className="text-secondary" style={{ marginTop: '-12px', marginBottom: '24px' }}>
        {isEnglish ? 'Search results and filter queries' : '搜索结果与筛选查询结果'}
      </p>

      <div className="card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: ftzMatch ? '#fce4ec' : '#e3f2fd',
              color: ftzMatch ? '#ad1457' : '#1565c0',
              fontSize: '14px',
              fontWeight: '600',
            }}>
              {ftzMatch ? '🎯' : '📋'} {ftzMatch ? (isEnglish ? 'Preference Match Mode' : '偏好匹配模式') : (isEnglish ? 'Normal Query Mode' : '普通查询模式')}
            </span>
            {ftzMatch && (() => {
              const prefs = getUserPreferences();
              const badges = [];
              if (prefs.tax_benefit) badges.push(isEnglish ? 'Tax Benefit' : '税收优惠');
              if (prefs.housing_subsidy) badges.push(isEnglish ? 'Housing Subsidy' : '住房补贴');
              if (prefs.visa_assistance) badges.push(isEnglish ? 'Visa Assistance' : '签证协助');
              if (prefs.rcep_languages?.length > 0) badges.push(isEnglish ? 'RCEP Languages' : 'RCEP外语');
              return badges.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {badges.map((b, i) => (
                    <span key={i} style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: '#f3e5f5',
                      color: '#7b1fa2',
                      fontSize: '12px',
                    }}>
                      {b}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span className="text-sm text-secondary">
              {isEnglish ? `${activeFilters.length} filters applied` : `已应用 ${activeFilters.length} 个筛选条件`}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '12px', padding: '4px 12px' }}
              >
                {isEnglish ? 'Clear All' : '清除全部筛选'}
              </button>
            )}
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span className="text-sm text-secondary" style={{ marginRight: '4px' }}>
              {isEnglish ? 'Current Filters:' : '当前筛选：'}
            </span>
            {activeFilters.map(({ key, value }) => (
              <span
                key={key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  fontSize: '12px',
                  border: '1px solid #a5d6a7',
                }}
              >
                <span style={{ fontWeight: '500' }}>{getFilterLabel(key)}:</span>
                <span>{getFilterValueDisplay(key, value)}</span>
                <button
                  onClick={() => handleRemoveFilter(key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2e7d32',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '0',
                    lineHeight: '1',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={t('jobs.searchPlaceholder')}
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            className="form-input"
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="form-select"
            style={{ minWidth: '160px' }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.code} value={cat.code}>{language === 'en' ? cat.nameEn : cat.name}</option>
            ))}
          </select>
          <select
            value={filters.salary_min}
            onChange={(e) => handleFilterChange('salary_min', e.target.value)}
            className="form-select"
            style={{ minWidth: '140px' }}
          >
            {SALARY_RANGES.map(range => (
              <option key={range.value} value={range.value}>{t(range.labelKey)}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={isEnglish ? 'Filter by policy number' : '按政策文号筛选'}
            value={policyRefSearch}
            onChange={(e) => {
              setPolicyRefSearch(e.target.value);
              if (e.target.value === '') {
                handleFilterChange('policy_ref', '');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFilterChange('policy_ref', policyRefSearch);
              }
            }}
            className="form-input"
            style={{ minWidth: '180px' }}
          />
          <button type="submit" className="btn btn-primary">{t('common.search')}</button>
        </form>

        <div className="divider"></div>

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 12px 0', color: '#424242', fontSize: '14px', fontWeight: '600' }}>
            🔍 {isEnglish ? 'Policy Match Filters' : '政策匹配筛选'}
          </h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.has_ftz_subsidy === '1'}
                onChange={(e) => handleFilterChange('has_ftz_subsidy', e.target.checked ? '1' : '')}
              />
              <span className="text-sm">{isEnglish ? 'FTZ subsidy jobs only' : '仅显示享受自贸港补贴'}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.is_encouraged_industry === '1'}
                onChange={(e) => handleFilterChange('is_encouraged_industry', e.target.checked ? '1' : '')}
              />
              <span className="text-sm">{isEnglish ? 'Encouraged industry only' : '仅显示鼓励类产业'}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.tax_benefit_jobs === '1'}
                onChange={(e) => handleFilterChange('tax_benefit_jobs', e.target.checked ? '1' : '')}
              />
              <span className="text-sm">{isEnglish ? 'Tax benefit jobs only' : '仅显示个税优惠岗位'}</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={showPreferences}
                onChange={(e) => setShowPreferences(e.target.checked)}
              />
              <span className="text-sm" style={{ color: '#ad1457', fontWeight: '500' }}>
                🎯 {isEnglish ? 'Show Preference Match' : '显示偏好匹配'}
              </span>
            </label>
          </div>
        </div>

        <div className="divider"></div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <span className="text-sm text-secondary" style={{ marginRight: '8px' }}>{t('common.filter')}：</span>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
            {RCEP_SKILLS.slice(0, 8).map(skill => (
              <button
                key={skill}
                onClick={() => handleFilterChange('rcep_skill', filters.rcep_skill === skill ? '' : skill)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: '1px solid ' + (filters.rcep_skill === skill ? '#00897b' : '#e0e0e0'),
                  background: filters.rcep_skill === skill ? '#e0f2f1' : 'white',
                  color: filters.rcep_skill === skill ? '#00695c' : '#616161',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {language === 'en' ? (RCEP_SKILL_LABELS[skill] || skill) : skill}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {t('common.clear')}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div 
          onClick={(e) => {
            e.preventDefault();
            setShowPolicyEngineModal(true);
            runPolicyMatching();
          }}
          style={{ 
            textDecoration: 'none', 
            color: 'inherit', 
            cursor: 'pointer',
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'transform 0.2s',
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '36px' }}>🔍</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#ad1457', fontSize: '16px' }}>
                {isEnglish ? 'Policy Matching Engine' : '政策匹配引擎'}
              </h4>
              <p className="text-sm" style={{ margin: '0 0 12px 0', color: '#5d4037' }}>
                {isEnglish 
                  ? 'Match encouraged industry catalog & talent subsidies' 
                  : '智能匹配鼓励类产业目录和人才补贴政策'}
              </p>
              <button 
                className="btn btn-primary btn-sm"
                style={{ background: '#ad1457', border: 'none' }}
              >
                ▶ {isEnglish ? 'Run Match' : '运行匹配'}
              </button>
            </div>
          </div>
        </div>
        
        <Link 
          to={isJobseeker ? '/jobseeker' : '/register?role=jobseeker'} 
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'transform 0.2s',
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '36px' }}>🎯</div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#1565c0', fontSize: '16px' }}>
                {isEnglish ? 'Set FTZ Preferences' : '设置自贸岗偏好'}
              </h4>
              <p className="text-sm" style={{ margin: 0, color: '#5d4037' }}>
                {isEnglish 
                  ? 'Tax benefit, housing subsidy, visa assistance preferences' 
                  : '设置税收优惠、住房补贴、签证协助等偏好'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <p className="text-secondary">
          搜索结果：
          {t('jobs.totalFound')}
          <span className="text-primary font-bold">{total}</span>
          {t('jobs.positions')}
        </p>
        {filters.policy_ref && (
          <div style={{
            padding: '6px 12px',
            background: '#e8f5e9',
            borderRadius: '16px',
            fontSize: '13px',
            color: '#2e7d32',
          }}>
            {isEnglish ? 'Filtering by policy' : '按政策筛选'}：{filters.policy_ref}
            <button
              onClick={() => {
                handleFilterChange('policy_ref', '');
                setPolicyRefSearch('');
              }}
              style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none', color: '#2e7d32' }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="loading"></div>
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="grid grid-3">
            {jobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                onPolicyClick={handlePolicyClick}
                showPreferences={showPreferences}
                onPolicyMatchClick={handlePolicyMatchClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                {t('common.prev')}
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary btn-sm"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ marginBottom: '8px' }}>{t('jobs.noMatching')}</h3>
          <p className="text-secondary">{t('jobs.tryAdjust')}</p>
        </div>
      )}

      {showPolicyEngineModal && (
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
          onClick={() => setShowPolicyEngineModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '800px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>
                🔍 {isEnglish ? 'Policy Matching Engine Results' : '政策匹配引擎结果'}
              </h3>
              <button
                onClick={() => setShowPolicyEngineModal(false)}
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

            {!policyMatchResults ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div className="loading"></div>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div className="text-sm text-secondary" style={{ marginBottom: '8px' }}>
                      {isEnglish ? 'Total Jobs' : '职位总数'}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1565c0' }}>
                      {policyMatchResults.totalJobs}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div className="text-sm text-secondary" style={{ marginBottom: '8px' }}>
                      {isEnglish ? 'Matched Jobs' : '匹配职位数'}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32' }}>
                      {policyMatchResults.matchedJobs}
                    </div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)',
                    padding: '20px',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div className="text-sm text-secondary" style={{ marginBottom: '8px' }}>
                      {isEnglish ? 'Match Rate' : '匹配率'}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ad1457' }}>
                      {policyMatchResults.matchRate}%
                    </div>
                  </div>
                </div>

                <h4 style={{ marginBottom: '16px' }}>
                  📋 {isEnglish ? 'Matched Policies' : '匹配政策清单'} ({policyMatchResults.matchedPolicies.length})
                </h4>

                {policyMatchResults.matchedPolicies.length === 0 ? (
                  <div className="text-secondary text-center" style={{ padding: '40px' }}>
                    {isEnglish ? 'No matching policies found' : '暂无匹配政策'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {policyMatchResults.matchedPolicies.map((policy, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #a5d6a7',
                          background: '#f1f8e9',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                              {policy.number}
                            </div>
                            <div className="text-sm" style={{ color: '#424242', marginBottom: '4px' }}>
                              {policy.title}
                            </div>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: '#fff3e0',
                              color: '#e65100',
                              fontSize: '11px',
                            }}>
                              {policy.category}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '16px',
                              background: '#c8e6c9',
                              color: '#2e7d32',
                              fontSize: '13px',
                              fontWeight: '600',
                            }}>
                              {policy.jobCount} {isEnglish ? 'jobs' : '个职位'}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs" style={{ color: '#616161', marginTop: '8px' }}>
                          <strong>{isEnglish ? 'Eligible Jobs' : '符合职位'}：</strong>
                          {policy.jobs.slice(0, 3).map((job, jIdx) => (
                            <span key={jIdx} style={{ marginRight: '12px' }}>
                              • {job.title_cn}
                            </span>
                          ))}
                          {policy.jobs.length > 3 && (
                            <span className="text-secondary">
                              +{policy.jobs.length - 3} {isEnglish ? 'more' : '更多'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="divider"></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                onClick={runPolicyMatching}
                className="btn btn-secondary"
              >
                🔄 {isEnglish ? 'Re-run Match' : '重新匹配'}
              </button>
              <button
                onClick={() => setShowPolicyEngineModal(false)}
                className="btn btn-primary"
              >
                {isEnglish ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedJobMatch && (
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
          onClick={() => setSelectedJobForPolicyMatch(null)}
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
                onClick={() => setSelectedJobForPolicyMatch(null)}
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
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2e7d32' }}>
                {selectedJobMatch.job.title_cn}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-sm text-secondary">{isEnglish ? 'Match Score' : '匹配度'}</span>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{selectedJobMatch.matchScore}%</span>
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
                  width: selectedJobMatch.matchScore + '%',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}></div>
              </div>
            </div>

            <h4 style={{ marginBottom: '12px' }}>
              {isEnglish ? 'Matched Policies' : '命中政策明细'} ({selectedJobMatch.matchedPolicies.length})
            </h4>

            {selectedJobMatch.matchedPolicies.length === 0 ? (
              <div className="text-secondary text-center" style={{ padding: '24px' }}>
                {isEnglish ? 'No matching policies found' : '暂无匹配政策'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedJobMatch.matchedPolicies.map((policy, idx) => (
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setSelectedJobForPolicyMatch(null)}
                className="btn btn-primary"
              >
                {isEnglish ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
