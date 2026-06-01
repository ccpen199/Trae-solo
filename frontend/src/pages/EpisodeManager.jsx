import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = '/api';

const episodeStatusMap = {
  uploaded: { label: '已上传', class: 'badge-uploaded' },
  pending_review: { label: '待审核', class: 'badge-pending_review' },
  approved: { label: '审核通过', class: 'badge-approved' },
  rejected: { label: '审核退回', class: 'badge-rejected' },
  distributed: { label: '已分发', class: 'badge-distributed' }
};

export default function EpisodeManager() {
  const [dramas, setDramas] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrama, setSelectedDrama] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEp, setEditingEp] = useState(null);
  const [epForm, setEpForm] = useState({
    episode_number: '',
    title: '',
    video_url: '',
    poster_url: '',
    preview_duration: 0,
    subtitle_file: '',
    plot_tags: '',
    review_notes: '',
    status: 'uploaded'
  });

  useEffect(() => {
    axios.get(`${API_BASE}/dramas`).then(r => {
      setDramas(r.data.data || []);
      setLoading(false);
    });
    if (selectedDrama) {
      axios.get(`${API_BASE}/dramas/${selectedDrama}/episodes`).then(r => {
        setEpisodes(r.data.data || []);
      });
    }
  }, [selectedDrama]);

  const filtered = episodes.filter(e => !statusFilter || e.status === statusFilter);

  const handleSave = async () => {
    if (!selectedDrama) {
      alert('请先选择剧集');
      return;
    }
    if (editingEp) {
      await axios.put(`${API_BASE}/episodes/${editingEp}`, epForm);
    } else {
      await axios.post(`${API_BASE}/dramas/${selectedDrama}/episodes`, epForm);
    }
    setShowModal(false);
    setEditingEp(null);
    axios.get(`${API_BASE}/dramas/${selectedDrama}/episodes`).then(r => {
      setEpisodes(r.data.data || []);
    });
  };

  const handleEdit = (ep) => {
    setEditingEp(ep.id);
    setEpForm({
      episode_number: ep.episode_number,
      title: ep.title,
      video_url: ep.video_url,
      poster_url: ep.poster_url,
      preview_duration: ep.preview_duration,
      subtitle_file: ep.subtitle_file,
      plot_tags: ep.plot_tags,
      review_notes: ep.review_notes,
      status: ep.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该分集？')) return;
    await axios.delete(`${API_BASE}/episodes/${id}`);
    axios.get(`${API_BASE}/dramas/${selectedDrama}/episodes`).then(r => {
      setEpisodes(r.data.data || []);
    });
  };

  const openAdd = () => {
    if (!selectedDrama) {
      alert('请先选择剧集');
      return;
    }
    setEditingEp(null);
    setEpForm({
      episode_number: '',
      title: '',
      video_url: '',
      poster_url: '',
      preview_duration: 0,
      subtitle_file: '',
      plot_tags: '',
      review_notes: '',
      status: 'uploaded'
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">分集管理</div>
          <button className="btn btn-primary" onClick={openAdd}>+ 添加分集</button>
        </div>
        <div className="card-body">
          <div className="search-bar">
            <select
              className="form-input"
              style={{ maxWidth: 200 }}
              value={selectedDrama}
              onChange={e => setSelectedDrama(e.target.value)}
            >
              <option value="">选择剧集...</option>
              {dramas.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ maxWidth: 150 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="uploaded">已上传</option>
              <option value="pending_review">待审核</option>
              <option value="approved">审核通过</option>
              <option value="rejected">审核退回</option>
              <option value="distributed">已分发</option>
            </select>
            {selectedDrama && (
              <span style={{ color: '#9ca3af' }}>共 {filtered.length} 集</span>
            )}
          </div>

          {!selectedDrama ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎬</div>
              请先选择剧集
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              暂无分集数据
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>集数</th>
                    <th>标题</th>
                    <th>海报</th>
                    <th>视频</th>
                    <th>试看</th>
                    <th>字幕</th>
                    <th>标签</th>
                    <th>状态</th>
                    <th>审核备注</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ep => {
                    const est = episodeStatusMap[ep.status] || episodeStatusMap.uploaded;
                    return (
                      <tr key={ep.id}>
                        <td>第{ep.episode_number}集</td>
                        <td>{ep.title || '-'}</td>
                        <td>
                          {ep.poster_url ? (
                            <img src={ep.poster_url} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                          ) : '-'}
                        </td>
                        <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ep.video_url || '-'}
                        </td>
                        <td>{ep.preview_duration}s</td>
                        <td>{ep.subtitle_file ? '✓' : '-'}</td>
                        <td>
                          {ep.plot_tags && ep.plot_tags.split(',').filter(Boolean).map((t, i) => (
                            <span key={i} className="tag">{t}</span>
                          ))}
                        </td>
                        <td>
                          <span className={`badge ${est.class}`}>{est.label}</span>
                        </td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#6b7280' }}>
                          {ep.review_notes || '-'}
                        </td>
                        <td>
                          <span className="action-link" onClick={() => handleEdit(ep)}>编辑</span>
                          <span className="action-link action-link-danger" onClick={() => handleDelete(ep.id)}>删除</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: 20
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '100%',
              maxWidth: 640,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              zIndex: 1000000
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                {editingEp ? '编辑分集' : '添加分集'}
              </span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  color: '#9ca3af',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
                onClick={() => setShowModal(false)}
              >×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px 20px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>集数</label>
                  <input
                    type="number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.episode_number}
                    onChange={e => setEpForm({...epForm, episode_number: parseInt(e.target.value) || ''})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>标题</label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.title}
                    onChange={e => setEpForm({...epForm, title: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>视频URL</label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.video_url}
                    onChange={e => setEpForm({...epForm, video_url: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>海报URL</label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.poster_url}
                    onChange={e => setEpForm({...epForm, poster_url: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>试看时长(秒)</label>
                  <input
                    type="number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.preview_duration}
                    onChange={e => setEpForm({...epForm, preview_duration: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>字幕文件URL</label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.subtitle_file}
                    onChange={e => setEpForm({...epForm, subtitle_file: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>分集状态</label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.status}
                    onChange={e => setEpForm({...epForm, status: e.target.value})}
                  >
                    <option value="uploaded">已上传</option>
                    <option value="pending_review">待审核</option>
                    <option value="approved">审核通过</option>
                    <option value="rejected">审核退回</option>
                    <option value="distributed">已分发</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>剧情标签</label>
                  <input
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={epForm.plot_tags}
                    onChange={e => setEpForm({...epForm, plot_tags: e.target.value})}
                    placeholder="用逗号分隔"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>审核备注</label>
                  <textarea
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff',
                      minHeight: 80,
                      resize: 'vertical'
                    }}
                    value={epForm.review_notes}
                    onChange={e => setEpForm({...epForm, review_notes: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end'
            }}>
              <button
                style={{
                  padding: '7px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  background: '#fff',
                  color: '#374151',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
                onClick={() => setShowModal(false)}
              >取消</button>
              <button
                style={{
                  padding: '7px 16px',
                  border: '1px solid #3b82f6',
                  borderRadius: 6,
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
                onClick={handleSave}
              >{editingEp ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
