import { useState, useEffect } from 'react';
import api from '../services/api';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [conflictCheck, setConflictCheck] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [formData, setFormData] = useState({
    candidate_id: '',
    position_id: '',
    recommendation_notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.candidate_id && formData.position_id) {
      checkConflict();
    } else {
      setConflictCheck(null);
    }
  }, [formData.candidate_id, formData.position_id]);

  const loadData = async () => {
    try {
      const [recRes, canRes, posRes] = await Promise.all([
        api.get('/recommendations'),
        api.get('/candidates'),
        api.get('/positions')
      ]);
      setRecommendations(recRes.data);
      setCandidates(canRes.data);
      setPositions(posRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkConflict = async () => {
    if (!formData.candidate_id || !formData.position_id) return;
    setCheckingConflict(true);
    try {
      const position = positions.find(p => p.id === parseInt(formData.position_id));
      const response = await api.get('/recommendations/check', {
        params: {
          candidate_id: formData.candidate_id,
          client_id: position?.client_id,
          position_id: formData.position_id
        }
      });
      setConflictCheck(response.data);
    } catch (err) {
      console.error('检查冲突失败:', err);
    } finally {
      setCheckingConflict(false);
    }
  };

  const loadRecommendationDetail = async (id) => {
    try {
      const response = await api.get(`/recommendations/${id}`);
      setSelectedRecommendation(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('加载推荐详情失败:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/recommendations/${id}`, { status });
      loadData();
      if (selectedRecommendation) {
        loadRecommendationDetail(id);
      }
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (conflictCheck?.hasConflict) {
      if (!window.confirm('该候选人已被推荐到同一客户或职位，确认继续推荐吗？')) {
        return;
      }
    }
    try {
      await api.post('/recommendations', formData);
      loadData();
      setShowModal(false);
      setFormData({ candidate_id: '', position_id: '', recommendation_notes: '' });
      setConflictCheck(null);
    } catch (err) {
      console.error('创建推荐失败:', err);
    }
  };

  const handleAddInterview = async (recId, data) => {
    try {
      await api.post(`/recommendations/${recId}/interviews`, data);
      loadRecommendationDetail(recId);
    } catch (err) {
      console.error('创建面试失败:', err);
    }
  };

  const handleUpdateInterview = async (id, data) => {
    try {
      await api.put(`/interviews/${id}`, data);
      loadRecommendationDetail(selectedRecommendation.id);
    } catch (err) {
      console.error('更新面试失败:', err);
    }
  };

  const handleAddOffer = async (recId, data) => {
    try {
      await api.post(`/recommendations/${recId}/offers`, data);
      loadRecommendationDetail(recId);
    } catch (err) {
      console.error('创建Offer失败:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'client_review': return '#3498db';
      case 'interview': return '#27ae60';
      case 'offer': return '#9b59b6';
      case 'accepted': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'failed': return '#7f8c8d';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'client_review': return '客户审核中';
      case 'interview': return '面试中';
      case 'offer': return '已发Offer';
      case 'accepted': return '已接受';
      case 'rejected': return '已拒绝';
      case 'failed': return '失败';
      default: return status;
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>推荐管理</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + 新增推荐
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>候选人</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>职位 / 客户</th>
              <th style={{ textAlign: 'left', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>顾问</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>状态</th>
              <th style={{ textAlign: 'center', padding: '15px 20px', color: '#7f8c8d', fontWeight: '600' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '15px 20px', fontWeight: '500' }}>{rec.candidate_name}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <div>{rec.position_title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{rec.client_name}</div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>{rec.consultant_name || '-'}</td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getStatusColor(rec.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {getStatusText(rec.status)}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => loadRecommendationDetail(rec.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无推荐数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
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
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>新增推荐</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>候选人 *</label>
                <select
                  value={formData.candidate_id}
                  onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  required
                >
                  <option value="">选择候选人</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.current_company || '无公司'}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>职位 *</label>
                <select
                  value={formData.position_id}
                  onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  required
                >
                  <option value="">选择职位</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title} - {p.client_name}</option>
                  ))}
                </select>
              </div>

              {checkingConflict && (
                <div style={{ marginBottom: '15px', padding: '10px', background: '#e8f4fd', borderRadius: '6px' }}>
                  正在检查重复推荐...
                </div>
              )}

              {conflictCheck?.hasConflict && (
                <div style={{ marginBottom: '15px', padding: '12px', background: '#fef5e7', border: '1px solid #f39c12', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '500', color: '#e67e22', marginBottom: '8px' }}>⚠️ 发现重复推荐风险</div>
                  {conflictCheck.existingRecommendations.map((rec, index) => (
                    <div key={index} style={{ fontSize: '13px', marginBottom: '4px' }}>
                      {rec.candidate_name} 已被推荐到 {rec.client_name} - {rec.position_title}
                    </div>
                  ))}
                  {conflictCheck.conflictClientPositions.length > 0 && (
                    <div style={{ fontSize: '13px', marginTop: '8px', color: '#e67e22' }}>
                      该客户还有其他开放职位，请注意避免重复推荐
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>推荐说明</label>
                <textarea
                  value={formData.recommendation_notes}
                  onChange={(e) => setFormData({ ...formData, recommendation_notes: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setConflictCheck(null); setFormData({ candidate_id: '', position_id: '', recommendation_notes: '' }); }}
                  style={{ padding: '10px 20px', background: '#ecf0f1', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                >
                  提交推荐
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedRecommendation && (
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
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>推荐详情</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>候选人</div>
                <div style={{ fontWeight: '500' }}>{selectedRecommendation.candidate_name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{selectedRecommendation.candidate_phone} / {selectedRecommendation.candidate_email}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>职位 / 客户</div>
                <div style={{ fontWeight: '500' }}>{selectedRecommendation.position_title}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{selectedRecommendation.client_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>薪资范围</div>
                <div style={{ fontWeight: '500' }}>{selectedRecommendation.salary_min || '-'}-{selectedRecommendation.salary_max || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>状态</div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: getStatusColor(selectedRecommendation.status),
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {getStatusText(selectedRecommendation.status)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>更新状态</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['pending', 'client_review', 'interview', 'offer', 'accepted', 'rejected', 'failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(selectedRecommendation.id, status)}
                    style={{
                      padding: '6px 12px',
                      background: selectedRecommendation.status === status ? getStatusColor(status) : '#ecf0f1',
                      color: selectedRecommendation.status === status ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {getStatusText(status)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>时间线</div>
              {selectedRecommendation.timeline && selectedRecommendation.timeline.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  {selectedRecommendation.timeline.map((event, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '15px', paddingLeft: '20px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0', top: '5px', width: '10px', height: '10px', borderRadius: '50%', background: '#3498db' }} />
                      {index < selectedRecommendation.timeline.length - 1 && (
                        <div style={{ position: 'absolute', left: '4px', top: '20px', width: '2px', height: 'calc(100% + 5px)', background: '#ecf0f1' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '500' }}>{event.event_title}</span>
                          <span style={{ fontSize: '12px', color: '#999' }}>{new Date(event.event_time).toLocaleString()}</span>
                        </div>
                        {event.event_description && (
                          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{event.event_description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '14px' }}>暂无时间线记录</div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setShowDetailModal(false)} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
