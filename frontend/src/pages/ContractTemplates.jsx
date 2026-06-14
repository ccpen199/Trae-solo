import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

const TEMPLATES = [
  {
    id: 1,
    nameCn: '全职劳动合同（双语标准版）',
    nameEn: 'Full-time Labor Contract (Bilingual Standard)',
    category: 'fulltime',
    language: 'bilingual',
    scenarioCn: '适用于海南自贸港企业招聘本地全职员工，包含社保、公积金、自贸港补贴等专项条款',
    scenarioEn: 'For full-time local employees in Hainan FTP enterprises, includes social insurance, housing fund, and FTP subsidy clauses',
  },
  {
    id: 2,
    nameCn: '外籍员工劳动合同（中英双语）',
    nameEn: 'Foreign Employee Contract (CN-EN Bilingual)',
    category: 'foreign',
    language: 'bilingual',
    scenarioCn: '适用于招聘外籍员工，包含工作许可、签证支持、个税优惠等涉外专项条款',
    scenarioEn: 'For foreign employees, includes work permit, visa support, and tax incentive clauses',
  },
  {
    id: 3,
    nameCn: 'RCEP人才聘用协议（多语种版）',
    nameEn: 'RCEP Talent Employment Agreement (Multilingual)',
    category: 'rcep',
    language: 'bilingual',
    scenarioCn: '适用于RCEP成员国人才引进，包含跨境社保、职业资格互认、出入境便利条款',
    scenarioEn: 'For RCEP country talents, includes cross-border social security, qualification mutual recognition, and entry-exit facilitation clauses',
  },
  {
    id: 4,
    nameCn: '兼职劳务协议（中英文）',
    nameEn: 'Part-time Service Agreement (CN-EN)',
    category: 'parttime',
    language: 'bilingual',
    scenarioCn: '适用于灵活用工、兼职岗位，包含劳务报酬、工作时间、保密义务等条款',
    scenarioEn: 'For flexible employment and part-time positions, includes service remuneration, working hours, and confidentiality clauses',
  },
  {
    id: 5,
    nameCn: '劳务派遣协议（涉外版）',
    nameEn: 'Labor Dispatch Agreement (Foreign-related)',
    category: 'dispatch',
    language: 'bilingual',
    scenarioCn: '适用于涉外劳务派遣用工，包含派遣期限、工作岗位、劳动保护等三方权利义务条款',
    scenarioEn: 'For foreign-related labor dispatch, includes dispatch period, position, labor protection, and tripartite rights and obligations clauses',
  },
  {
    id: 6,
    nameCn: '高端人才聘用合同（自贸港专项版）',
    nameEn: 'High-end Talent Contract (FTP Special)',
    category: 'highend',
    language: 'bilingual',
    scenarioCn: '适用于自贸港高端紧缺人才，包含15%个税优惠、住房补贴、子女教育等专项福利条款',
    scenarioEn: 'For high-end and urgently needed talents in FTP, includes 15% tax incentive, housing subsidy, children education and other special welfare clauses',
  },
];

const CATEGORIES = [
  { key: 'all', nameCn: '全部', nameEn: 'All' },
  { key: 'fulltime', nameCn: '全职', nameEn: 'Full-time' },
  { key: 'parttime', nameCn: '兼职', nameEn: 'Part-time' },
  { key: 'dispatch', nameCn: '劳务派遣', nameEn: 'Labor Dispatch' },
  { key: 'foreign', nameCn: '外籍员工', nameEn: 'Foreign Employee' },
];

const LANGUAGES = [
  { key: 'all', nameCn: '全部语言', nameEn: 'All Languages' },
  { key: 'cn', nameCn: '中文', nameEn: 'Chinese' },
  { key: 'en', nameCn: '英文', nameEn: 'English' },
  { key: 'bilingual', nameCn: '双语', nameEn: 'Bilingual' },
];

function ContractTemplates() {
  const { user, language } = useApp();
  const isEnglish = language === 'en';
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '',
    position: '',
    salary: '',
    contractPeriod: '',
    companyName: '',
  });

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(template => {
      const matchSearch = !searchKeyword ||
        template.nameCn.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        template.nameEn.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchLanguage = selectedLanguage === 'all' || template.language === selectedLanguage;
      return matchSearch && matchCategory && matchLanguage;
    });
  }, [searchKeyword, selectedCategory, selectedLanguage]);

  const getCategoryBadge = (category) => {
    const badges = {
      fulltime: { className: 'badge badge-primary', textCn: '全职', textEn: 'Full-time' },
      parttime: { className: 'badge badge-info', textCn: '兼职', textEn: 'Part-time' },
      dispatch: { className: 'badge badge-warning', textCn: '劳务派遣', textEn: 'Dispatch' },
      foreign: { className: 'badge badge-success', textCn: '外籍员工', textEn: 'Foreign' },
      rcep: { className: 'badge badge-purple', textCn: 'RCEP人才', textEn: 'RCEP Talent' },
      highend: { className: 'badge badge-danger', textCn: '高端人才', textEn: 'High-end' },
    };
    return badges[category] || { className: 'badge', textCn: category, textEn: category };
  };

  const getLanguageBadge = (lang) => {
    const badges = {
      cn: { className: 'badge tag-primary', textCn: '中文', textEn: 'Chinese' },
      en: { className: 'badge tag-accent', textCn: '英文', textEn: 'English' },
      bilingual: { className: 'badge badge-success', textCn: '双语', textEn: 'Bilingual' },
    };
    return badges[lang] || { className: 'badge', textCn: lang, textEn: lang };
  };

  const handleGenerateClick = (template) => {
    setSelectedTemplate(template);
    setFormData({
      employeeName: '',
      position: '',
      salary: '',
      contractPeriod: '',
      companyName: user?.company_name || user?.name || '',
    });
    setShowSuccess(false);
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateContract = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowModal(false);
    }, 2000);
  };

  const handlePreview = (template) => {
    alert(isEnglish 
      ? `Preview: ${template.nameEn}` 
      : `预览：${template.nameCn}`);
  };

  const handleDownload = (template) => {
    alert(isEnglish 
      ? `Downloading: ${template.nameEn}` 
      : `正在下载：${template.nameCn}`);
  };

  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #00695c 0%, #00897b 50%, #26a69a 100%)',
        color: 'white',
        padding: '60px 0',
      }}>
        <div className="container">
          <h1 style={{ fontSize: '36px', marginBottom: '12px', fontWeight: '700' }}>
            {isEnglish ? '📑 Foreign-related Labor Contract Templates' : '📑 涉外劳动合同模板库'}
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.9, maxWidth: '800px' }}>
            {isEnglish 
              ? 'Professional bilingual contract templates for Hainan FTP enterprises, covering full-time, part-time, foreign employees, RCEP talents and other scenarios, supporting one-click generation'
              : '海南自贸港企业专属专业双语合同模板，涵盖全职、兼职、外籍员工、RCEP人才等多种场景，支持一键生成'}
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div className="grid grid-3 gap-16">
            <div>
              <label className="form-label">
                {isEnglish ? 'Search by Template Name' : '搜索模板名称'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={isEnglish ? 'Enter template name...' : '请输入模板名称...'}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">
                {isEnglish ? 'Category' : '分类筛选'}
              </label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>
                    {isEnglish ? cat.nameEn : cat.nameCn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">
                {isEnglish ? 'Language' : '语言筛选'}
              </label>
              <select
                className="form-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.key} value={lang.key}>
                    {isEnglish ? lang.nameEn : lang.nameCn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-2 gap-20" style={{ marginBottom: '40px' }}>
          {filteredTemplates.map(template => {
            const catBadge = getCategoryBadge(template.category);
            const langBadge = getLanguageBadge(template.language);

            return (
              <div
                key={template.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className={catBadge.className}>
                    {isEnglish ? catBadge.textEn : catBadge.textCn}
                  </span>
                  <span className={langBadge.className}>
                    {isEnglish ? langBadge.textEn : langBadge.textCn}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#263238', marginBottom: '4px' }}>
                  {isEnglish ? template.nameEn : template.nameCn}
                </h3>
                <p style={{ fontSize: '13px', color: '#78909c', fontStyle: 'italic', marginBottom: '12px' }}>
                  {isEnglish ? template.nameCn : template.nameEn}
                </p>

                <p style={{ fontSize: '14px', color: '#546e7a', lineHeight: 1.6, marginBottom: '16px', flex: 1 }}>
                  {isEnglish ? template.scenarioEn : template.scenarioCn}
                </p>

                <div style={{ borderTop: '1px solid #eceff1', paddingTop: '16px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handlePreview(template)}
                    >
                      {isEnglish ? '👁️ Preview' : '👁️ 预览'}
                    </button>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleDownload(template)}
                    >
                      {isEnglish ? '⬇️ Download' : '⬇️ 下载'}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleGenerateClick(template)}
                      style={{ marginLeft: 'auto' }}
                    >
                      {isEnglish ? '⚡ Generate' : '⚡ 一键生成'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#90a4ae' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📑</div>
            <p>{isEnglish ? 'No matching templates found' : '暂无匹配的合同模板'}</p>
          </div>
        )}
      </div>

      {showModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600 }}>
                {isEnglish ? '⚡ Generate Contract' : '⚡ 一键生成合同'}
              </h3>
              <button className="btn btn-text" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ background: '#e8f5e9', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#2e7d32', margin: 0 }}>
                <strong>{isEnglish ? 'Template:' : '当前模板：'}</strong>
                <br />
                {isEnglish ? selectedTemplate.nameEn : selectedTemplate.nameCn}
              </p>
            </div>

            {showSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                {isEnglish 
                  ? '✅ Contract generated successfully! The document has been sent to your email.' 
                  : '✅ 合同生成成功！文档已发送至您的邮箱。'}
              </div>
            )}

            <form onSubmit={handleGenerateContract}>
              <div className="grid grid-2 gap-16">
                <div>
                  <label className="form-label">
                    {isEnglish ? 'Employee Name' : '员工姓名'}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={isEnglish ? 'Enter employee name' : '请输入员工姓名'}
                    value={formData.employeeName}
                    onChange={(e) => handleFormChange('employeeName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">
                    {isEnglish ? 'Position' : '工作岗位'}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={isEnglish ? 'Enter position' : '请输入工作岗位'}
                    value={formData.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">
                    {isEnglish ? 'Salary (CNY/month)' : '薪资（元/月）'}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder={isEnglish ? 'Enter monthly salary' : '请输入月薪资'}
                    value={formData.salary}
                    onChange={(e) => handleFormChange('salary', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">
                    {isEnglish ? 'Contract Period' : '合同期限'}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={isEnglish ? 'e.g., 1 year, 3 years' : '如：1年、3年'}
                    value={formData.contractPeriod}
                    onChange={(e) => handleFormChange('contractPeriod', e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    {isEnglish ? 'Company Name' : '公司名称'}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder={isEnglish ? 'Enter company name' : '请输入公司名称'}
                    value={formData.companyName}
                    onChange={(e) => handleFormChange('companyName', e.target.value)}
                  />
                  {user && (
                    <p style={{ fontSize: '12px', color: '#78909c', marginTop: '4px' }}>
                      {isEnglish ? '✓ Auto-filled from your profile' : '✓ 已从您的资料自动填充'}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  {isEnglish ? 'Cancel' : '取消'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={showSuccess}
                >
                  {showSuccess 
                    ? (isEnglish ? 'Generated ✓' : '已生成 ✓')
                    : (isEnglish ? '📄 Generate Contract' : '📄 生成合同')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractTemplates;
