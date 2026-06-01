import { useState, useEffect } from 'react';
import api from '../api.js';

function Admin() {
  const [pendingNotes, setPendingNotes] = useState([]);
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [rejectedNotes, setRejectedNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedNote, setSelectedNote] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNoteId, setApproveNoteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('admin/notes/pending'),
      api.get('admin/notes/approved'),
      api.get('admin/notes/rejected')
    ])
      .then(([pendingRes, approvedRes, rejectedRes]) => {
        setPendingNotes(pendingRes.data || []);
        setApprovedNotes(approvedRes.data || []);
        setRejectedNotes(rejectedRes.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleApprove = (noteId) => {
    setApproveNoteId(noteId);
    setShowApproveModal(true);
  };

  const confirmApprove = () => {
    setActionLoading(true);
    api.post(`/admin/notes/${approveNoteId}/audit`, { status: 1, reason: '审核通过' })
      .then(() => {
        showToast('✅ 审核通过！笔记已发布到首页');
        setShowApproveModal(false);
        setApproveNoteId(null);
        loadData();
      })
      .catch(err => {
        showToast('❌ 操作失败：' + (err.response?.data?.error || err.message), 'error');
      })
      .finally(() => setActionLoading(false));
  };

  const handleReject = (noteId) => {
    setSelectedNote(noteId);
    setRejectReason('');
    setCustomReason('');
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    const finalReason = rejectReason === '其他' ? customReason : rejectReason;
    if (!finalReason || !finalReason.trim()) {
      showToast('❌ 请填写驳回原因', 'error');
      return;
    }
    setActionLoading(true);
    api.post(`admin/notes/${selectedNote}/audit`, { status: 2, reason: finalReason })
      .then(() => {
        showToast('✅ 已驳回，原因已记录');
        setShowRejectModal(false);
        setRejectReason('');
        setCustomReason('');
        loadData();
      })
      .catch(err => {
        showToast('❌ 操作失败：' + (err.response?.data?.error || err.message), 'error');
      })
      .finally(() => setActionLoading(false));
  };

  const renderNoteCard = (note, showActions = false) => (
    <div
      key={note.id}
      className="audit-item"
      style={{ borderLeft: `4px solid ${note.status === 1 ? '#10b981' : note.status === 2 ? '#ef4444' : '#f59e0b'}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{note.title}</h3>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          background: note.status === 1 ? '#dcfce7' : note.status === 2 ? '#fee2e2' : '#fef3c7',
          color: note.status === 1 ? '#166534' : note.status === 2 ? '#991b1b' : '#92400e'
        }}>
          {note.status === 1 ? '✓ 已通过' : note.status === 2 ? '✗ 已驳回' : '⏳ 待审核'}
        </span>
      </div>

      <p style={{ color: '#666', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
        <span style={{ marginRight: '1rem' }}>👤 {note.nickname || '匿名用户'}</span>
        <span style={{ marginRight: '1rem' }}>📍 {note.poi_name || '未关联商家'}</span>
        <span>🕐 {new Date(note.created_at).toLocaleString()}</span>
      </p>

      {note.images && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {note.images.split(',').slice(0, 4).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => window.open(img, '_blank')}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ))}
          {note.images.split(',').length > 4 && (
            <div style={{
              width: '120px',
              height: '120px',
              background: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              +{note.images.split(',').length - 4}
            </div>
          )}
        </div>
      )}

      <p style={{ lineHeight: 1.6, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
        {note.content?.substring(0, 300)}
        {note.content?.length > 300 && '...'}
      </p>

      {note.risk_tips && (
        <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
          <strong style={{ color: '#dc2626' }}>⚠️ 避坑提示：</strong>
          <span style={{ color: '#666' }}>{note.risk_tips}</span>
        </div>
      )}

      {note.reason && note.status === 2 && (
        <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', borderLeft: '3px solid #ef4444' }}>
          <strong style={{ color: '#991b1b' }}>📋 驳回原因：</strong>
          <span style={{ color: '#666' }}>{note.reason}</span>
        </div>
      )}

      {showActions && note.status === 0 && (
        <div className="audit-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
          <button
            className="btn btn-approve"
            onClick={() => handleApprove(note.id)}
            disabled={actionLoading}
            style={{ flex: 1, fontSize: '1rem', padding: '0.8rem' }}
          >
            ✓ 通过审核
          </button>
          <button
            className="btn btn-reject"
            onClick={() => handleReject(note.id)}
            disabled={actionLoading}
            style={{ flex: 1, fontSize: '1rem', padding: '0.8rem' }}
          >
            ✗ 驳回
          </button>
        </div>
      )}
    </div>
  );

  const getCurrentList = () => {
    switch (activeTab) {
      case 'pending': return pendingNotes;
      case 'approved': return approvedNotes;
      case 'rejected': return rejectedNotes;
      default: return [];
    }
  };

  return (
    <div className="admin-panel">
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: toastMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: toastMsg.type === 'success' ? '#166534' : '#991b1b',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          fontWeight: 500,
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s'
        }}>
          {toastMsg.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>🛡️ 内容审核后台</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            待审核: <strong style={{ color: '#f59e0b' }}>{pendingNotes.length}</strong> |{' '}
            已通过: <strong style={{ color: '#10b981' }}>{approvedNotes.length}</strong> |{' '}
            已驳回: <strong style={{ color: '#ef4444' }}>{rejectedNotes.length}</strong>
          </div>
          <button className="btn btn-outline" onClick={loadData} disabled={loading}>
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="category-tabs" style={{ marginBottom: '1.5rem' }}>
        <div
          className={`category-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          style={{
            background: activeTab === 'pending' ? '#f59e0b' : undefined,
            borderColor: activeTab === 'pending' ? '#f59e0b' : undefined,
            color: activeTab === 'pending' ? 'white' : undefined
          }}
        >
          ⏳ 待审核 ({pendingNotes.length})
        </div>
        <div
          className={`category-tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
          style={{
            background: activeTab === 'approved' ? '#10b981' : undefined,
            borderColor: activeTab === 'approved' ? '#10b981' : undefined,
            color: activeTab === 'approved' ? 'white' : undefined
          }}
        >
          ✓ 已通过 ({approvedNotes.length})
        </div>
        <div
          className={`category-tab ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
          style={{
            background: activeTab === 'rejected' ? '#ef4444' : undefined,
            borderColor: activeTab === 'rejected' ? '#ef4444' : undefined,
            color: activeTab === 'rejected' ? 'white' : undefined
          }}
        >
          ✗ 已驳回 ({rejectedNotes.length})
        </div>
      </div>

      {activeTab === 'pending' && (
        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <strong>📋 审核标准：</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#666' }}>
            <li>内容真实有效，无虚假宣传</li>
            <li>图片清晰，无水印、二维码等广告信息</li>
            <li>无违规敏感词、低俗色情内容</li>
            <li>非抄袭搬运，具有原创性和参考价值</li>
          </ul>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          加载中...
        </div>
      ) : getCurrentList().length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '📋' : '📭'}
          </div>
          <p>
            {activeTab === 'pending' ? '暂无待审核内容' :
             activeTab === 'approved' ? '暂无已通过内容' : '暂无已驳回内容'}
          </p>
        </div>
      ) : (
        <div>
          {getCurrentList().map(note => renderNoteCard(note, activeTab === 'pending'))}
        </div>
      )}

      {showApproveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '420px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#10b981' }}>✓ 确认通过审核</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>确定通过此笔记审核吗？通过后将在首页展示。</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowApproveModal(false); setApproveNoteId(null); }}
                disabled={actionLoading}
              >
                取消
              </button>
              <button
                className="btn btn-approve"
                style={{ flex: 1 }}
                onClick={confirmApprove}
                disabled={actionLoading}
              >
                {actionLoading ? '处理中...' : '确认通过'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#ef4444' }}>✗ 驳回笔记</h3>
            <p style={{ color: '#666', marginBottom: '1rem' }}>请选择或填写驳回原因，帮助作者改进内容质量</p>
            <select
              className="form-select"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ marginBottom: '1rem' }}
            >
              <option value="">-- 选择驳回原因 --</option>
              <option value="内容虚假或不实">内容虚假或不实</option>
              <option value="图片含有广告水印/二维码">图片含有广告水印/二维码</option>
              <option value="涉嫌抄袭搬运">涉嫌抄袭搬运</option>
              <option value="含有违规敏感内容">含有违规敏感内容</option>
              <option value="质量过低/无参考价值">质量过低/无参考价值</option>
              <option value="其他">其他（请在下方说明）</option>
            </select>
            {rejectReason === '其他' && (
              <textarea
                className="form-textarea"
                placeholder="请详细说明驳回原因..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{ marginBottom: '1rem', minHeight: '80px' }}
                autoFocus
              />
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setCustomReason('');
                }}
                disabled={actionLoading}
              >
                取消
              </button>
              <button
                className="btn btn-reject"
                style={{ flex: 1 }}
                onClick={confirmReject}
                disabled={actionLoading || (!rejectReason || (rejectReason === '其他' && !customReason.trim()))}
              >
                {actionLoading ? '处理中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
