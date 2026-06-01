import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = '/api';

const shelfStatusMap = {
  draft: { label: '草稿', class: 'badge-draft' },
  review: { label: '审核中', class: 'badge-review' },
  published: { label: '已上架', class: 'badge-published' }
};

const episodeStatusMap = {
  uploaded: { label: '已上传', class: 'badge-uploaded' },
  pending_review: { label: '待审核', class: 'badge-pending_review' },
  approved: { label: '审核通过', class: 'badge-approved' },
  rejected: { label: '审核退回', class: 'badge-rejected' },
  distributed: { label: '已分发', class: 'badge-distributed' }
};

export default function DramaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drama, setDrama] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('episodes');
  const [epForm, setEpForm] = useState({
    episode_number: '',
    title: '',
    video_url: '',
    poster_url: '',
    preview_duration: 0,
    subtitle_file: '',
    plot_tags: '',
    review_notes: ''
  });
  const [showEpModal, setShowEpModal] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/dramas/${id}`).then(r => {
      setDrama(r.data.data);
      setLoading(false);
    });
  }, [id]);

  const handleAddEpisode = async () => {
    if (!epForm.episode_number) {
      alert('请输入集数');
      return;
    }
    await axios.post(`${API_BASE}/dramas/${id}/episodes`, epForm);
    setShowEpModal(false);
    setEpForm({
      episode_number: '',
      title: '',
      video_url: '',
      poster_url: '',
      preview_duration: 0,
      subtitle_file: '',
      plot_tags: '',
      review_notes: ''
    });
    axios.get(`${API_BASE}/dramas/${id}`).then(r => {
      setDrama(r.data.data);
    });
  };

  const updateEpStatus = async (epId, status) => {
    await axios.post(`${API_BASE}/episodes/${epId}/status`, { status });
    axios.get(`${API_BASE}/dramas/${id}`).then(r => {
      setDrama(r.data.data);
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">加载中...</div>
      </div>
    );
  }
  if (!drama) {
    return (
      <div className="card">
        <div className="card-body">未找到剧集</div>
      </div>
    );
  }

  const st = shelfStatusMap[drama.shelf_status] || shelfStatusMap.draft;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="action-link" onClick={() => navigate('/')}>← 返回</span>
            <span className="card-title">{drama.title}</span>
            <span className={`badge ${st.class}`}>{st.label}</span>
          </div>
        </div>
        <div className="card-body">
          <div className="detail-layout">
            <div>
              <img
                className="detail-cover"
                src={drama.cover_url || `https://picsum.photos/seed/drama${drama.id}/400/600`}
                alt={drama.title}
                onError={(e) => { e.target.src = 'https://picsum.photos/seed/default/400/600'; }}
              />
              <div style={{ marginTop: 16 }}>
                <div className="detail-info-row">
                  <span className="detail-info-label">题材：</span>
                  <span className="detail-info-value">{drama.genre || '-'}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">版权方：</span>
                  <span className="detail-info-value">{drama.copyright_holder || '-'}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">演员：</span>
                  <span className="detail-info-value">{drama.actors || '-'}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">分集数：</span>
                  <span className="detail-info-value">{drama.episode_count}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">付费方式：</span>
                  <span className="detail-info-value">
                    {drama.payment_type === 'free' ? '免费' : drama.payment_type === 'per_episode' ? '按集付费' : '会员专享'}
                  </span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">创建：</span>
                  <span className="detail-info-value">{drama.created_at}</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 16 }}>
                <div className="detail-info-label" style={{ marginBottom: 6 }}>剧情简介</div>
                <div style={{ lineHeight: 1.7, color: '#374151', padding: '12px 16px', background: '#f9fafb', borderRadius: 6 }}>
                  {drama.synopsis || '暂无简介'}
                </div>
              </div>

              <div className="tabs">
                <div className={`tab ${tab === 'episodes' ? 'active' : ''}`} onClick={() => setTab('episodes')}>
                  分集 ({drama.episodes?.length || 0})
                </div>
                <div className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
                  审核记录 ({drama.reviews?.length || 0})
                </div>
                <div className={`tab ${tab === 'distributions' ? 'active' : ''}`} onClick={() => setTab('distributions')}>
                  分发配置 ({drama.distributions?.length || 0})
                </div>
                <div className={`tab ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')}>
                  数据统计
                </div>
              </div>

              {tab === 'episodes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowEpModal(true)}>+ 添加分集</button>
                  </div>
                  {(!drama.episodes || drama.episodes.length === 0) ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🎬</div>
                      暂无分集
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>集数</th>
                            <th>标题</th>
                            <th>试看时长</th>
                            <th>标签</th>
                            <th>状态</th>
                            <th>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drama.episodes.map(ep => {
                            const est = episodeStatusMap[ep.status] || episodeStatusMap.uploaded;
                            return (
                              <tr key={ep.id}>
                                <td>第{ep.episode_number}集</td>
                                <td>{ep.title}</td>
                                <td>{ep.preview_duration}秒</td>
                                <td>
                                  {ep.plot_tags && ep.plot_tags.split(',').filter(Boolean).map((t, i) => (
                                    <span key={i} className="tag">{t}</span>
                                  ))}
                                </td>
                                <td>
                                  <span className={`badge ${est.class}`}>{est.label}</span>
                                </td>
                                <td>
                                  {ep.status === 'uploaded' && (
                                    <span className="action-link" onClick={() => updateEpStatus(ep.id, 'pending_review')}>送审</span>
                                  )}
                                  {ep.status === 'pending_review' && (
                                    <span className="action-link" onClick={() => updateEpStatus(ep.id, 'uploaded')}>撤回</span>
                                  )}
                                  {ep.status === 'approved' && (
                                    <span className="action-link" onClick={() => updateEpStatus(ep.id, 'distributed')}>分发</span>
                                  )}
                                  {ep.status === 'distributed' && (
                                    <span className="action-link" onClick={() => updateEpStatus(ep.id, 'approved')}>撤回</span>
                                  )}
                                  {(ep.status === 'rejected' || ep.status === 'approved') && (
                                    <span className="action-link" onClick={() => updateEpStatus(ep.id, 'uploaded')}>重传</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  {(!drama.reviews || drama.reviews.length === 0) ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      暂无审核记录
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>分集</th>
                            <th>审核人</th>
                            <th>版权</th>
                            <th>敏感</th>
                            <th>画质</th>
                            <th>字幕</th>
                            <th>付费</th>
                            <th>结果</th>
                            <th>时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drama.reviews.map(r => {
                            const ep = drama.episodes?.find(e => e.id === r.episode_id);
                            return (
                              <tr key={r.id}>
                                <td>{ep ? `第${ep.episode_number}集` : '整剧'}</td>
                                <td>{r.reviewer || '-'}</td>
                                <td>{r.copyright_check ? '✅' : '❌'}</td>
                                <td>{r.sensitive_content_check ? '✅' : '❌'}</td>
                                <td>{r.quality_check ? '✅' : '❌'}</td>
                                <td>{r.subtitle_check ? '✅' : '❌'}</td>
                                <td>{r.payment_config_check ? '✅' : '❌'}</td>
                                <td>
                                  <span className={`badge ${r.overall_result === 'approved' ? 'badge-approved' : r.overall_result === 'rejected' ? 'badge-rejected' : 'badge-pending_review'}`}>
                                    {r.overall_result === 'approved' ? '通过' : r.overall_result === 'rejected' ? '退回' : '待定'}
                                  </span>
                                </td>
                                <td>{r.created_at}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'distributions' && (
                <div>
                  {(!drama.distributions || drama.distributions.length === 0) ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🚀</div>
                      暂无分发配置
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>分集</th>
                            <th>推荐位</th>
                            <th>活动</th>
                            <th>解锁价</th>
                            <th>会员权益</th>
                            <th>渠道</th>
                            <th>版本</th>
                            <th>时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drama.distributions.map(d => {
                            const ep = drama.episodes?.find(e => e.id === d.episode_id);
                            return (
                              <tr key={d.id}>
                                <td>{ep ? `第${ep.episode_number}集` : '整剧'}</td>
                                <td>{d.recommendation_slot || '-'}</td>
                                <td>{d.campaign || '-'}</td>
                                <td>¥{d.unlock_price}</td>
                                <td>{d.member_benefit || '-'}</td>
                                <td>{d.distribution_channel || '-'}</td>
                                <td>v{d.version}</td>
                                <td>{d.created_at}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'analytics' && (
                <div>
                  {(!drama.analytics || drama.analytics.length === 0) ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">📊</div>
                      暂无数据
                    </div>
                  ) : (
                    <div>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-label">总播放量</div>
                          <div className="stat-value">{drama.analytics.reduce((s, a) => s + a.play_count, 0).toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-label">完播量</div>
                          <div className="stat-value">{drama.analytics.reduce((s, a) => s + a.completion_count, 0).toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-label">付费转化</div>
                          <div className="stat-value">{drama.analytics.reduce((s, a) => s + a.payment_conversion, 0).toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-label">退订/投诉</div>
                          <div className="stat-value">{drama.analytics.reduce((s, a) => s + a.cancellation_count + a.complaint_count, 0).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>分集</th>
                              <th>播放</th>
                              <th>完播</th>
                              <th>转化</th>
                              <th>退订</th>
                              <th>投诉</th>
                              <th>流失点(秒)</th>
                              <th>日期</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drama.analytics.map(a => {
                              const ep = drama.episodes?.find(e => e.id === a.episode_id);
                              return (
                                <tr key={a.id}>
                                  <td>{ep ? `第${ep.episode_number}集` : '-'}</td>
                                  <td>{a.play_count.toLocaleString()}</td>
                                  <td>{a.completion_count.toLocaleString()}</td>
                                  <td>{a.payment_conversion.toLocaleString()}</td>
                                  <td>{a.cancellation_count}</td>
                                  <td>{a.complaint_count}</td>
                                  <td>{a.dropoff_point}s</td>
                                  <td>{a.stat_date}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEpModal && (
        <div className="modal-overlay" onClick={() => setShowEpModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">添加分集</span>
              <button className="modal-close" onClick={() => setShowEpModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-item">
                  <label className="form-label">集数 *</label>
                  <input
                    className="form-input"
                    type="number"
                    value={epForm.episode_number}
                    onChange={e => setEpForm({...epForm, episode_number: parseInt(e.target.value) || ''})}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">标题</label>
                  <input
                    className="form-input"
                    value={epForm.title}
                    onChange={e => setEpForm({...epForm, title: e.target.value})}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">视频URL</label>
                  <input
                    className="form-input"
                    value={epForm.video_url}
                    onChange={e => setEpForm({...epForm, video_url: e.target.value})}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">海报URL</label>
                  <input
                    className="form-input"
                    value={epForm.poster_url}
                    onChange={e => setEpForm({...epForm, poster_url: e.target.value})}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">试看时长(秒)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={epForm.preview_duration}
                    onChange={e => setEpForm({...epForm, preview_duration: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-item">
                  <label className="form-label">字幕文件</label>
                  <input
                    className="form-input"
                    value={epForm.subtitle_file}
                    onChange={e => setEpForm({...epForm, subtitle_file: e.target.value})}
                  />
                </div>
                <div className="form-item form-item-full">
                  <label className="form-label">剧情标签</label>
                  <input
                    className="form-input"
                    value={epForm.plot_tags}
                    onChange={e => setEpForm({...epForm, plot_tags: e.target.value})}
                    placeholder="多个标签用逗号分隔"
                  />
                </div>
                <div className="form-item form-item-full">
                  <label className="form-label">审核备注</label>
                  <textarea
                    className="form-textarea"
                    value={epForm.review_notes}
                    onChange={e => setEpForm({...epForm, review_notes: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowEpModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddEpisode}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
