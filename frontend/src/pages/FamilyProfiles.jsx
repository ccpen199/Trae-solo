import React, { useState, useEffect } from 'react';
import { familyApi } from '../utils/api.js';

const FamilyProfiles = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    grade: '',
    mainIssue: '',
    parentRequest: '',
    previousConsultation: '',
    confidentialityAgreed: false,
    parentId: '',
    consultantId: '',
    status: 'active',
  });

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await familyApi.list();
      setProfiles(response.data);
    } catch (err) {
      setError('获取家庭档案列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingProfile) {
        await familyApi.update(editingProfile.id, formData);
        setSuccess('档案更新成功');
      } else {
        await familyApi.create(formData);
        setSuccess('档案创建成功');
      }
      setShowModal(false);
      resetForm();
      fetchProfiles();
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      childName: profile.childName || '',
      age: profile.age || '',
      grade: profile.grade || '',
      mainIssue: profile.mainIssue || '',
      parentRequest: profile.parentRequest || '',
      previousConsultation: profile.previousConsultation || '',
      confidentialityAgreed: profile.confidentialityAgreed || false,
      parentId: profile.parentId || '',
      consultantId: profile.consultantId || '',
      status: profile.status || 'active',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该家庭档案吗？')) return;

    try {
      await familyApi.delete(id);
      setSuccess('档案删除成功');
      fetchProfiles();
    } catch (err) {
      setError('删除失败');
    }
  };

  const resetForm = () => {
    setFormData({
      childName: '',
      age: '',
      grade: '',
      mainIssue: '',
      parentRequest: '',
      previousConsultation: '',
      confidentialityAgreed: false,
      parentId: '',
      consultantId: '',
      status: 'active',
    });
    setEditingProfile(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '进行中', class: 'badge-green' },
      completed: { label: '已完成', class: 'badge-blue' },
      paused: { label: '暂停', class: 'badge-yellow' },
      terminated: { label: '终止', class: 'badge-red' },
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
        <h1 className="page-title">家庭档案管理</h1>
        {(user?.role === 'supervisor' || user?.role === 'consultant' || user?.role === 'operator') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + 新增档案
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>暂无家庭档案数据</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>孩子姓名</th>
                <th>年龄</th>
                <th>年级</th>
                <th>主要问题</th>
                <th>家长诉求</th>
                <th>既往咨询</th>
                <th>保密授权</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.childName}</td>
                  <td>{profile.age}</td>
                  <td>{profile.grade}</td>
                  <td style={{ maxWidth: '200px' }}>
                    {profile.mainIssue?.length > 30
                      ? profile.mainIssue.substring(0, 30) + '...'
                      : profile.mainIssue}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {profile.parentRequest?.length > 30
                      ? profile.parentRequest.substring(0, 30) + '...'
                      : profile.parentRequest}
                  </td>
                  <td style={{ maxWidth: '150px' }}>
                    {profile.previousConsultation?.length > 20
                      ? profile.previousConsultation.substring(0, 20) + '...'
                      : profile.previousConsultation || '无'}
                  </td>
                  <td>
                    {profile.confidentialityAgreed ? (
                      <span className="badge badge-green">已授权</span>
                    ) : (
                      <span className="badge badge-gray">未授权</span>
                    )}
                  </td>
                  <td>{getStatusBadge(profile.status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(profile)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(profile.id)}
                      >
                        删除
                      </button>
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
                {editingProfile ? '编辑家庭档案' : '新增家庭档案'}
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
                  <label className="form-label">孩子姓名 *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="childName"
                    value={formData.childName}
                    onChange={handleInputChange}
                    placeholder="请输入孩子姓名"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">年龄 *</label>
                  <input
                    type="number"
                    className="form-input"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="请输入年龄"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">年级 *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    placeholder="请输入年级，如：三年级"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">主要问题 *</label>
                  <textarea
                    className="form-textarea"
                    name="mainIssue"
                    value={formData.mainIssue}
                    onChange={handleInputChange}
                    placeholder="请描述主要问题"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">家长诉求 *</label>
                  <textarea
                    className="form-textarea"
                    name="parentRequest"
                    value={formData.parentRequest}
                    onChange={handleInputChange}
                    placeholder="请描述家长诉求"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">既往咨询史</label>
                  <textarea
                    className="form-textarea"
                    name="previousConsultation"
                    value={formData.previousConsultation}
                    onChange={handleInputChange}
                    placeholder="请描述既往咨询史（选填）"
                  />
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="confidentialityAgreed"
                      checked={formData.confidentialityAgreed}
                      onChange={handleInputChange}
                    />
                    保密授权（已签署保密协议）
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">家长ID</label>
                  <input
                    type="text"
                    className="form-input"
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    placeholder="请输入家长用户ID（选填）"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">咨询师ID</label>
                  <input
                    type="text"
                    className="form-input"
                    name="consultantId"
                    value={formData.consultantId}
                    onChange={handleInputChange}
                    placeholder="请输入咨询师用户ID（选填）"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="paused">暂停</option>
                    <option value="terminated">终止</option>
                  </select>
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
                  {editingProfile ? '保存修改' : '创建档案'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyProfiles;
