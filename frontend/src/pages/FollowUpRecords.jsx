import React, { useState, useEffect } from 'react';
import { followUpApi, familyApi } from '../utils/api.js';

const FollowUpRecords = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [records, setRecords] = useState([]);
  const [families, setFamilies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    consultationDate: new Date().toISOString().split('T')[0],
    familyProfileId: '',
    contentSummary: '',
    parentFeedback: '',
    homeworkCompletion: 'partial',
    riskChange: 'stable',
    nextPlan: '',
  });

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordRes, familyRes] = await Promise.all([
        followUpApi.list(),
        familyApi.list(),
      ]);
      setRecords(recordRes.data);
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
      await followUpApi.create(formData);
      setSuccess('跟进记录创建成功');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    }
  };

  const resetForm = () => {
    setFormData({
      consultationDate: new Date().toISOString().split('T')[0],
      familyProfileId: '',
      contentSummary: '',
      parentFeedback: '',
      homeworkCompletion: 'partial',
      riskChange: 'stable',
      nextPlan: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getFamilyName = (familyId) => {
    const family = families.find((f) => f.id === familyId);
    return family ? family.childName : '未知家庭';
  };

  const getHomeworkBadge = (status) => {
    const statusMap = {
      completed: { label: '全部完成', class: 'badge-green' },
      partial: { label: '部分完成', class: 'badge-yellow' },
      none: { label: '未完成', class: 'badge-red' },
    };
    const info = statusMap[status] || { label: status, class: 'badge-gray' };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  };

  const getRiskChangeBadge = (change) => {
    const changeMap = {
      improved: { label: '好转', class: 'badge-green' },
      stable: { label: '稳定', class: 'badge-blue' },
      worsened: { label: '恶化', class: 'badge-red' },
    };
    const info = changeMap[change] || { label: change, class: 'badge-gray' };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">跟进记录</h1>
        {(user?.role === 'supervisor' || user?.role === 'consultant' || user?.role === 'operator') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + 新增记录
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>暂无跟进记录数据</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>咨询日期</th>
                <th>家庭</th>
                <th>咨询内容摘要</th>
                <th>家长反馈</th>
                <th>作业完成情况</th>
                <th>风险变化</th>
                <th>下一步计划</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{formatDate(record.consultationDate)}</td>
                  <td>{getFamilyName(record.familyProfileId)}</td>
                  <td style={{ maxWidth: '250px' }}>
                    {record.contentSummary?.length > 40
                      ? record.contentSummary.substring(0, 40) + '...'
                      : record.contentSummary}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {record.parentFeedback?.length > 30
                      ? record.parentFeedback.substring(0, 30) + '...'
                      : record.parentFeedback}
                  </td>
                  <td>{getHomeworkBadge(record.homeworkCompletion)}</td>
                  <td>{getRiskChangeBadge(record.riskChange)}</td>
                  <td style={{ maxWidth: '200px' }}>
                    {record.nextPlan?.length > 30
                      ? record.nextPlan.substring(0, 30) + '...'
                      : record.nextPlan}
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
              <h2 className="modal-title">新增跟进记录</h2>
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
                  <label className="form-label">咨询日期 *</label>
                  <input
                    type="date"
                    className="form-input"
                    name="consultationDate"
                    value={formData.consultationDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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
                  <label className="form-label">咨询内容摘要 *</label>
                  <textarea
                    className="form-textarea"
                    name="contentSummary"
                    value={formData.contentSummary}
                    onChange={handleInputChange}
                    placeholder="请输入咨询内容摘要"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">家长反馈 *</label>
                  <textarea
                    className="form-textarea"
                    name="parentFeedback"
                    value={formData.parentFeedback}
                    onChange={handleInputChange}
                    placeholder="请输入家长反馈"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">作业完成情况 *</label>
                  <select
                    className="form-select"
                    name="homeworkCompletion"
                    value={formData.homeworkCompletion}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="completed">全部完成</option>
                    <option value="partial">部分完成</option>
                    <option value="none">未完成</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">风险变化 *</label>
                  <select
                    className="form-select"
                    name="riskChange"
                    value={formData.riskChange}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="improved">好转</option>
                    <option value="stable">稳定</option>
                    <option value="worsened">恶化</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">下一步计划 *</label>
                  <textarea
                    className="form-textarea"
                    name="nextPlan"
                    value={formData.nextPlan}
                    onChange={handleInputChange}
                    placeholder="请输入下一步计划"
                    required
                  />
                </div>
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
                  创建记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpRecords;
