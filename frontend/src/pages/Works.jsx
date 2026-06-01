import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { creatorAPI, workAPI, CREATOR_ID } from '../utils/api.js';

const Works = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWork, setDeletingWork] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'draft', label: '草稿' },
    { key: 'auditing', label: '审核中' },
    { key: 'published', label: '已发布' },
    { key: 'scheduled', label: '定时发布' },
  ];

  useEffect(() => {
    loadWorks();
  }, [activeTab]);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const res = await creatorAPI.getWorks(CREATOR_ID, status);
      setWorks(res.data);
    } catch (error) {
      console.error('Failed to load works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (work) => {
    setDeletingWork(work);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingWork) return;
    
    if (!deleteReason.trim()) {
      alert('请填写删除原因');
      return;
    }

    setDeleting(true);
    try {
      await workAPI.delete(deletingWork.id);
      setShowDeleteModal(false);
      setDeletingWork(null);
      alert(`作品《${deletingWork.title}》已申请下架\n\n下架说明：\n1. 作品数据已保留，可在运营后台复查\n2. 未结算收益将在下次结算日处理\n3. 如需恢复请联系运营人员`);
      loadWorks();
    } catch (error) {
      console.error('Failed to delete:', error);
      const errorMsg = error.response?.data?.error || '删除失败，请稍后重试';
      alert(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitAudit = async (work) => {
    try {
      await workAPI.update(work.id, { ...work, status: 'auditing' });
      loadWorks();
      alert('已提交审核');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('提交失败');
    }
  };

  const handleEdit = (work) => {
    navigate('/publish');
  };

  const handleViewData = (work) => {
    if (work.status === 'published') {
      navigate(`/data?workId=${work.id}`);
    }
  };

  const statusLabels = {
    draft: { label: '草稿', class: 'status-draft' },
    auditing: { label: '审核中', class: 'status-auditing' },
    published: { label: '已发布', class: 'status-published' },
    scheduled: { label: '定时发布', class: 'status-scheduled' },
    offline: { label: '已下架', class: 'status-warning' },
  };

  const typeLabels = {
    video: '视频',
    article: '图文',
  };

  const deleteReasons = [
    '内容质量问题',
    '版权问题',
    '违反平台规定',
    '用户主动删除',
    '其他原因',
  ];

  return (
    <div>
      <div className="page-header">
        <h2>内容管理</h2>
        <button className="btn btn-primary" onClick={() => navigate('/publish')}>
          + 发布内容
        </button>
      </div>
      <div className="page-content">
        <div className="card">
          <div className="tabs">
            {tabs.map(tab => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex-center" style={{ padding: '60px 0' }}>
              <span>加载中...</span>
            </div>
          ) : works.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📝</div>
              <div className="empty-text">暂无作品</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>作品</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>浏览</th>
                  <th>点赞</th>
                  <th>评论</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {works.map(work => (
                  <tr key={work.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '80px', height: '45px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                          {typeLabels[work.type]}
                        </div>
                        <div style={{ maxWidth: '200px' }}>
                          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.title}</div>
                          {work.topics && (
                            <div className="tags" style={{ marginTop: '4px' }}>
                              {work.topics.split(',').map((t, i) => (
                                <span key={i} className="tag">{t.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{typeLabels[work.type]}</td>
                    <td>
                      <span className={`status-badge ${statusLabels[work.status]?.class}`}>
                        {statusLabels[work.status]?.label}
                      </span>
                    </td>
                    <td>{work.views.toLocaleString()}</td>
                    <td>{work.likes.toLocaleString()}</td>
                    <td>{work.comments.toLocaleString()}</td>
                    <td>{work.created_at?.split(' ')[0]}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {work.status === 'draft' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => handleEdit(work)}>编辑</button>
                            <button className="btn btn-sm btn-default" onClick={() => handleSubmitAudit(work)}>提交审核</button>
                          </>
                        )}
                        {work.status === 'published' && (
                          <button className="btn btn-sm btn-default" onClick={() => handleViewData(work)}>查看数据</button>
                        )}
                        {work.status === 'auditing' && (
                          <span className="text-muted" style={{ fontSize: '12px' }}>审核中...</span>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(work)}>
                          {work.status === 'published' ? '下架' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ background: '#fafafa' }}>
          <h3 className="card-title" style={{ marginBottom: '12px' }}>内容管理说明</h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>📝</span>
                <span style={{ fontWeight: 500 }}>草稿管理</span>
              </div>
              <div className="text-muted" style={{ fontSize: '13px' }}>草稿仅本人可见，可随时编辑或提交审核</div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>✅</span>
                <span style={{ fontWeight: 500 }}>审核流程</span>
              </div>
              <div className="text-muted" style={{ fontSize: '13px' }}>提交后 1-2 小时内完成审核，审核通过自动发布</div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <span style={{ fontWeight: 500 }}>数据查看</span>
              </div>
              <div className="text-muted" style={{ fontSize: '13px' }}>已发布作品可查看详细数据和收益情况</div>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span style={{ fontWeight: 500 }}>下架说明</span>
              </div>
              <div className="text-muted" style={{ fontSize: '13px' }}>下架后数据保留，未结算收益正常结算</div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && deletingWork && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {deletingWork.status === 'published' ? '申请下架' : '删除作品'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => !deleting && setShowDeleteModal(false)}
                disabled={deleting}
              >×</button>
            </div>
            <div className="modal-body">
              {deletingWork.status === 'published' && (
                <div style={{ background: '#fff7e6', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ffd591' }}>
                  <div style={{ fontWeight: 500, marginBottom: '8px', color: '#fa8c16' }}>⚠️ 下架影响说明</div>
                  <div style={{ fontSize: '13px', color: '#595959' }}>
                    <div>• 作品将从公开列表移除，但数据保留</div>
                    <div>• 未结算的广告分成和打赏收益将正常结算</div>
                    <div>• 下架操作需运营审核，1-2 个工作日内完成</div>
                    <div>• 如需恢复，请联系运营人员</div>
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">作品名称</label>
                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '4px' }}>
                  {deletingWork.title}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">作品状态</label>
                <span className={`status-badge ${statusLabels[deletingWork.status]?.class}`}>
                  {statusLabels[deletingWork.status]?.label}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {deletingWork.status === 'published' ? '下架原因' : '删除原因'} *
                </label>
                <select
                  className="form-select"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  disabled={deleting}
                >
                  <option value="">请选择原因</option>
                  {deleteReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {deletingWork.status === 'published' && deletingWork.views > 0 && (
                <div style={{ background: '#e6f7ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                  <div style={{ fontSize: '13px', color: '#1890ff' }}>
                    <strong>数据保留说明：</strong><br/>
                    该作品累计 {deletingWork.views.toLocaleString()} 浏览、{deletingWork.likes.toLocaleString()} 点赞、{deletingWork.comments.toLocaleString()} 评论，数据将保留用于结算和复盘分析。
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-default" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                取消
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? '处理中...' : (deletingWork.status === 'published' ? '确认下架' : '确认删除')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Works;
