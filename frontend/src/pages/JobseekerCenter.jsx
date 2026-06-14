import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../i18n';

const LANGUAGE_OPTIONS = ['中文', '英语', '日语', '韩语', '越南语', '泰语', '印尼语', '马来西亚语', '其他'];
const EDUCATION_OPTIONS = ['高中', '专科', '本科', '硕士', '博士'];

const MENU_ITEMS = [
  { key: 'applications', label: { cn: '我的申请', en: 'My Applications' }, icon: '📋' },
  { key: 'ftz-preferences', label: { cn: '自贸岗偏好设置', en: 'FTZ Preferences' }, icon: '🌴' },
  { key: 'match-results', label: { cn: '匹配结果', en: 'Match Results' }, icon: '🎯' },
  { key: 'favorites', label: { cn: '我的收藏', en: 'Saved Jobs' }, icon: '⭐' },
  { key: 'settings', label: { cn: '个人设置', en: 'Settings' }, icon: '⚙️' }
];

export default function JobseekerCenter() {
  const { user, t, language } = useApp();
  const { t: tFn } = useTranslation(language);
  const isEnglish = language === 'en';
  const [activeTab, setActiveTab] = useState('applications');
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    skills: [],
    languages: [],
    experience_years: '',
    education: '',
    ftz_preferences: {
      tax_benefit: false,
      visa_assistance: false,
      housing_subsidy: false,
      international_experience: false
    },
    expected_salary_min: '',
    expected_salary_max: '',
    resume: ''
  });
  const [ftzPreferencesForm, setFtzPreferencesForm] = useState({
    taxBenefit: [],
    housingSubsidy: [],
    visaAssistance: [],
    otherBenefits: [],
    rcepLanguages: []
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchApplications();
    fetchRecommendedJobs();
    fetchSavedJobs();
    loadFtzPreferencesFromStorage();
    fetchAllJobs();
  }, []);

  useEffect(() => {
    if (allJobs.length > 0 && Object.values(ftzPreferencesForm).some(arr => arr.length > 0)) {
      calculateMatchedJobs();
    }
  }, [ftzPreferencesForm, allJobs]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/jobseekers/profile');
      setProfile(response.data);
      setFormData({
        skills: response.data.skills || [],
        languages: response.data.languages || [],
        experience_years: response.data.experience_years || '',
        education: response.data.education || '',
        ftz_preferences: response.data.ftz_preferences || {
          tax_benefit: false,
          visa_assistance: false,
          housing_subsidy: false,
          international_experience: false
        },
        expected_salary_min: response.data.expected_salary_min || '',
        expected_salary_max: response.data.expected_salary_max || '',
        resume: response.data.resume || ''
      });
      if (response.data.ftz_detailed_preferences) {
        setFtzPreferencesForm(response.data.ftz_detailed_preferences);
      }
    } catch (error) {
      console.error('获取个人资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await api.get('/jobseekers/saved-jobs');
      setSavedJobs(response.data.jobs || []);
    } catch (error) {
      console.error('获取收藏职位失败:', error);
    }
  };

  const fetchAllJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await api.get('/jobs');
      const jobs = response.data.jobs || response.data || [];
      setAllJobs(jobs);
    } catch (error) {
      console.error('获取职位列表失败:', error);
      setAllJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadFtzPreferencesFromStorage = () => {
    try {
      const saved = localStorage.getItem('ftz_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFtzPreferencesForm(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('加载偏好设置失败:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/jobseekers/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('获取申请记录失败:', error);
    }
  };

  const fetchRecommendedJobs = async () => {
    try {
      const response = await api.get('/jobseekers/recommended-jobs');
      setRecommendedJobs(response.data.jobs || []);
    } catch (error) {
      console.error('获取推荐职位失败:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.put('/jobseekers/profile', formData);
      alert('个人资料已保存');
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handlePreferenceChange = (key) => {
    setFormData(prev => ({
      ...prev,
      ftz_preferences: {
        ...prev.ftz_preferences,
        [key]: !prev.ftz_preferences[key]
      }
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      handleSkillToggle(e.target.value.trim());
      e.target.value = '';
    }
  };

  const handleFtzPreferenceToggle = (field, value) => {
    setFtzPreferencesForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSaveFtzPreferences = async () => {
    try {
      localStorage.setItem('ftz_preferences', JSON.stringify(ftzPreferencesForm));
      try {
        await api.put('/jobseekers/ftz-preferences', ftzPreferencesForm);
      } catch (apiError) {
        console.warn('API保存失败，但已保存到本地:', apiError);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('保存失败:', error);
      alert(error.response?.data?.error || (isEnglish ? 'Save failed' : '保存失败'));
    }
  };

  const FOREIGN_LANGUAGES = ['korean', 'japanese', 'thai', 'indonesian', 'vietnamese', 'malay'];
  const HAINAN_CITIES = ['海口', '三亚', 'Haikou', 'Sanya'];

  const checkTaxBenefitMatch = (job) => {
    return job.has_ftz_subsidy === true || (job.salary_min >= 30000 || job.salary >= 30000);
  };

  const checkHousingSubsidyMatch = (job) => {
    const salary = job.salary_min || job.salary || 0;
    return salary >= 20000 && job.is_encouraged_industry === true;
  };

  const checkVisaAssistanceMatch = (job) => {
    const rcepSkills = job.rcep_skills || [];
    const hasForeignLanguage = rcepSkills.some(skill =>
      FOREIGN_LANGUAGES.includes(skill?.toLowerCase?.()) || FOREIGN_LANGUAGES.includes(skill)
    );
    const inHainanCity = HAINAN_CITIES.some(city =>
      job.location?.includes?.(city) || job.city?.includes?.(city)
    );
    return hasForeignLanguage || inHainanCity;
  };

  const checkRcepLanguageMatch = (job, userLanguages) => {
    const jobSkills = (job.rcep_skills || []).map(s => s?.toLowerCase?.() || s);
    const userLangs = (userLanguages || []).map(s => s?.toLowerCase?.() || s);
    return jobSkills.filter(skill => userLangs.includes(skill));
  };

  const calculateMatchScore = (job) => {
    const preferences = ftzPreferencesForm;
    const matches = [];
    let totalPossible = 0;
    let matched = 0;

    if (preferences.taxBenefit?.length > 0) {
      totalPossible++;
      if (checkTaxBenefitMatch(job)) {
        matched++;
        matches.push({
          type: 'taxBenefit',
          label: isEnglish ? 'Tax Benefit' : '税收优惠',
          color: '#22c55e'
        });
      }
    }

    if (preferences.housingSubsidy?.length > 0) {
      totalPossible++;
      if (checkHousingSubsidyMatch(job)) {
        matched++;
        matches.push({
          type: 'housingSubsidy',
          label: isEnglish ? 'Housing Subsidy' : '住房补贴',
          color: '#3b82f6'
        });
      }
    }

    if (preferences.visaAssistance?.length > 0) {
      totalPossible++;
      if (checkVisaAssistanceMatch(job)) {
        matched++;
        matches.push({
          type: 'visaAssistance',
          label: isEnglish ? 'Visa Assistance' : '签证协助',
          color: '#f59e0b'
        });
      }
    }

    if (preferences.rcepLanguages?.length > 0) {
      totalPossible++;
      const languageMatches = checkRcepLanguageMatch(job, preferences.rcepLanguages);
      if (languageMatches.length > 0) {
        matched++;
        matches.push({
          type: 'rcepLanguage',
          label: isEnglish ? `RCEP Language (${languageMatches.length})` : `RCEP语言 (${languageMatches.length})`,
          color: '#8b5cf6'
        });
      }
    }

    const score = totalPossible > 0 ? Math.round((matched / totalPossible) * 100) : 0;

    return {
      job,
      score,
      matches,
      totalPossible,
      matchedCount: matched
    };
  };

  const calculateMatchedJobs = () => {
    const results = allJobs
      .map(job => calculateMatchScore(job))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
    setMatchedJobs(results);
  };

  const getMatchProfile = () => {
    const totalJobs = allJobs.length;
    const matched = matchedJobs.length;
    const matchRate = totalJobs > 0 ? Math.round((matched / totalJobs) * 100) : 0;

    const policyCounts = {};
    matchedJobs.forEach(result => {
      result.matches.forEach(m => {
        policyCounts[m.type] = (policyCounts[m.type] || 0) + 1;
      });
    });

    const topPolicies = Object.entries(policyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => {
        const labels = {
          taxBenefit: isEnglish ? 'Tax Benefit' : '税收优惠',
          housingSubsidy: isEnglish ? 'Housing Subsidy' : '住房补贴',
          visaAssistance: isEnglish ? 'Visa Assistance' : '签证协助',
          rcepLanguage: isEnglish ? 'RCEP Language' : 'RCEP语言',
          otherBenefits: isEnglish ? 'Other Benefits' : '其他福利'
        };
        return { type, label: labels[type] || type, count };
      });

    const suggestions = [];
    const prefs = ftzPreferencesForm;
    if (!prefs.taxBenefit?.length) {
      suggestions.push(isEnglish
        ? 'Add tax benefit preferences to find more high-salary jobs'
        : '添加税收优惠偏好，寻找更多高薪职位');
    }
    if (!prefs.housingSubsidy?.length && !prefs.visaAssistance?.length) {
      suggestions.push(isEnglish
        ? 'Consider housing subsidy or visa assistance preferences'
        : '考虑添加住房补贴或签证协助偏好');
    }
    if (!prefs.rcepLanguages?.length) {
      suggestions.push(isEnglish
        ? 'Add RCEP language skills to unlock more international roles'
        : '添加RCEP语言技能，解锁更多国际化职位');
    }
    if (matchRate < 20) {
      suggestions.push(isEnglish
        ? 'Try expanding your preference criteria'
        : '尝试扩大您的偏好条件');
    }

    return {
      totalMatched: matched,
      matchRate,
      topPolicies,
      suggestions
    };
  };

  const handleQuickApply = async (jobId) => {
    try {
      await api.post('/jobseekers/applications', { job_id: jobId });
      alert(isEnglish ? 'Application submitted!' : '申请已提交！');
    } catch (error) {
      alert(error.response?.data?.error || (isEnglish ? 'Application failed' : '申请失败'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="loading"></div>
      </div>
    );
  }

  const getStatusText = (status) => {
    const statusMap = {
      submitted: { cn: '已投递', en: tFn('jobseeker.statusSubmitted') },
      pending: { cn: '待查看', en: tFn('jobseeker.statusPendingReview') },
      viewed: { cn: '已查看', en: tFn('jobseeker.statusReviewed') },
      accepted: { cn: '已通过', en: tFn('jobseeker.accepted') },
      rejected: { cn: '已拒绝', en: tFn('jobseeker.rejected') }
    };
    return statusMap[status] ? statusMap[status][isEnglish ? 'en' : 'cn'] : status;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'accepted') return 'badge-success';
    if (status === 'rejected') return 'badge-danger';
    if (status === 'submitted') return 'badge-info';
    if (status === 'viewed') return 'badge-primary';
    return 'badge-warning';
  };

  const renderApplicationsTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>
        {isEnglish ? 'My Applications' : '我的申请'}
      </h2>
      {applications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map(app => {
            const badgeClass = getStatusBadgeClass(app.status);
            const statusText = getStatusText(app.status);
            return (
              <div key={app.id} className="card" style={{ padding: '20px', margin: 0 }}>
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <Link to={'/jobs/' + app.job_id} style={{ fontSize: '18px', fontWeight: '600', color: '#212121' }}>
                      {isEnglish ? app.title_en : app.title_cn}
                    </Link>
                    <div className="text-sm text-secondary" style={{ marginTop: '4px' }}>
                      {app.company_name} · {app.salary_min/10000}万-{app.salary_max/10000}万/月 · {app.location}
                    </div>
                    <div className="text-xs text-secondary mt-sm">
                      {isEnglish ? 'Applied At: ' : '申请时间：'}{app.created_at}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <span className={'badge ' + badgeClass}>
                      {statusText}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={'/jobs/' + app.job_id} className="btn btn-secondary btn-sm">
                        {isEnglish ? 'View Job' : '查看职位'}
                      </Link>
                      <button className="btn btn-outline-danger btn-sm">
                        {isEnglish ? 'Withdraw' : '撤销申请'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <h3>{isEnglish ? 'No applications yet' : '暂无申请记录'}</h3>
          <p className="text-secondary">
            {isEnglish ? 'Browse and apply for your desired positions!' : '快去浏览心仪的职位并投递简历吧！'}
          </p>
          <Link to="/jobs" className="btn btn-primary mt-md">
            {isEnglish ? 'Browse Jobs' : '去逛逛职位'}
          </Link>
        </div>
      )}
    </div>
  );

  const renderFtzPreferencesTab = () => {
    const matchProfile = getMatchProfile();
    const formFields = [
      {
        key: 'taxBenefit',
        label: { cn: '税收优惠偏好', en: 'Tax Benefit Preference' },
        options: [
          { value: 'individual_income_tax', label: { cn: '个人所得税优惠', en: 'Individual income tax benefit' } },
          { value: 'corporate_tax_subsidy', label: { cn: '企业税负补贴', en: 'Corporate tax subsidy' } }
        ]
      },
      {
        key: 'housingSubsidy',
        label: { cn: '住房补贴', en: 'Housing Subsidy' },
        options: [
          { value: 'purchase_subsidy', label: { cn: '购房补贴', en: 'Purchase subsidy' } },
          { value: 'rental_subsidy', label: { cn: '租房补贴', en: 'Rental subsidy' } }
        ]
      },
      {
        key: 'visaAssistance',
        label: { cn: '签证协助', en: 'Visa Assistance' },
        options: [
          { value: 'work_visa', label: { cn: '工作签证', en: 'Work visa' } },
          { value: 'permanent_residency', label: { cn: '永久居留', en: 'Permanent residency' } }
        ]
      },
      {
        key: 'otherBenefits',
        label: { cn: '其他福利', en: 'Other Benefits' },
        options: [
          { value: 'children_education', label: { cn: '子女教育', en: 'Children education' } },
          { value: 'healthcare', label: { cn: '医疗保障', en: 'Healthcare' } }
        ]
      },
      {
        key: 'rcepLanguages',
        label: { cn: 'RCEP小语种优先', en: 'RCEP Language Priority' },
        options: [
          { value: 'korean', label: { cn: '韩语', en: 'Korean' } },
          { value: 'japanese', label: { cn: '日语', en: 'Japanese' } },
          { value: 'thai', label: { cn: '泰语', en: 'Thai' } },
          { value: 'indonesian', label: { cn: '印尼语', en: 'Indonesian' } },
          { value: 'vietnamese', label: { cn: '越南语', en: 'Vietnamese' } },
          { value: 'malay', label: { cn: '马来西亚语', en: 'Malay' } }
        ]
      }
    ];

    return (
      <div>
        {saveSuccess && (
          <div
            style={{
              padding: '16px 20px',
              background: '#dcfce7',
              color: '#166534',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            ✓ {isEnglish ? 'Preferences saved successfully!' : '偏好设置已保存成功！'}
          </div>
        )}

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px' }}>
            {isEnglish ? 'My Match Profile' : '我的匹配画像'}
          </h2>
          
          <div className="grid grid-4" style={{ marginBottom: '24px', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#00695c' }}>
                {matchProfile.totalMatched}
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Total Matched Jobs' : '匹配职位总数'}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1d4ed8' }}>
                {matchProfile.matchRate}%
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Match Rate' : '匹配率'}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e' }}>
                {matchProfile.topPolicies?.length || 0}
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Matching Policy Types' : '匹配政策类型'}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #fae8ff, #f5d0fe)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#86198f' }}>
                {allJobs.length}
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Total Available Jobs' : '可用职位总数'}
              </div>
            </div>
          </div>

          {matchProfile.topPolicies.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                {isEnglish ? 'Top Matching Policy Types' : '顶级匹配政策类型'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {matchProfile.topPolicies.map(policy => (
                  <span
                    key={policy.type}
                    className="badge badge-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {policy.label}: {policy.count} {isEnglish ? 'matches' : '个匹配'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matchProfile.suggestions.length > 0 && (
            <div className="card" style={{ padding: '20px', margin: 0, background: '#fef9c3', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', color: '#854d0e' }}>
                💡 {isEnglish ? 'Suggestions to Improve Matching' : '改进匹配的建议'}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#713f12' }}>
                {matchProfile.suggestions.map((suggestion, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('match-results')}
              className="btn btn-primary"
            >
              🎯 {isEnglish ? 'View Match Results' : '查看匹配结果'}
            </button>
            <Link
              to="/jobs?ftz_match=true"
              className="btn btn-outline-primary"
            >
              {isEnglish ? 'View All Matched Jobs' : '去职位列表查看匹配岗位'}
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>
            {isEnglish ? 'FTZ Preferences' : '自贸岗偏好设置'}
          </h2>
          
          {formFields.map(field => (
            <div key={field.key} className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                {field.label[isEnglish ? 'en' : 'cn']}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {field.options.map(option => {
                  const isSelected = ftzPreferencesForm[field.key].includes(option.value);
                  return (
                    <label
                      key={option.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        border: '1px solid ' + (isSelected ? '#00897b' : '#e0e0e0'),
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? '#f0fdfa' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFtzPreferenceToggle(field.key, option.value)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '14px', color: isSelected ? '#00695c' : '#424242' }}>
                        {option.label[isEnglish ? 'en' : 'cn']}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <button onClick={handleSaveFtzPreferences} className="btn btn-primary" style={{ marginTop: '16px' }}>
            {isEnglish ? 'Save Preferences' : '保存偏好设置'}
          </button>
        </div>
      </div>
    );
  };

  const renderFavoritesTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>
        {isEnglish ? 'Saved Jobs' : '我的收藏'}
      </h2>
      {savedJobs.length > 0 ? (
        <div className="grid grid-2">
          {savedJobs.map(job => (
            <div key={job.id} className="card">
              <div className="flex justify-between items-start mb-sm">
                <Link to={'/jobs/' + job.id} style={{ fontSize: '18px', fontWeight: '600', color: '#212121' }}>
                  {isEnglish ? job.title_en : job.title_cn}
                </Link>
                <button className="btn btn-outline-secondary btn-sm">
                  {isEnglish ? 'Unsave' : '取消收藏'}
                </button>
              </div>
              <div className="text-sm text-secondary mb-sm">
                {job.company_name} · {job.salary_min/10000}万-{job.salary_max/10000}万/月
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⭐</div>
          <h3>{isEnglish ? 'No saved jobs yet' : '暂无收藏的职位'}</h3>
          <p className="text-secondary">
            {isEnglish ? 'Click the favorite button when browsing jobs to save here' : '浏览职位时点击收藏按钮，即可保存到这里'}
          </p>
          <Link to="/jobs" className="btn btn-primary mt-md">
            {isEnglish ? 'Browse Jobs' : '去逛逛职位'}
          </Link>
        </div>
      )}
    </div>
  );

  const renderMatchResultsTab = () => {
    const matchProfile = getMatchProfile();

    const getScoreColor = (score) => {
      if (score >= 75) return '#22c55e';
      if (score >= 50) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <div>
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px' }}>
            {isEnglish ? 'Match Results' : '匹配结果'}
          </h2>
          
          <div className="grid grid-4" style={{ marginBottom: '24px', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#00695c' }}>
                {matchProfile.totalMatched}
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Total Matched' : '匹配职位数'}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1d4ed8' }}>
                {matchProfile.matchRate}%
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Match Rate' : '匹配率'}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e' }}>
                {allJobs.length}
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Total Jobs' : '总职位数'}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', margin: 0, textAlign: 'center', background: 'linear-gradient(135deg, #fae8ff, #f5d0fe)' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#86198f' }}>
                {matchProfile.topPolicies?.[0]?.count || 0}
              </div>
              <div className="text-sm text-secondary">
                {isEnglish ? 'Top Policy Matches' : '顶级匹配数'}
              </div>
            </div>
          </div>

          {matchProfile.topPolicies.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                {isEnglish ? 'Top Matching Policy Types' : '顶级匹配政策类型'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {matchProfile.topPolicies.map(policy => (
                  <span
                    key={policy.type}
                    className="badge badge-primary"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {policy.label}: {policy.count} {isEnglish ? 'matches' : '个匹配'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {matchProfile.suggestions.length > 0 && (
            <div className="card" style={{ padding: '20px', margin: 0, background: '#fef9c3' }}>
              <h4 style={{ marginBottom: '12px', color: '#854d0e' }}>
                💡 {isEnglish ? 'Suggestions to Improve Matching' : '改进匹配的建议'}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#713f12' }}>
                {matchProfile.suggestions.map((suggestion, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>
              {isEnglish ? 'Matched Jobs' : '匹配的职位'}
            </h3>
            <Link
              to="/jobs?ftz_match=true"
              className="btn btn-outline-primary btn-sm"
            >
              {isEnglish ? 'View All Matched Jobs' : '去职位列表查看匹配岗位'}
            </Link>
          </div>

          {jobsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading"></div>
            </div>
          ) : matchedJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matchedJobs.map(result => {
                const job = result.job;
                const scoreColor = getScoreColor(result.score);
                return (
                  <div key={job.id} className="card" style={{ padding: '20px', margin: 0 }}>
                    <div className="flex justify-between items-start">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center" style={{ gap: '12px', marginBottom: '8px' }}>
                          <Link
                            to={'/jobs/' + job.id}
                            style={{ fontSize: '18px', fontWeight: '600', color: '#212121' }}
                          >
                            {isEnglish ? job.title_en : job.title_cn}
                          </Link>
                          <div
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              background: scoreColor + '20',
                              color: scoreColor,
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            {result.score}% {isEnglish ? 'Match' : '匹配'}
                          </div>
                        </div>
                        <div className="text-sm text-secondary" style={{ marginBottom: '12px' }}>
                          {job.company_name} · {job.salary_min / 10000}万-{job.salary_max / 10000}万/月 · {job.location}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {result.matches.map((match, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                background: match.color + '20',
                                color: match.color,
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              ✓ {match.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={'/jobs/' + job.id} className="btn btn-secondary btn-sm">
                          {isEnglish ? 'View Details' : '查看详情'}
                        </Link>
                        <button
                          onClick={() => handleQuickApply(job.id)}
                          className="btn btn-primary btn-sm">
                          {isEnglish ? 'Quick Apply' : '快速申请'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
              <h3>{isEnglish ? 'No matched jobs yet' : '暂无匹配职位'}</h3>
              <p className="text-secondary">
                {isEnglish
                  ? 'Set your FTZ preferences to see matched jobs!'
                  : '设置您的自贸港偏好，查看匹配的职位！'}
              </p>
              <button
                onClick={() => setActiveTab('ftz-preferences')}
                className="btn btn-primary mt-md">
                {isEnglish ? 'Set Preferences' : '设置偏好'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>
        {isEnglish ? 'Settings' : '个人设置'}
      </h2>
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚙️</div>
        <h3>{isEnglish ? 'Feature in development...' : '功能开发中...'}</h3>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'applications': return renderApplicationsTab();
      case 'ftz-preferences': return renderFtzPreferencesTab();
      case 'match-results': return renderMatchResultsTab();
      case 'favorites': return renderFavoritesTab();
      case 'settings': return renderSettingsTab();
      default: return renderApplicationsTab();
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {isEnglish ? 'Jobseeker Center' : '求职者中心'}
        </h1>
        <p className="text-secondary">
          {isEnglish
            ? 'Welcome back, ' + (user?.name || '') + '! Explore premium Hainan FTZ jobs'
            : '欢迎回来，' + (user?.name || '') + '！探索海南自贸港优质职位'
          }
        </p>
      </div>

      <div className="grid grid-4" style={{ alignItems: 'flex-start' }}>
        <div style={{ gridColumn: 'span 1' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #00897b, #00695c)',
              color: 'white',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                marginBottom: '12px'
              }}>
                {user?.name?.charAt(0) || '👤'}
              </div>
              <h3 style={{ marginBottom: '4px' }}>{user?.name}</h3>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>{user?.email}</p>
            </div>
            <div style={{ padding: '16px' }}>
              {MENU_ITEMS.map(item => (
                <div
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    background: activeTab === item.key ? '#e0f2f1' : 'transparent',
                    color: activeTab === item.key ? '#00695c' : '#424242',
                    fontWeight: activeTab === item.key ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{item.icon}</span>
                  {item.label[isEnglish ? 'en' : 'cn']}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
