import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store.js';
import { jobAPI } from '../api.js';

export default function PostJob() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [benefitTypes, setBenefitTypes] = useState([]);

  const [form, setForm] = useState({
    title: '',
    salary_min: '',
    salary_max: '',
    location: '',
    position_level: 'junior',
    description: '',
    requirements: '',
    reward_type: 'none',
    reward_amount: '',
    reward_days: '',
    benefits: []
  });

  useEffect(() => {
    fetchBenefitTypes();
  }, []);

  const fetchBenefitTypes = async () => {
    setLoading(true);
    try {
      const res = await jobAPI.benefitTypes();
      setBenefitTypes(res.data.types || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取福利类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleBenefitToggle = (benefitType) => {
    const currentBenefits = form.benefits || [];
    const exists = currentBenefits.find(b => b.benefit_type === benefitType);

    if (exists) {
      setForm({
        ...form,
        benefits: currentBenefits.filter(b => b.benefit_type !== benefitType)
      });
    } else {
      setForm({
        ...form,
        benefits: [...currentBenefits, { benefit_type: benefitType, benefit_value: '' }]
      });
    }
  };

  const handleBenefitValueChange = (benefitType, value) => {
    setForm({
      ...form,
      benefits: form.benefits.map(b =>
        b.benefit_type === benefitType ? { ...b, benefit_value: value } : b
      )
    });
  };

  const isBenefitSelected = (benefitType) => {
    return form.benefits?.some(b => b.benefit_type === benefitType);
  };

  const getBenefitValue = (benefitType) => {
    return form.benefits?.find(b => b.benefit_type === benefitType)?.benefit_value || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('请输入职位名称');
      return;
    }
    if (!form.salary_min || !form.salary_max) {
      alert('请输入薪资范围');
      return;
    }
    if (parseInt(form.salary_min) >= parseInt(form.salary_max)) {
      alert('最低薪资必须小于最高薪资');
      return;
    }
    if (!form.location.trim()) {
      alert('请输入工作城市');
      return;
    }
    if (!form.description.trim()) {
      alert('请输入职位描述');
      return;
    }
    if (form.reward_type === 'cash' && !form.reward_amount) {
      alert('请输入现金奖励金额');
      return;
    }
    if (form.reward_type === 'vacation' && !form.reward_days) {
      alert('请输入假期奖励天数');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const jobData = {
        title: form.title.trim(),
        salary_min: parseInt(form.salary_min),
        salary_max: parseInt(form.salary_max),
        location: form.location.trim(),
        position_level: form.position_level,
        description: form.description.trim(),
        requirements: form.requirements.trim() || null,
        reward_type: form.reward_type,
        reward_amount: form.reward_type === 'cash' ? parseFloat(form.reward_amount) : null,
        reward_days: form.reward_type === 'vacation' ? parseInt(form.reward_days) : null,
        benefits: form.benefits.filter(b => b.benefit_type)
      };

      await jobAPI.create(jobData);
      setSuccess('职位发布成功！');
      setTimeout(() => {
        navigate('/jobs');
      }, 2000);
    } catch (e) {
      setError(e.response?.data?.error || '发布职位失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">💼 发布职位</h1>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginBottom: 20, color: '#333' }}>📝 基本信息</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">职位名称 *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={form.title}
                onChange={handleInputChange}
                placeholder="如：高级前端开发工程师"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">最低薪资 (K) *</label>
              <input
                type="number"
                name="salary_min"
                className="form-input"
                value={form.salary_min}
                onChange={handleInputChange}
                placeholder="如：20"
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">最高薪资 (K) *</label>
              <input
                type="number"
                name="salary_max"
                className="form-input"
                value={form.salary_max}
                onChange={handleInputChange}
                placeholder="如：40"
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">工作城市 *</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={form.location}
                onChange={handleInputChange}
                placeholder="如：北京"
              />
            </div>
            <div className="form-group">
              <label className="form-label">职位级别 *</label>
              <select
                name="position_level"
                className="form-select"
                value={form.position_level}
                onChange={handleInputChange}
              >
                <option value="junior">初级</option>
                <option value="middle">中级</option>
                <option value="senior">高级</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">职位描述 *</label>
            <textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleInputChange}
              placeholder="请详细描述岗位职责..."
              rows={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">任职要求</label>
            <textarea
              name="requirements"
              className="form-textarea"
              value={form.requirements}
              onChange={handleInputChange}
              placeholder="请描述任职要求（可选）..."
              rows={4}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20, color: '#333' }}>🎁 内推奖励</h3>

          <div className="form-group">
            <label className="form-label">奖励类型</label>
            <div className="role-selector">
              <div
                className={`role-option ${form.reward_type === 'none' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, reward_type: 'none' })}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🚫</div>
                <div>无奖励</div>
              </div>
              <div
                className={`role-option ${form.reward_type === 'cash' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, reward_type: 'cash' })}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>💰</div>
                <div>现金奖励</div>
              </div>
              <div
                className={`role-option ${form.reward_type === 'vacation' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, reward_type: 'vacation' })}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>🏖️</div>
                <div>假期奖励</div>
              </div>
            </div>
          </div>

          {form.reward_type === 'cash' && (
            <div className="form-group">
              <label className="form-label">奖励金额 (元) *</label>
              <input
                type="number"
                name="reward_amount"
                className="form-input"
                value={form.reward_amount}
                onChange={handleInputChange}
                placeholder="如：10000"
                min="1"
              />
            </div>
          )}

          {form.reward_type === 'vacation' && (
            <div className="form-group">
              <label className="form-label">奖励天数 (天) *</label>
              <input
                type="number"
                name="reward_days"
                className="form-input"
                value={form.reward_days}
                onChange={handleInputChange}
                placeholder="如：5"
                min="1"
              />
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20, color: '#333' }}>🏆 福利待遇</h3>

          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
              选择该职位提供的福利待遇（可多选）
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {benefitTypes.map((bt, index) => (
                <div
                  key={index}
                  className={`benefit-badge ${isBenefitSelected(bt) ? 'highlight' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '8px 16px',
                    fontSize: 14,
                    border: isBenefitSelected(bt) ? '2px solid #52c41a' : '2px solid transparent'
                  }}
                  onClick={() => handleBenefitToggle(bt)}
                >
                  {isBenefitSelected(bt) ? '✓ ' : ''}{bt}
                </div>
              ))}
            </div>
          </div>

          {form.benefits && form.benefits.length > 0 && (
            <div className="card" style={{ background: '#fafafa', marginBottom: 0 }}>
              <h4 style={{ marginBottom: 16, color: '#333' }}>福利待遇详情</h4>
              {form.benefits.map((benefit, index) => (
                <div key={index} className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ marginBottom: 4 }}>
                    {benefit.benefit_type}（可选填写具体说明）
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={getBenefitValue(benefit.benefit_type)}
                    onChange={(e) => handleBenefitValueChange(benefit.benefit_type, e.target.value)}
                    placeholder={`请输入${benefit.benefit_type}的具体说明...`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting}
          >
            {submitting ? '发布中...' : '✓ 发布职位'}
          </button>
        </div>
      </form>
    </div>
  );
}
