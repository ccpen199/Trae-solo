import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { rectificationsApi } from '../api.js';

const statusLabels = {
  pending: '待开始',
  in_progress: '进行中',
  submitted: '待复核',
  approved: '已通过',
  rejected: '已驳回'
};

function RectificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rect, setRect] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [reviewForm, setReviewForm] = useState({ conclusion: 'pass', review_comment: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await rectificationsApi.get(id);
      if (res.data.success) {
        setRect(res.data.data);
      }
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const res = await rectificationsApi.start(id, { user_id: 1 });
      if (res.data.success) {
        setMessage({ type: 'success', text: '已开始整改' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await rectificationsApi.submit(id, { 
        user_id: 1,
        completion_note: completionNote
      });
      if (res.data.success) {
        setShowSubmitModal(false);
        setCompletionNote('');
        setMessage({ type: 'success', text: '整改已提交复核' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleReview = async () => {
    try {
      const res = await rectificationsApi.review(id, { 
        user_id: 3,
        ...reviewForm
      });
      if (res.data.success) {
        setShowReviewModal(false);
        setReviewForm({ conclusion: 'pass', review_comment: '' });
        setMessage({ type: 'success', text: reviewForm.conclusion === 'pass' ? '整改已通过' : '整改已驳回' });
        loadData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!rect) return <div>整改记录不存在</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/rectifications">整改跟踪</Link> / {rect.title}
      </div>

      <div className="page-header">
        <h2>整改详情 - {rect.title}</h2>
        <div>
          {rect.status === 'pending' && (
            <button className="btn btn-primary" onClick={handleStart} style={{ marginRight: '8px' }}>
              开始整改
            </button>
          )}
          {rect.status === 'in_progress' && (
            <button className="btn btn-warning" onClick={() => setShowSubmitModal(true)} style={{ marginRight: '8px' }}>
              提交复核
            </button>
          )}
          {rect.status === 'submitted' && (
            <button className="btn btn-success" onClick={() => setShowReviewModal(true)} style={{ marginRight: '8px' }}>
              复核
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/rectifications')}>返回</button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <h3>基本信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>ID</div>
            <div style={{ fontWeight: 'bold' }}>{rect.id}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>状态</div>
            <div><span className={`status-badge status-${rect.status}`}>{statusLabels[rect.status]}</span></div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>负责人</div>
            <div>{rect.assignee_name || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>关联风险</div>
            <div>{rect.risk_title || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>创建人</div>
            <div>{rect.creator_name || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#7f8c8d', fontSize: '14px' }}>创建时间</div>
            <div>{new Date(rect.created_at).toLocaleString()}</div>
          </div>
        </div>
        {rect.description && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>整改描述</div>
            <div>{rect.description}</div>
          </div>
        )}
        {rect.action_plan && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>整改方案</div>
            <div style={{ background: '#e8f4fd', padding: '12px', borderRadius: '4px' }}>{rect.action_plan}</div>
          </div>
        )}
        {rect.completion_note && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '8px' }}>完成说明</div>
            <div style={{ background: '#d4edda', padding: '12px', borderRadius: '4px' }}>{rect.completion_note}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>复核记录</h3>
        {rect.evidences?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>复核人</th>
                <th>结论</th>
                <th>意见</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {rect.evidences.map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.reviewer_name || '-'}</td>
                  <td><span className={`status-badge status-${e.conclusion === 'pass' ? 'approved' : 'rejected'}`}>
                    {e.conclusion === 'pass' ? '通过' : e.conclusion === 'fail' ? '驳回' : '需补充'}
                  </span></td>
                  <td>{e.review_comment || '-'}</td>
                  <td>{new Date(e.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无复核记录</div>
        )}
      </div>

      <div className="card">
        <h3>操作日志</h3>
        {rect.logs?.length > 0 ? (
          <div className="timeline">
            {rect.logs.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="time">{new Date(log.created_at).toLocaleString()}</div>
                <div className="action">{log.action}</div>
                <div className="user">操作人: {log.user_name || '-'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无操作日志</div>
        )}
      </div>

      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>提交整改复核</h3>
            <div className="form-group">
              <label>完成说明</label>
              <textarea 
                value={completionNote}
                onChange={e => setCompletionNote(e.target.value)}
                placeholder="请描述整改完成情况"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>提交</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>整改复核</h3>
            <div className="form-group">
              <label>复核结论</label>
              <select 
                value={reviewForm.conclusion}
                onChange={e => setReviewForm({ ...reviewForm, conclusion: e.target.value })}
              >
                <option value="pass">通过</option>
                <option value="fail">驳回</option>
                <option value="need_more">需补充材料</option>
              </select>
            </div>
            <div className="form-group">
              <label>复核意见</label>
              <textarea 
                value={reviewForm.review_comment}
                onChange={e => setReviewForm({ ...reviewForm, review_comment: e.target.value })}
                placeholder="请输入复核意见"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReview}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RectificationDetail;
