import React, { useState, useEffect } from 'react';
import { assessmentApi, familyApi } from '../utils/api.js';

const Assessments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [families, setFamilies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [formData, setFormData] = useState({
    familyProfileId: '',
    questionnaireSummary: '',
    interviewSummary: '',
    riskLevel: 'low',
    consultationGoal: '',
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
      const [assessmentRes, familyRes] = await Promise.all([
        assessmentApi.list(),
        familyApi.list(),
      ]);
      setAssessments(assessmentRes.data);
      setFamilies(familyRes.data);
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
      if (editingAssessment) {
        await assessmentApi.update(editingAssessment.id, formData);
        setSuccess('评估更新成功');
      } else {
        await assessmentApi.create(formData);
        setSuccess('评估创建成功');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      familyProfileId: assessment.familyProfileId || '',
      questionnaireSummary: assessment.questionnaireSummary || '',
      interviewSummary: assessment.interviewSummary || '',
      riskLevel: assessment.riskLevel || 'low',
      consultationGoal: assessment.consultationGoal || '',
      reviewStatus: assessment.reviewStatus || 'pending',
    });
    setShowModal(true);
  };

  const handleReview = async (id, status) => {
    try {
      await assessmentApi.update(id, { reviewStatus: status });
      setSuccess(status === 'approved' ? '复核通过成功' : '复核驳回成功');
      fetchData();
    } catch (err) {
      setError('复核操作失败');
    }
  };

  const resetForm = () => {
    setFormData({
      familyProfileId: '',
      questionnaireSummary: '',
      interviewSummary: '',
      riskLevel: 'low',
      consultationGoal: '',
      reviewStatus: 'pending',
    });
    setEditingAssessment(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getFamilyName = (familyId) => {
    const family = families.find((f) => f.id === familyId);
    return family ? family.childName : '未知家庭';
  };

  const getRiskBadge = (level) => {
    const levelMap = {
      low: { label: '低风险', class: 'badge-green' },
      medium: { label: '中风险', class: 'badge-yellow' },
      high: { label: '高风险', class: 'badge-orange' },
      critical: { label: '极高风险', class: 'badge-red' },
    };
    const info = levelMap[level] || { label: level, class: 'badge-gray' };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  };

  const getReviewBadge = (status) => {
    const statusMap = {
      pending: { label: '待复核', class: 'badge-yellow' },
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
        <h1 className="page-title">初评管理</h1>
        {(user?.role === 'supervisor' || user?.role === 'consultant' || user?.role === 'operator') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + 新增评估
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        {assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>暂无评估数据</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>关联家庭</th>
                <th>问卷结果摘要</th>
                <th>访谈纪要摘要</th>
                <th>风险等级</th>
                <th>咨询目标</th>
                <th>复核状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td>{getFamilyName(assessment.familyProfileId)}</td>
                  <td style={{ maxWidth: '200px' }}>
                    {assessment.questionnaireSummary?.length > 30
                      ? assessment.questionnaireSummary.substring(0, 30) + '...'
                      : assessment.questionnaireSummary}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {assessment.interviewSummary?.length > 30
                      ? assessment.interviewSummary.substring(0, 30) + '...'
                      : assessment.interviewSummary}
                  </td>
                  <td>{getRiskBadge(assessment.riskLevel)}</td>
                  <td style={{ maxWidth: '200px' }}>
                    {assessment.consultationGoal?.length > 30
                      ? assessment.consultationGoal.substring(0, 30) + '...'
                      : assessment.consultationGoal}
                  </td>
                  <td>{getReviewBadge(assessment.reviewStatus)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(assessment)}
                      >
                        编辑
                      </button>
                      {user?.role === 'supervisor' && assessment.reviewStatus === 'pending' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleReview(assessment.id, 'approved')}
                          >
                            通过
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReview(assessment.id, 'rejected')}
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
                {editingAssessment ? '编辑评估' : '新增评估'}
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
                  <label className="form-label">问卷结果摘要 *</label>
                  <textarea
                    className="form-textarea"
                    name="questionnaireSummary"
                    value={formData.questionnaireSummary}
                    onChange={handleInputChange}
                    placeholder="请输入问卷结果摘要"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">访谈纪要摘要 *</label>
                  <textarea
                    className="form-textarea"
                    name="interviewSummary"
                    value={formData.interviewSummary}
                    onChange={handleInputChange}
                    placeholder="请输入访谈纪要摘要"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">风险等级 *</label>
                  <select
                    className="form-select"
                    name="riskLevel"
                    value={formData.riskLevel}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                    <option value="critical">极高风险</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">咨询目标 *</label>
                  <textarea
                    className="form-textarea"
                    name="consultationGoal"
                    value={formData.consultationGoal}
                    onChange={handleInputChange}
                    placeholder="请输入咨询目标"
                    required
                  />
                </div>
                {(user?.role === 'supervisor' || editingAssessment) && (
                  <div className="form-group">
                    <label className="form-label">复核状态</label>
                    <select
                      className="form-select"
                      name="reviewStatus"
                      value={formData.reviewStatus}
                      onChange={handleInputChange}
                    >
                      <option value="pending">待复核</option>
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
                  {editingAssessment ? '保存修改' : '创建评估'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessments;
