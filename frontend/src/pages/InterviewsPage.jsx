import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsAPI, interviewsAPI as interviewsApi } from '../utils/api.js';

function InterviewsPage({ role }) {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    loadInterviews();
  }, [role]);

  const loadInterviews = async () => {
    try {
      const res = role === 'seeker'
        ? await interviewsAPI.mySeekerInterviews()
        : await interviewsApi.myCompanyInterviews();
      setInterviews(res.data);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id, confirmed) => {
    try {
      await interviewsAPI.confirm(id, confirmed);
      loadInterviews();
      alert(confirmed ? '已确认接受面试邀约' : '已拒绝面试邀约');
    } catch (err) {
      alert('操作失败');
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await interviewsAPI.get(id);
      setSelectedInterview(res.data);
    } catch (err) {
      console.error('加载详情失败:', err);
    }
  };

  if (loading) return <div className="empty-state">加载中...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>
        {role === 'seeker' ? '📬 我的面试邀约' : '📞 面试管理'}
      </h1>

      {interviews.length === 0 ? (
        <div className="empty-state">
          <div>📭</div>
          <p>{role === 'seeker' ? '暂无面试邀约' : '暂无面试安排'}</p>
        </div>
      ) : (
        <div className="job-list">
          {interviews.map(iv => (
            <div key={iv.id} className="job-card" onClick={() => loadDetail(iv.id)}>
              <div className="job-card-header">
                <div>
                  <h3 className="job-title">
                    {role === 'seeker' ? iv.title : `${iv.seeker_name} - ${iv.title}`}
                  </h3>
                  <div className="job-company">
                    {role === 'seeker' ? `🏢 ${iv.company_name}` : `📱 ${iv.phone}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>面试时间</div>
                  <div style={{ fontWeight: '500', color: '#374151' }}>
                    {new Date(iv.interview_time).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>

              {role === 'seeker' && (
                <>
                  <div className="sidebar-card" style={{ marginTop: '1rem' }}>
                    <p><strong>📍 面试地点：</strong>{iv.work_address}</p>
                    <p><strong>👥 离职率：</strong>{(iv.turnover_rate * 100).toFixed(1)}%</p>
                    <p><strong>🛡️ 社保率：</strong>{(iv.social_insurance_rate * 100).toFixed(1)}%</p>
                  </div>

                  {iv.key_promises && iv.key_promises.length > 0 && (
                    <div className="detail-section" style={{ marginTop: '1rem' }}>
                      <h4 style={{ marginBottom: '0.8rem', color: '#d97706' }}>📋 平台提取的关键承诺点</h4>
                      {iv.key_promises.map((p, idx) => (
                        <div key={idx} className="promise-item">{p}</div>
                      ))}
                      <div className="form-hint" style={{ marginTop: '0.5rem' }}>
                        * 以上内容提取自平台电话录音，如有异议请联系平台客服
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="job-footer" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {iv.confirmed_by_company ? (
                    <span className="status-badge active">企业已确认</span>
                  ) : (
                    <span className="status-badge pending">待企业确认</span>
                  )}
                  {iv.confirmed_by_seeker ? (
                    <span className="status-badge active">求职者已确认</span>
                  ) : (
                    <span className="status-badge pending">待求职者确认</span>
                  )}
                </div>

                {role === 'seeker' && !iv.confirmed_by_seeker && (
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleConfirm(iv.id, true); }}
                    >
                      ✓ 接受
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleConfirm(iv.id, false); }}
                    >
                      ✗ 拒绝
                    </button>
                  </div>
                )}

                {role === 'seeker' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/ar-navigate/${iv.job_id}`); }}
                  >
                    🧭 AR导航
                  </button>
                )}
              </div>

              {iv.call_summary && (
                <div className="interview-recording" style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>📝 通话摘要（录音存档）</h4>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {iv.call_summary}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                    <span>🔴</span>
                    <span>平台已对本次通话进行录音存档，可作为纠纷处理依据</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedInterview && (
        <div className="modal-overlay" onClick={() => setSelectedInterview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📋 面试详情</h3>
            <div className="form-group">
              <p><strong>职位：</strong>{selectedInterview.title}</p>
              <p><strong>面试时间：</strong>{new Date(selectedInterview.interview_time).toLocaleString('zh-CN')}</p>
              <p><strong>面试地点：</strong>{selectedInterview.work_address || selectedInterview.end_point}</p>
            </div>
            {selectedInterview.call_summary && (
              <div className="form-group">
                <label>📝 通话摘要</label>
                <p style={{ background: '#f9fafb', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                  {selectedInterview.call_summary}
                </p>
              </div>
            )}
            {selectedInterview.key_promises && selectedInterview.key_promises.length > 0 && (
              <div className="form-group">
                <label>🔑 提取的关键承诺点</label>
                {selectedInterview.key_promises.map((p, idx) => (
                  <div key={idx} className="promise-item">{p}</div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedInterview(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewsPage;
