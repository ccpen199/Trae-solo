import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RCEP_SKILL_OPTIONS = [
  '英语', '日语', '韩语', '越南语', '泰语', '印尼语', '马来西亚语', '缅甸语', '老挝语', '柬埔寨语',
  'RCEP原产地规则解读', '跨境电商运营', '国际贸易', '国际物流', '国际结算', '跨境支付', '海关报关'
];

const TAG_OPTIONS = [
  '跨境贸易', '游艇经济', '离岸数据', '国际航运', '旅游文化', '医疗健康', '金融服务', '教育服务',
  '高薪', '弹性工作', '年终奖金', '五险一金', '带薪年假', '员工旅游', '节日福利', '定期体检'
];

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: '全职' },
  { value: 'part-time', label: '兼职' },
  { value: 'contract', label: '合同' },
  { value: 'internship', label: '实习' },
];

export default function JobPost() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [activeLang, setActiveLang] = useState('cn');
  const [loading, setLoading] = useState(false);
  const [policyMatchResult, setPolicyMatchResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title_cn: '',
    title_en: '',
    description_cn: '',
    description_en: '',
    requirements_cn: '',
    requirements_en: '',
    category: '',
    salary_min: '',
    salary_max: '',
    location: '',
    employment_type: 'full-time',
    tags: [],
    rcep_skills: [],
    has_ftz_subsidy: false,
    subsidy_policy_ref: '',
    policy_basis: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/industry-catalog');
      setCategories(response.data);
    } catch (error) {
      console.error('获取行业分类失败:', error);
    }
  };

  useEffect(() => {
    if (formData.category && (formData.salary_max || formData.salary_min)) {
      matchPolicies();
    }
  }, [formData.category, formData.salary_max, formData.salary_min]);

  const matchPolicies = async () => {
    try {
      const response = await api.post('/policies/match-policy-for-company', {
        industryCode: formData.category,
        salaryRange: {
          min: formData.salary_min ? parseInt(formData.salary_min) : null,
          max: formData.salary_max ? parseInt(formData.salary_max) : null,
        },
        jobCategory: formData.category,
      });
      setPolicyMatchResult(response.data);
      
      if (response.data.matchedPolicies.length > 0) {
        setFormData(prev => ({
          ...prev,
          has_ftz_subsidy: true,
          subsidy_policy_ref: response.data.matchedPolicies.map(p => p.policy_number).join(','),
          policy_basis: response.data.matchedPolicies.map(p => `${p.title_cn}：${p.matchReason}`).join('\n'),
        }));
      }
    } catch (error) {
      console.error('政策匹配失败:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      rcep_skills: prev.rcep_skills.includes(skill)
        ? prev.rcep_skills.filter(s => s !== skill)
        : [...prev.rcep_skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/jobs', {
        ...formData,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
      });
      alert('职位发布成功！请等待管理员审核。');
      navigate('/company');
    } catch (error) {
      alert(error.response?.data?.error || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.title_cn && formData.description_cn && formData.category;
    }
    return true;
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>发布新职位</h1>
        <p className="text-secondary">双语发布向导 · 政策智能匹配 · 自动同步就业局备案</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: s === step ? '#00897b' : s < step ? '#4caf50' : '#e0e0e0',
              color: s <= step ? 'white' : '#9e9e9e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
            }}>
              {s < step ? '✓' : s}
            </div>
            <span style={{
              marginLeft: '8px',
              color: s <= step ? '#00695c' : '#9e9e9e',
              fontWeight: s === step ? '600' : '400',
            }}>
              {s === 1 ? '基本信息' : s === 2 ? '详细描述' : '政策与发布'}
            </span>
            {s < 3 && <div style={{ width: '80px', height: '2px', background: s < step ? '#4caf50' : '#e0e0e0', margin: '0 12px' }}></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-3" style={{ alignItems: 'flex-start' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div className="bilingual-tabs">
              <div
                className={`bilingual-tab ${activeLang === 'cn' ? 'active' : ''}`}
                onClick={() => setActiveLang('cn')}
              >
                🇨🇳 中文内容
              </div>
              <div
                className={`bilingual-tab ${activeLang === 'en' ? 'active' : ''}`}
                onClick={() => setActiveLang('en')}
              >
                🇺🇸 English
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  {activeLang === 'cn' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">职位名称<span className="required">*</span></label>
                        <input
                          type="text"
                          name="title_cn"
                          value={formData.title_cn}
                          onChange={handleInputChange}
                          placeholder="例如：游艇设计师、跨境数据合规专员"
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">所属行业<span className="required">*</span></label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="form-select"
                          required
                        >
                          <option value="">请选择行业分类</option>
                          {categories.map(cat => (
                            <option key={cat.code} value={cat.code}>
                              {cat.is_encouraged ? '★ ' : ''}{cat.name_cn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label">薪资下限（元/月）</label>
                          <input
                            type="number"
                            name="salary_min"
                            value={formData.salary_min}
                            onChange={handleInputChange}
                            placeholder="例如：15000"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">薪资上限（元/月）</label>
                          <input
                            type="number"
                            name="salary_max"
                            value={formData.salary_max}
                            onChange={handleInputChange}
                            placeholder="例如：30000"
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="grid grid-2">
                        <div className="form-group">
                          <label className="form-label">工作地点</label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="例如：海口市江东新区"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">用工类型</label>
                          <select
                            name="employment_type"
                            value={formData.employment_type}
                            onChange={handleInputChange}
                            className="form-select"
                          >
                            {EMPLOYMENT_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">职位标签</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {TAG_OPTIONS.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagToggle(tag)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '16px',
                                border: '1px solid ' + (formData.tags.includes(tag) ? '#00897b' : '#e0e0e0'),
                                background: formData.tags.includes(tag) ? '#e0f2f1' : 'white',
                                color: formData.tags.includes(tag) ? '#00695c' : '#616161',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">RCEP 相关技能要求</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {RCEP_SKILL_OPTIONS.map(skill => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleSkillToggle(skill)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '16px',
                                border: '1px solid ' + (formData.rcep_skills.includes(skill) ? '#ff8a65' : '#e0e0e0'),
                                background: formData.rcep_skills.includes(skill) ? '#fff3e0' : 'white',
                                color: formData.rcep_skills.includes(skill) ? '#e65100' : '#616161',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Job Title (English)</label>
                        <input
                          type="text"
                          name="title_en"
                          value={formData.title_en}
                          onChange={handleInputChange}
                          placeholder="e.g., Yacht Designer, Cross-border Data Compliance Specialist"
                          className="form-input"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  {activeLang === 'cn' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">职位描述<span className="required">*</span></label>
                        <textarea
                          name="description_cn"
                          value={formData.description_cn}
                          onChange={handleInputChange}
                          placeholder="详细描述职位职责、工作内容、团队介绍等"
                          className="form-textarea"
                          rows={8}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">任职要求</label>
                        <textarea
                          name="requirements_cn"
                          value={formData.requirements_cn}
                          onChange={handleInputChange}
                          placeholder="学历要求、工作经验、技能要求等"
                          className="form-textarea"
                          rows={6}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Job Description (English)</label>
                        <textarea
                          name="description_en"
                          value={formData.description_en}
                          onChange={handleInputChange}
                          placeholder="Describe responsibilities, work content, team introduction, etc."
                          className="form-textarea"
                          rows={8}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Requirements (English)</label>
                        <textarea
                          name="requirements_en"
                          value={formData.requirements_en}
                          onChange={handleInputChange}
                          placeholder="Education requirements, work experience, skills, etc."
                          className="form-textarea"
                          rows={6}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  {policyMatchResult && (
                    <div className="alert alert-success" style={{ marginBottom: '24px' }}>
                      <strong>🎉 政策匹配引擎已为您匹配到以下政策：</strong>
                      <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                        {policyMatchResult.matchedPolicies.map((policy, index) => (
                          <li key={index} style={{ marginBottom: '8px' }}>
                            <strong>{policy.policy_number}</strong> - {policy.title_cn}
                            <div className="text-sm text-secondary">{policy.matchReason}</div>
                          </li>
                        ))}
                      </ul>
                      {policyMatchResult.recommendations && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #a5d6a7' }}>
                          <strong>💡 建议：</strong>
                          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            {policyMatchResult.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="has_ftz_subsidy"
                        checked={formData.has_ftz_subsidy}
                        onChange={handleInputChange}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span className="font-medium">此岗位享受自贸港专项补贴</span>
                    </label>
                    <p className="text-xs text-secondary" style={{ marginTop: '4px', marginLeft: '26px' }}>
                      勾选后将在职位详情页展示相关政策依据
                    </p>
                  </div>

                  {formData.has_ftz_subsidy && (
                    <>
                      <div className="form-group">
                        <label className="form-label">政策依据文号</label>
                        <input
                          type="text"
                          name="subsidy_policy_ref"
                          value={formData.subsidy_policy_ref}
                          onChange={handleInputChange}
                          placeholder="例如：财税〔2020〕32号,琼办发〔2019〕41号"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">政策说明</label>
                        <textarea
                          name="policy_basis"
                          value={formData.policy_basis}
                          onChange={handleInputChange}
                          placeholder="详细说明适用的政策内容"
                          className="form-textarea"
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  <div className="alert alert-info">
                    <strong>📋 就业局备案说明：</strong>
                    职位审核通过后，系统将自动对接海南省就业局岗位备案系统，实现招聘数据实时回传。
                  </div>
                </>
              )}

              <div className="flex justify-between" style={{ marginTop: '32px' }}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(s => s - 1)}
                    className="btn btn-secondary"
                  >
                    上一步
                  </button>
                ) : (
                  <div></div>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep(s => s + 1)}
                    className="btn btn-primary"
                    disabled={!canProceed()}
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? '提交中...' : '发布职位'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <h4 style={{ marginBottom: '16px' }}>💡 发布指南</h4>
            <ul className="text-sm" style={{ paddingLeft: '20px', lineHeight: '2', color: '#616161' }}>
              <li>填写准确的职位信息和薪资范围</li>
              <li>双语内容可提高国际人才关注度</li>
              <li>RCEP技能标签有助于精准匹配</li>
              <li>系统自动匹配自贸港政策福利</li>
              <li>审核通过后自动备案到就业局</li>
            </ul>
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '12px' }}>🏆 鼓励类产业</h4>
            <p className="text-sm text-secondary" style={{ lineHeight: '1.8' }}>
              属于海南自贸港鼓励类产业目录的企业，可享受：
            </p>
            <ul className="text-sm" style={{ paddingLeft: '20px', lineHeight: '2', color: '#2e7d32', marginTop: '8px' }}>
              <li>企业所得税减按15%征收</li>
              <li>高端人才个税15%优惠</li>
              <li>人才落户补贴优先</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
