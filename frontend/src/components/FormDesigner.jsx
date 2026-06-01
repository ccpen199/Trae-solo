import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

function FormDesigner({ appId, formId, onSave, onBack }) {
  const [components, setComponents] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOverField, setDragOverField] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadComponents();
    if (formId) {
      loadForm();
    }
  }, [appId, formId]);

  const loadComponents = async () => {
    try {
      const res = await api.get('/lowcode/components');
      setComponents(res.data);
    } catch (err) {
      console.error('加载组件失败', err);
    }
  };

  const loadForm = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/forms/${formId}`);
      const form = res.data;
      setFormName(form.form_name);
      setFormCode(form.form_code);
      setFormDesc(form.description || '');
      setFormFields(form.schema_config || []);
    } catch (err) {
      console.error('加载表单失败', err);
    }
  };

  const handleDragStart = (e, component) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
  };

  const handleFieldDragStart = (e, field, index) => {
    e.dataTransfer.setData('fieldIndex', index.toString());
  };

  const handleDrop = (e, targetIndex = -1) => {
    e.preventDefault();
    setDragOverField(null);

    const componentData = e.dataTransfer.getData('component');
    const fieldIndex = e.dataTransfer.getData('fieldIndex');

    if (componentData) {
      const component = JSON.parse(componentData);
      const newField = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: component.component_type,
        name: component.component_name,
        props: { ...component.default_props, fieldKey: `field_${Date.now()}` }
      };

      if (targetIndex >= 0) {
        const newFields = [...formFields];
        newFields.splice(targetIndex, 0, newField);
        setFormFields(newFields);
      } else {
        setFormFields([...formFields, newField]);
      }
    } else if (fieldIndex !== '') {
      const fromIndex = parseInt(fieldIndex);
      const newFields = [...formFields];
      const [removed] = newFields.splice(fromIndex, 1);
      const insertIndex = targetIndex >= 0 ? (targetIndex > fromIndex ? targetIndex - 1 : targetIndex) : newFields.length;
      newFields.splice(insertIndex, 0, removed);
      setFormFields(newFields);
    }
  };

  const handleDragOver = (e, index = -1) => {
    e.preventDefault();
    setDragOverField(index);
  };

  const handleDragLeave = () => {
    setDragOverField(null);
  };

  const handleSelectField = (field) => {
    setSelectedField(field);
  };

  const handleDeleteField = (fieldId) => {
    setFormFields(formFields.filter(f => f.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleFieldPropChange = (key, value) => {
    if (!selectedField) return;

    const newFields = formFields.map(f => {
      if (f.id === selectedField.id) {
        return { ...f, props: { ...f.props, [key]: value } };
      }
      return f;
    });
    setFormFields(newFields);
    setSelectedField({ ...selectedField, props: { ...selectedField.props, [key]: value } });
  };

  const handleSave = async () => {
    if (!formName || !formCode) {
      alert('请填写表单名称和编码');
      return;
    }

    setSaving(true);
    try {
      if (formId) {
        await api.put(`/lowcode/apps/${appId}/forms/${formId}`, {
          form_name: formName,
          description: formDesc,
          schema_config: formFields
        });
      } else {
        const res = await api.post(`/lowcode/apps/${appId}/forms`, {
          form_name: formName,
          form_code: formCode,
          description: formDesc,
          schema_config: formFields
        });
      }
      alert('保存成功');
      onSave && onSave();
    } catch (err) {
      alert(err.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formId) {
      alert('请先保存表单');
      return;
    }
    try {
      await api.post(`/lowcode/apps/${appId}/forms/${formId}/publish`);
      alert('发布成功');
    } catch (err) {
      alert('发布失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-default" onClick={onBack}>← 返回</button>
          <input
            type="text"
            className="form-input"
            style={{ width: 200 }}
            placeholder="表单名称"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <input
            type="text"
            className="form-input"
            style={{ width: 150 }}
            placeholder="表单编码"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            disabled={!!formId}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button className="btn btn-success" onClick={handlePublish} disabled={!formId}>
            发布
          </button>
        </div>
      </div>

      <div className="lowcode-workbench">
        <div className="component-panel">
          <h3>🧩 组件库</h3>
          <div className="component-list">
            {components.map(comp => (
              <div
                key={comp.id}
                className="component-item"
                draggable
                onDragStart={(e) => handleDragStart(e, comp)}
              >
                <div className="component-icon">{comp.component_icon}</div>
                <div>{comp.component_name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="designer-canvas">
          <div
            ref={canvasRef}
            className="form-canvas"
            onDrop={(e) => handleDrop(e)}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={handleDragLeave}
            onClick={() => setSelectedField(null)}
          >
            <div className="form-title">{formName || '未命名表单'}</div>

            {formFields.length === 0 && (
              <div
                className={`drop-zone ${dragOverField === -1 ? 'active' : ''}`}
                onDrop={(e) => { e.stopPropagation(); handleDrop(e); }}
                onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, -1); }}
              >
                📝 从左侧拖拽组件到这里开始设计表单
              </div>
            )}

            {formFields.map((field, index) => (
              <div
                key={field.id}
                className={`form-field-wrapper ${selectedField?.id === field.id ? 'selected' : ''} ${dragOverField === index ? 'drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleFieldDragStart(e, field, index)}
                onDrop={(e) => { e.stopPropagation(); handleDrop(e, index); }}
                onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, index); }}
                onDragLeave={handleDragLeave}
                onClick={(e) => { e.stopPropagation(); handleSelectField(field); }}
              >
                <div className="field-actions">
                  <button className="field-action-btn move">↕</button>
                  <button className="field-action-btn delete" onClick={(e) => { e.stopPropagation(); handleDeleteField(field.id); }}>删除</button>
                </div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  {field.props.required && <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>}
                  {field.props.label || field.name}
                </label>
                {field.type === 'input' && <input type="text" className="form-input" placeholder={field.props.placeholder} disabled />}
                {field.type === 'textarea' && <textarea className="form-textarea" placeholder={field.props.placeholder} disabled rows={field.props.rows} />}
                {field.type === 'number' && <input type="number" className="form-input" placeholder={field.props.placeholder} disabled />}
                {field.type === 'select' && (
                  <select className="form-select" disabled>
                    <option value="">{field.props.placeholder}</option>
                    {field.props.options?.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
                  </select>
                )}
                {field.type === 'radio' && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    {field.props.options?.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="radio" disabled /> {opt.label}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'checkbox' && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    {field.props.options?.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" disabled /> {opt.label}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'date' && <input type="date" className="form-input" disabled />}
                {field.type === 'datetime' && <input type="datetime-local" className="form-input" disabled />}
                {field.type === 'upload' && <input type="file" className="form-input" disabled />}
                {field.type === 'divider' && <hr style={{ margin: '8px 0' }} />}
                {['user', 'dept', 'money', 'phone', 'email'].includes(field.type) && (
                  <input type="text" className="form-input" placeholder={field.props.placeholder} disabled />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="property-panel">
          <h3>⚙️ 属性配置</h3>
          {selectedField ? (
            <>
              <div className="property-group">
                <div className="property-group-title">基础属性</div>
                <div className="property-item">
                  <label>字段标签</label>
                  <input
                    type="text"
                    value={selectedField.props.label || ''}
                    onChange={(e) => handleFieldPropChange('label', e.target.value)}
                  />
                </div>
                <div className="property-item">
                  <label>占位提示</label>
                  <input
                    type="text"
                    value={selectedField.props.placeholder || ''}
                    onChange={(e) => handleFieldPropChange('placeholder', e.target.value)}
                  />
                </div>
                <div className="property-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedField.props.required || false}
                      onChange={(e) => handleFieldPropChange('required', e.target.checked)}
                    />
                    {' '}是否必填
                  </label>
                </div>
              </div>

              {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                <div className="property-group">
                  <div className="property-group-title">选项配置</div>
                  <div className="property-item">
                    <label>选项（每行一个，格式：label:value）</label>
                    <textarea
                      value={(selectedField.props.options || []).map(o => `${o.label}:${o.value}`).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').filter(l => l.trim());
                        const options = lines.map(l => {
                          const [label, value] = l.split(':');
                          return { label: label?.trim(), value: value?.trim() || label?.trim() };
                        });
                        handleFieldPropChange('options', options);
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedField.type === 'textarea' && (
                <div className="property-group">
                  <div className="property-group-title">文本域设置</div>
                  <div className="property-item">
                    <label>行数</label>
                    <input
                      type="number"
                      value={selectedField.props.rows || 4}
                      onChange={(e) => handleFieldPropChange('rows', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {selectedField.type === 'number' && (
                <div className="property-group">
                  <div className="property-group-title">数字设置</div>
                  <div className="property-item">
                    <label>最小值</label>
                    <input
                      type="number"
                      value={selectedField.props.min || 0}
                      onChange={(e) => handleFieldPropChange('min', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="property-item">
                    <label>最大值</label>
                    <input
                      type="number"
                      value={selectedField.props.max || 999999}
                      onChange={(e) => handleFieldPropChange('max', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {selectedField.type === 'upload' && (
                <div className="property-group">
                  <div className="property-group-title">上传设置</div>
                  <div className="property-item">
                    <label>最大数量</label>
                    <input
                      type="number"
                      value={selectedField.props.maxCount || 5}
                      onChange={(e) => handleFieldPropChange('maxCount', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="property-item">
                    <label>接受类型</label>
                    <input
                      type="text"
                      value={selectedField.props.accept || ''}
                      onChange={(e) => handleFieldPropChange('accept', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>
              请选择一个组件进行配置
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormDesigner;
