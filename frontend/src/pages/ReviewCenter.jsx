import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

export default function ReviewCenter() {
  const [reviews, setReviews] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    drama_id: '',
    episode_id: '',
    reviewer: '',
    copyright_check: false,
    sensitive_content_check: false,
    quality_check: false,
    subtitle_check: false,
    payment_config_check: false,
    overall_result: 'pending',
    rejection_reason: ''
  });

  useEffect(() => {
    axios.get(`${API_BASE}/reviews`).then(r => {
      setReviews(r.data.data || []);
      setLoading(false);
    });
    axios.get(`${API_BASE}/dramas`).then(r => {
      setDramas(r.data.data || []);
    });
  }, []);

  const onDramaChange = (dramaId) => {
    setForm({ ...form, drama_id: dramaId, episode_id: '' });
    if (dramaId) {
      axios.get(`${API_BASE}/dramas/${dramaId}/episodes`).then(r => {
        setEpisodes(r.data.data || []);
      });
    } else {
      setEpisodes([]);
    }
  };

  const handleSubmit = async () => {
    if (!form.drama_id) {
      alert('请选择剧集');
      return;
    }
    const payload = {
      ...form,
      copyright_check: form.copyright_check ? 1 : 0,
      sensitive_content_check: form.sensitive_content_check ? 1 : 0,
      quality_check: form.quality_check ? 1 : 0,
      subtitle_check: form.subtitle_check ? 1 : 0,
      payment_config_check: form.payment_config_check ? 1 : 0,
      episode_id: form.episode_id || null
    };
    await axios.post(`${API_BASE}/reviews`, payload);
    setShowModal(false);
    setForm({
      drama_id: '',
      episode_id: '',
      reviewer: '',
      copyright_check: false,
      sensitive_content_check: false,
      quality_check: false,
      subtitle_check: false,
      payment_config_check: false,
      overall_result: 'pending',
      rejection_reason: ''
    });
    axios.get(`${API_BASE}/reviews`).then(r => {
      setReviews(r.data.data || []);
    });
  };

  const allPassed = form.copyright_check && form.sensitive_content_check && form.quality_check && form.subtitle_check && form.payment_config_check;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">审核流程</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新建审核</button>
        </div>
        <div className="card-body">
          {loading ? (
            <div>加载中...</div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              暂无审核记录
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>剧集</th>
                    <th>分集</th>
                    <th>审核人</th>
                    <th>版权</th>
                    <th>敏感</th>
                    <th>画质</th>
                    <th>字幕</th>
                    <th>付费</th>
                    <th>结果</th>
                    <th>退回原因</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td>{r.drama_title}</td>
                      <td>{r.episode_number ? `第${r.episode_number}集` : '整剧'}</td>
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
                      <td style={{ maxWidth: 200 }}>{r.rejection_reason || '-'}</td>
                      <td>{r.created_at}</td>
                    </tr>
                  ))}
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
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>新建审核</span>
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
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>剧集 *</label>
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
                    value={form.drama_id}
                    onChange={e => onDramaChange(e.target.value)}
                  >
                    <option value="">选择剧集...</option>
                    {dramas.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>分集</label>
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
                    value={form.episode_id}
                    onChange={e => setForm({...form, episode_id: e.target.value})}
                  >
                    <option value="">整剧审核</option>
                    {episodes.map(e => (
                      <option key={e.id} value={e.id}>第{e.episode_number}集</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>审核人</label>
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
                    value={form.reviewer}
                    onChange={e => setForm({...form, reviewer: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>审核结果</label>
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
                    value={form.overall_result}
                    onChange={e => setForm({...form, overall_result: e.target.value})}
                  >
                    <option value="pending">待定</option>
                    <option value="approved" disabled={!allPassed}>通过</option>
                    <option value="rejected">退回</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>审核项</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151' }}>
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        checked={form.copyright_check}
                        onChange={e => setForm({...form, copyright_check: e.target.checked})}
                      />
                      版权授权
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151' }}>
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        checked={form.sensitive_content_check}
                        onChange={e => setForm({...form, sensitive_content_check: e.target.checked})}
                      />
                      敏感内容
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151' }}>
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        checked={form.quality_check}
                        onChange={e => setForm({...form, quality_check: e.target.checked})}
                      />
                      画质
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151' }}>
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        checked={form.subtitle_check}
                        onChange={e => setForm({...form, subtitle_check: e.target.checked})}
                      />
                      字幕
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151' }}>
                      <input
                        type="checkbox"
                        style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                        checked={form.payment_config_check}
                        onChange={e => setForm({...form, payment_config_check: e.target.checked})}
                      />
                      付费配置
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>退回原因（退回时必填）</label>
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
                    value={form.rejection_reason}
                    onChange={e => setForm({...form, rejection_reason: e.target.value})}
                    placeholder="具体修改原因..."
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
                onClick={handleSubmit}
              >提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
