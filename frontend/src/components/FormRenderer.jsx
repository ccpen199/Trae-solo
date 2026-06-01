import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function FormRenderer({ appId, formId, onSubmit, mode = 'create' }) {
  const [formSchema, setFormSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForm();
  }, [appId, formId]);

  const loadForm = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/forms/${formId}`);
      setFormSchema(res.data);
      const initialData = {};
      res.data.schema_config?.forEach(field => {
        initialData[field.props.fieldKey] = field.props.defaultValue || '';
      });
      setFormData(initialData);
    } catch (err) {
      console.error('加载表单失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey, value) => {
    setFormData({ ...formData, [fieldKey]: value });
  };

  const handleSubmit = async () => {
    if (!formSchema) return;

    const requiredFields = formSchema.schema_config?.filter(f => f.props.required) || [];
    for (const field of requiredFields) {
      if (!formData[field.props.fieldKey]) {
        alert(`请填写必填项：${field.props.label || field.name}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post(`/lowcode/forms/${formId}/submit`, { form_data: formData });
      alert('提交成功');
      onSubmit && onSubmit();
    } catch (err) {
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const { type, props } = field;
    const value = formData[props.fieldKey] || '';
    const onChange = (e) => handleFieldChange(props.fieldKey, e.target.value);

    return (
      <div key={field.id} className="renderer-field">
        <label className="renderer-label">
          {props.required && <span className="required">*</span>}
          {props.label || field.name}
        </label>

        {type === 'input' && (
          <input
            type="text"
            className="renderer-input"
            placeholder={props.placeholder}
            value={value}
            onChange={onChange}
            maxLength={props.maxLength}
          />
        )}

        {type === 'textarea' && (
          <textarea
            className="renderer-textarea"
            placeholder={props.placeholder}
            value={value}
            onChange={onChange}
            rows={props.rows || 4}
          />
        )}

        {type === 'number' && (
          <input
            type="number"
            className="renderer-input"
            placeholder={props.placeholder}
            value={value}
            onChange={onChange}
            min={props.min}
            max={props.max}
          />
        )}

        {type === 'select' && (
          <select className="renderer-select" value={value} onChange={onChange}>
            <option value="">{props.placeholder}</option>
            {props.options?.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {type === 'radio' && (
          <div className="option-list">
            {props.options?.map((opt, i) => (
              <label key={i} className="option-item">
                <input
                  type="radio"
                  name={props.fieldKey}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={onChange}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {type === 'checkbox' && (
          <div className="option-list">
            {props.options?.map((opt, i) => (
              <label key={i} className="option-item">
                <input
                  type="checkbox"
                  checked={(value || []).includes(opt.value)}
                  onChange={(e) => {
                    const current = value || [];
                    if (e.target.checked) {
                      handleFieldChange(props.fieldKey, [...current, opt.value]);
                    } else {
                      handleFieldChange(props.fieldKey, current.filter(v => v !== opt.value));
                    }
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {type === 'date' && (
          <input
            type="date"
            className="renderer-input"
            value={value}
            onChange={onChange}
          />
        )}

        {type === 'datetime' && (
          <input
            type="datetime-local"
            className="renderer-input"
            value={value}
            onChange={onChange}
          />
        )}

        {type === 'upload' && (
          <input
            type="file"
            className="renderer-input"
            multiple
            accept={props.accept}
          />
        )}

        {type === 'divider' && <hr style={{ margin: '16px 0' }} />}

        {['user', 'dept', 'money', 'phone', 'email'].includes(type) && (
          <input
            type="text"
            className="renderer-input"
            placeholder={props.placeholder}
            value={value}
            onChange={onChange}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="empty-state"><div className="empty-state-icon">⏳</div><p>加载中...</p></div>;
  }

  if (!formSchema) {
    return <div className="empty-state"><div className="empty-state-icon">❌</div><p>表单不存在</p></div>;
  }

  return (
    <div className="form-renderer">
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{formSchema.form_name}</h2>
      {formSchema.schema_config?.map(field => renderField(field))}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button className="btn btn-primary" style={{ padding: '12px 48px', fontSize: 16 }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交'}
        </button>
      </div>
    </div>
  );
}

export default FormRenderer;
