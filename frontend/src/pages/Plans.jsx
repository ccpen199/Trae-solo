import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { planAPI, scaleAPI } from '../api';

const Plans = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [plans, setPlans] = useState([]);
  const [scales, setScales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scale_id: '',
    grades: [],
    start_time: '',
    end_time: '',
    is_anonymous: false,
    consent_text: '我已知晓本次测评的目的和隐私保护措施，同意参与测评。我的回答将被严格保密，仅用于心理健康评估和支持。',
    status: 'draft'
  });

  useEffect(() => {
    loadPlans();
    if (hasRole('admin', 'psychologist')) {
      loadScales();
    }
  }, []);

  const loadPlans = async () => {
    try {
      const res = await planAPI.getPlans();
      setPlans(res.data);
    } catch (error) {
      console.error('Load plans error:', error);
    }
  };

  const loadScales = async () => {
    try {
      const res = await scaleAPI.getScales();
      setScales(res.data);
    } catch (error) {
      console.error('Load scales error:', error);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setFormData({
      name: '',
      scale_id: scales[0]?.id || '',
      grades: [7, 8, 9],
      start_time: now.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
      is_anonymous: false,
      consent_text: '我已知晓本次测评的目的和隐私保护措施，同意参与测评。我的回答将被严格保密，仅用于心理健康评估和支持。',
      status: 'draft'
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      scale_id: plan.scale_id,
      grades: plan.grades,
      start_time: new Date(plan.start_time).toISOString().slice(0, 16),
      end_time: new Date(plan.end_time).toISOString().slice(0, 16),
      is_anonymous: plan.is_anonymous === 1,
      consent_text: plan.consent_text,
      status: plan.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个测评计划吗？')) return;
    try {
      await planAPI.deletePlan(id);
      loadPlans();
    } catch (error) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await planAPI.updatePlan(editingPlan.id, formData);
      } else {
        await planAPI.createPlan(formData);
      }
      setShowModal(false);
      loadPlans();
    } catch (error) {
      alert(error.response?.data?.error || '保存失败');
    }
  };

  const handleStartAssessment = async (planId) => {
    const consentStatus = await planAPI.getConsentStatus(planId);
    if (!consentStatus.data.consented) {
      navigate(`/assessment/${planId}`);
    } else {
      navigate(`/assessment/${planId}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-pending',
      active: 'badge-active',
      closed: 'badge-closed'
    };
    const labels = {
      draft: '草稿',
      active: '进行中',
      closed: '已结束'
    };
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
  };

  const toggleGrade = (grade) => {
    const grades = formData.grades.includes(grade)
      ? formData.grades.filter(g => g !== grade)
      : [...formData.grades, grade];
    setFormData({ ...formData, grades });
  };

  return (
    <div>
      <div className="page-header">
        <h1>测评计划</h1>
        {hasRole('admin', 'psychologist') && (
          <button className="btn btn-sm" onClick={handleCreate}>+ 新建计划</button>
        )}
      </div>

      <div className="card">
        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>暂无测评计划</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>计划名称</th>
                <th>量表</th>
                <th>适用年级</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.scale_name}</td>
                  <td>{plan.grades?.join(', ')}年级</td>
                  <td>{new Date(plan.start_time).toLocaleString()}</td>
                  <td>{new Date(plan.end_time).toLocaleString()}</td>
                  <td>{getStatusBadge(plan.status)}</td>
                  <td className="actions">
                    {hasRole('student') && plan.status === 'active' && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleStartAssessment(plan.id)}
                      >
                        开始测评
                      </button>
                    )}
                    {hasRole('admin', 'psychologist') && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(plan)}>编辑</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(plan.id)}>删除</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingPlan ? '编辑测评计划' : '新建测评计划'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>计划名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>选择量表</label>
                <select
                  value={formData.scale_id}
                  onChange={(e) => setFormData({ ...formData, scale_id: parseInt(e.target.value) })}
                  required
                >
                  {scales.map(scale => (
                    <option key={scale.id} value={scale.id}>{scale.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>适用年级</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[7, 8, 9, 10, 11, 12].map(grade => (
                    <label key={grade} className="checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.grades.includes(grade)}
                        onChange={() => toggleGrade(grade)}
                      />
                      {grade}年级
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  />
                  匿名测评
                </label>
              </div>
              <div className="form-group">
                <label>知情同意书内容</label>
                <textarea
                  value={formData.consent_text}
                  onChange={(e) => setFormData({ ...formData, consent_text: e.target.value })}
                  rows="4"
                  required
                />
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">草稿</option>
                  <option value="active">发布（进行中）</option>
                  <option value="closed">已结束</option>
                </select>
              </div>
              <button type="submit" className="btn">
                {editingPlan ? '保存修改' : '创建计划'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
