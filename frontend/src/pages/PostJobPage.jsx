import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../utils/api.js';

function PostJobPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    industry: '餐饮',
    salary_min: '',
    salary_max: '',
    work_address: '',
    arrival_time: '当日',
    requirements: '',
    benefits: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [suspiciousWarning, setSuspiciousWarning] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入职位名称';
    }

    if (!formData.salary_min || parseInt(formData.salary_min) <= 0) {
      newErrors.salary_min = '请输入有效的最低薪资';
    }

    if (!formData.salary_max || parseInt(formData.salary_max) <= 0) {
      newErrors.salary_max = '请输入有效的最高薪资';
    }

    if (parseInt(formData.salary_min) > parseInt(formData.salary_max)) {
      newErrors.salary_max = '最高薪资不能低于最低薪资';
    }

    if (!formData.work_address.trim()) {
      newErrors.work_address = '请输入实际工作地址';
    } else {
      const addressPattern = /.*[路街道号层室].*/;
      if (!addressPattern.test(formData.work_address) || formData.work_address.length < 10) {
        newErrors.work_address = '实际工作地址必须精确到门牌号，如"北京市朝阳区XX路XX号XX大厦X层"';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await jobsAPI.create({
        ...formData,
        salary_min: parseInt(formData.salary_min),
        salary_max: parseInt(formData.salary_max)
      });

      if (res.data.is_suspicious) {
        setSuspiciousWarning(res.data.suspicious_reason);
      } else {
        alert('职位发布成功！');
        navigate('/company/applications');
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.error || '发布失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPublish = () => {
    setSuspiciousWarning(null);
    alert('职位已发布，系统已标记风险预警，求职者将看到提示');
    navigate('/company/applications');
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <h2>📝 发布新职位</h2>

      {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

      <div className="alert alert-warning">
        <strong>⚠️ 重要提示：</strong> 为保障求职者权益，发布职位必须填写
        <strong> 实际工作地址（精确到门牌号）</strong> 和 <strong>到岗时效</strong>，
        系统将对高薪低门槛职位自动进行风险预警。
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label>职位名称 <span className="required">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="如：奶茶店店员、快递分拣员"
            />
            {errors.title && <div className="error-text">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label>所属行业 <span className="required">*</span></label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            >
              <option value="餐饮">餐饮</option>
              <option value="零售">零售</option>
              <option value="物流">物流</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>最低薪资（元/月） <span className="required">*</span></label>
            <input
              type="number"
              value={formData.salary_min}
              onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
              placeholder="4500"
            />
            {errors.salary_min && <div className="error-text">{errors.salary_min}</div>}
          </div>

          <div className="form-group">
            <label>最高薪资（元/月） <span className="required">*</span></label>
            <input
              type="number"
              value={formData.salary_max}
              onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
              placeholder="6500"
            />
            {errors.salary_max && <div className="error-text">{errors.salary_max}</div>}
          </div>
        </div>

        <div className="form-group">
          <label>实际工作地址（精确到门牌号） <span className="required">*</span></label>
          <input
            type="text"
            value={formData.work_address}
            onChange={(e) => setFormData({ ...formData, work_address: e.target.value })}
            placeholder="北京市朝阳区朝阳北路101号朝阳大悦城B1层01号"
          />
          <div className="form-hint">
            必须包含省市区、路名、门牌号、楼层/房间号，如"广东省深圳市南山区科技园南区科苑路1号顺丰大厦1层"
          </div>
          {errors.work_address && <div className="error-text">{errors.work_address}</div>}
        </div>

        <div className="form-group">
          <label>到岗时效 <span className="required">*</span></label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['当日', '3日内', '一周内'].map(time => (
              <label key={time} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="arrival_time"
                  value={time}
                  checked={formData.arrival_time === time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                />
                {time === '当日' && '⚡ '}{time === '3日内' && '📅 '}{time === '一周内' && '🗓️ '}{time}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>职位要求</label>
          <textarea
            rows="3"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="如：18-35岁，初中以上学历，身体健康，有相关经验优先..."
            style={{ fontFamily: 'inherit' }}
          />
          <div className="form-hint">
            提示：如果填写"无经验可培训"、"学历不限"等低门槛要求，同时薪资明显高于行业平均，系统将自动标记为风险职位
          </div>
        </div>

        <div className="form-group">
          <label>福利待遇</label>
          <textarea
            rows="3"
            value={formData.benefits}
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            placeholder="五险一金、包吃、包住、月度奖金、年假..."
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
          disabled={loading}
        >
          {loading ? '发布中...' : '立即发布职位'}
        </button>
      </form>

      {suspiciousWarning && (
        <div className="modal-overlay" onClick={() => setSuspiciousWarning(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ 虚假职位风险预警</h3>
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              {suspiciousWarning}
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              该职位已被系统识别为高风险虚假职位。如您确认信息真实有效，可以继续发布，但职位将被标记风险预警，
              同时平台运营人员会进行人工审核。
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSuspiciousWarning(null)}
              >
                返回修改
              </button>
              <button
                className="btn btn-warning"
                onClick={handleConfirmPublish}
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostJobPage;
