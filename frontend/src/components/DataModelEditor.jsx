import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function DataModelEditor({ appId, modelId, onSave, onBack }) {
  const [modelName, setModelName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [fields, setFields] = useState([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    fieldName: '',
    fieldCode: '',
    fieldType: 'string',
    required: false,
    defaultValue: '',
    description: ''
  });

  const fieldTypes = [
    { value: 'string', label: '字符串' },
    { value: 'number', label: '数字' },
    { value: 'integer', label: '整数' },
    { value: 'boolean', label: '布尔值' },
    { value: 'date', label: '日期' },
    { value: 'datetime', label: '日期时间' },
    { value: 'text', label: '长文本' },
    { value: 'json', label: 'JSON' }
  ];

  useEffect(() => {
    if (modelId) {
      loadModel();
    }
  }, [appId, modelId]);

  const loadModel = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/models/${modelId}`);
      setModelName(res.data.model_name);
      setModelCode(res.data.model_code);
      setFields(res.data.fields || []);
    } catch (err) {
      console.error('加载模型失败', err);
    }
  };

  const handleSaveField = () => {
    if (!fieldForm.fieldName || !fieldForm.fieldCode) {
      alert('请填写字段名称和编码');
      return;
    }

    if (editingField) {
      setFields(fields.map(f => f.fieldCode === editingField.fieldCode ? { ...fieldForm } : f));
    } else {
      if (fields.some(f => f.fieldCode === fieldForm.fieldCode)) {
        alert('字段编码已存在');
        return;
      }
      setFields([...fields, { ...fieldForm }]);
    }
    setShowFieldModal(false);
    setEditingField(null);
    setFieldForm({ fieldName: '', fieldCode: '', fieldType: 'string', required: false, defaultValue: '', description: '' });
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setFieldForm({ ...field });
    setShowFieldModal(true);
  };

  const handleDeleteField = (fieldCode) => {
    if (confirm('确定删除此字段？')) {
      setFields(fields.filter(f => f.fieldCode !== fieldCode));
    }
  };

  const handleSave = async () => {
    if (!modelName || !modelCode) {
      alert('请填写模型名称和编码');
      return;
    }

    try {
      if (modelId) {
        await api.put(`/lowcode/apps/${appId}/models/${modelId}`, {
          model_name: modelName,
          fields
        });
      } else {
        await api.post(`/lowcode/apps/${appId}/models`, {
          model_name: modelName,
          model_code: modelCode,
          fields
        });
      }
      alert('保存成功');
      onSave && onSave();
    } catch (err) {
      alert(err.response?.data?.error || '保存失败');
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
            placeholder="模型名称"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
          <input
            type="text"
            className="form-input"
            style={{ width: 150 }}
            placeholder="模型编码"
            value={modelCode}
            onChange={(e) => setModelCode(e.target.value)}
            disabled={!!modelId}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>📋 字段列表</h3>
          <button className="btn btn-primary" onClick={() => { setEditingField(null); setShowFieldModal(true); }}>+ 添加字段</button>
        </div>

        {fields.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>暂无字段，点击右上角添加字段</p>
          </div>
        ) : (
          <div className="field-list">
            {fields.map((field, index) => (
              <div key={field.fieldCode || index} className="field-item">
                <div>
                  <span className="field-name">{field.fieldName}</span>
                  <span style={{ color: '#999', marginLeft: 8 }}>({field.fieldCode})</span>
                  {field.required && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>*</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="field-type">{fieldTypes.find(t => t.value === field.fieldType)?.label || field.fieldType}</span>
                  <button className="btn btn-default" style={{ padding: '4px 12px' }} onClick={() => handleEditField(field)}>编辑</button>
                  <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => handleDeleteField(field.fieldCode)}>删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFieldModal && (
        <div className="modal-overlay" onClick={() => setShowFieldModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingField ? '编辑字段' : '添加字段'}</h3>
              <button className="close-btn" onClick={() => setShowFieldModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">字段名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={fieldForm.fieldName}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">字段编码</label>
                <input
                  type="text"
                  className="form-input"
                  value={fieldForm.fieldCode}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldCode: e.target.value })}
                  disabled={!!editingField}
                />
              </div>
              <div className="form-group">
                <label className="form-label">字段类型</label>
                <select
                  className="form-select"
                  value={fieldForm.fieldType}
                  onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}
                >
                  {fieldTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  />
                  {' '}是否必填
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">默认值</label>
                <input
                  type="text"
                  className="form-input"
                  value={fieldForm.defaultValue}
                  onChange={(e) => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea
                  className="form-textarea"
                  value={fieldForm.description}
                  onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowFieldModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveField}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataModelEditor;
