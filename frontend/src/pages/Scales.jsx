import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { scaleAPI } from '../api';

const Scales = () => {
  const { hasRole } = useAuth();
  const [scales, setScales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingScale, setEditingScale] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    questions: [],
    dimensions: [],
    scoring_rules: {},
    risk_thresholds: { mild: 2, moderate: 3, severe: 4 }
  });

  useEffect(() => {
    loadScales();
  }, []);

  const loadScales = async () => {
    try {
      const res = await scaleAPI.getScales();
      setScales(res.data);
    } catch (error) {
      console.error('Load scales error:', error);
    }
  };

  const handleCreate = () => {
    setEditingScale(null);
    setFormData({
      name: '',
      description: '',
      questions: [
        { id: 'q1', text: '示例问题1', dimension: 'emotion', options: ['从不', '偶尔', '经常', '总是'], maxValue: 4 },
        { id: 'q2', text: '示例问题2', dimension: 'anxiety', options: ['从不', '偶尔', '经常', '总是'], maxValue: 4 }
      ],
      dimensions: [
        { key: 'emotion', label: '情绪状态' },
        { key: 'anxiety', label: '焦虑水平' }
      ],
      scoring_rules: { reverse: [] },
      risk_thresholds: { mild: 2, moderate: 3, severe: 4 }
    });
    setShowModal(true);
  };

  const handleEdit = (scale) => {
    setEditingScale(scale);
    setFormData({
      name: scale.name,
      description: scale.description,
      questions: scale.questions,
      dimensions: scale.dimensions,
      scoring_rules: scale.scoring_rules,
      risk_thresholds: scale.risk_thresholds
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个量表吗？')) return;
    try {
      await scaleAPI.deleteScale(id);
      loadScales();
    } catch (error) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingScale) {
        await scaleAPI.updateScale(editingScale.id, formData);
      } else {
        await scaleAPI.createScale(formData);
      }
      setShowModal(false);
      loadScales();
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  const addQuestion = () => {
    const newId = `q${Date.now()}`;
    setFormData({
      ...formData,
      questions: [...formData.questions, {
        id: newId,
        text: '',
        dimension: formData.dimensions[0]?.key || '',
        options: ['从不', '偶尔', '经常', '总是'],
        maxValue: 4,
        reverse: false
      }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  if (!hasRole('admin', 'psychologist')) {
    return <div className="card"><p>权限不足</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>量表管理</h1>
        <button className="btn btn-sm" onClick={handleCreate}>+ 新建量表</button>
      </div>

      <div className="card">
        {scales.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>暂无量表，点击上方按钮创建</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>量表名称</th>
                <th>描述</th>
                <th>题目数</th>
                <th>维度数</th>
                <th>创建者</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {scales.map(scale => (
                <tr key={scale.id}>
                  <td>{scale.name}</td>
                  <td>{scale.description || '-'}</td>
                  <td>{scale.questions?.length || 0}</td>
                  <td>{scale.dimensions?.length || 0}</td>
                  <td>{scale.creator_name}</td>
                  <td>{new Date(scale.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(scale)}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(scale.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>{editingScale ? '编辑量表' : '新建量表'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>量表名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>风险阈值 (平均分)</label>
                <div className="grid grid-3">
                  <div>
                    <label style={{ fontSize: '12px' }}>轻度 ≥</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.risk_thresholds.mild}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_thresholds: { ...formData.risk_thresholds, mild: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px' }}>中度 ≥</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.risk_thresholds.moderate}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_thresholds: { ...formData.risk_thresholds, moderate: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px' }}>严重 ≥</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.risk_thresholds.severe}
                      onChange={(e) => setFormData({
                        ...formData,
                        risk_thresholds: { ...formData.risk_thresholds, severe: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>题目列表</label>
                {formData.questions.map((q, index) => (
                  <div key={q.id} className="question-card">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="问题内容"
                        value={q.text}
                        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select
                        value={q.dimension}
                        onChange={(e) => updateQuestion(index, 'dimension', e.target.value)}
                        style={{ width: '150px' }}
                      >
                        {formData.dimensions.map(dim => (
                          <option key={dim.key} value={dim.key}>{dim.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeQuestion(index)}
                      >
                        删除
                      </button>
                    </div>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id={`reverse-${q.id}`}
                        checked={q.reverse}
                        onChange={(e) => updateQuestion(index, 'reverse', e.target.checked)}
                      />
                      <label htmlFor={`reverse-${q.id}`}>反向计分</label>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>
                  + 添加题目
                </button>
              </div>
              <button type="submit" className="btn" style={{ marginTop: '20px' }}>
                {editingScale ? '保存修改' : '创建量表'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scales;
