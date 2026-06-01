import React, { useState, useEffect } from 'react';
import { planApi, familyApi, userApi } from '../utils/api.js';

const ConsultationPlans = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [plans, setPlans] = useState([]);
  const [families, setFamilies] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    familyProfileId: '',
    durationWeeks: '',
    servicePackage: 'standard',
    stageGoals: '',
    consultantId: '',
    reviewStatus: 'pending',
  });

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [planRes, familyRes, userRes] = await Promise.all([
        planApi.list(),
        familyApi.list(),
        userApi.list(),
      ]);
      setPlans(planRes.data);
      setFamilies(familyRes.data);
      setUsers(userRes.data);
    } catch (err) {
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingPlan) {
        await planApi.update(editingPlan.id, formData);
        setSuccess('方案更新成功');
      } else {
        await planApi.create(formData);
        setSuccess('方案创建成功');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      familyProfileId: plan.familyProfileId || '',
      durationWeeks: plan.durationWeeks || '',
      servicePackage: plan.servicePackage || 'standard',
      stageGoals: plan.stageGoals || '',
      consultantId: plan.consultantId || '',
      reviewStatus: plan.reviewStatus || 'pending',
    });
    setShowModal(true);
  };

  const handleReview = async (id, status) => {
    try {
      await planApi.update(id, { reviewStatus: status });
      setSuccess(status === 'approved' ? '审核通过成功' : '审核驳回成功');
      fetchData();
    } catch (err) {
      setError('审核操作失败');
    }
  };

  const resetForm = () => {
    setFormData({
      familyProfileId: '',
      durationWeeks: '',
      servicePackage: 'standard',
      stageGoals: '',
      consultantId: '',
      reviewStatus: 'pending',
    });
    setEditingPlan(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getFamilyName = (familyId) => {
    const family = families.find((f) => f.id === familyId);
    return family ? family.childName : '未知家庭';
  };

  const getConsultantName = (consultantId) => {
    const consultant = users.find((u) => u.id === consultantId);
    return consultant ? consultant.name : '未分配';
  };

  const getServicePackageName = (pkg) => {
    const pkgMap = {
      standard: '标准包',
      intensive: '强化包',
      premium: '尊享包',
    };
    return pkgMap[pkg] || pkg;
  };

  const getReviewBadge = (status) => {
    const statusMap = {
      pending: { label: '待审核', class: 'badge-yellow' },
      approved: { label: '已通过', class: 'badge-green' },
      rejected: { label: '已驳回', class: 'badge-red' },
    };
    const info = statusMap[status] || { label: status, class: 'badge-gray' };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">咨询方案</h1>
        {(user?.role === 'supervisor' || user?.role === 'consultant' || user?.role === 'operator') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + 新增方案
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>暂无咨询方案数据</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>家庭</th>
                <th>周期周数</th>
                <th>服务包</th>
                <th>阶段目标</th>
                <th>咨询师</th>
                <th>督导审核状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>{getFamilyName(plan.familyProfileId)}</td>
                  <td>{plan.durationWeeks} 周</td>
                  <td>{getServicePackageName(plan.servicePackage)}</td>
                  <td style={{ maxWidth: '250px' }}>
                    {plan.stageGoals?.length > 40
                      ? plan.stageGoals.substring(0, 40) + '...'
                      : plan.stageGoals}
                  </td>
                  <td>{getConsultantName(plan.consultantId)}</td>
                  <td>{getReviewBadge(plan.reviewStatus)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(plan)}
                      >
                        编辑
                      </button>
                      {user?.role === 'supervisor' && plan.reviewStatus === 'pending' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleReview(plan.id, 'approved')}
                          >
                            通过
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReview(plan.id, 'rejected')}
                          >
                            驳回
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPlan ? '编辑咨询方案' : '新增咨询方案'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">关联家庭 *</label>
                  <select
                    className="form-select"
                    name="familyProfileId"
                    value={formData.familyProfileId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">请选择家庭</option>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.childName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">周期周数 *</label>
                  <input
                    type="number"
                    className="form-input"
                    name="durationWeeks"
                    value={formData.durationWeeks}
                    onChange={handleInputChange}
                    placeholder="请输入周期周数"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">服务包 *</label>
                  <select
                    className="form-select"
                    name="servicePackage"
                    value={formData.servicePackage}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="standard">标准包</option>
                    <option value="intensive">强化包</option>
                    <option value="premium">尊享包</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">阶段目标 *</label>
                  <textarea
                    className="form-textarea"
                    name="stageGoals"
                    value={formData.stageGoals}
                    onChange={handleInputChange}
                    placeholder="请输入阶段目标"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">咨询师 *</label>
                  <select
                    className="form-select"
                    name="consultantId"
                    value={formData.consultantId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">请选择咨询师</option>
                    {users
                      .filter((u) => u.role === 'consultant' || u.role === 'supervisor')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
                {(user?.role === 'supervisor' || editingPlan) && (
                  <div className="form-group">
                    <label className="form-label">审核状态</label>
                    <select
                      className="form-select"
                      name="reviewStatus"
                      value={formData.reviewStatus}
                      onChange={handleInputChange}
                    >
                      <option value="pending">待审核</option>
                      <option value="approved">已通过</option>
                      <option value="rejected">已驳回</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlan ? '保存修改' : '创建方案'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationPlans;
