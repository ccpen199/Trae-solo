import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

export default function Distribution() {
  const [distributions, setDistributions] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    drama_id: '',
    episode_id: '',
    recommendation_slot: '',
    campaign: '',
    unlock_price: 0,
    member_benefit: '',
    distribution_channel: ''
  });

  useEffect(() => {
    axios.get(`${API_BASE}/distributions`).then(r => {
      setDistributions(r.data.data || []);
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
    await axios.post(`${API_BASE}/distributions`, {
      ...form,
      episode_id: form.episode_id || null
    });
    setShowModal(false);
    setForm({
      drama_id: '',
      episode_id: '',
      recommendation_slot: '',
      campaign: '',
      unlock_price: 0,
      member_benefit: '',
      distribution_channel: ''
    });
    axios.get(`${API_BASE}/distributions`).then(r => {
      setDistributions(r.data.data || []);
    });
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">分发运营</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新建配置</button>
        </div>
        <div className="card-body">
          {loading ? (
            <div>加载中...</div>
          ) : distributions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              暂无分发配置
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>剧集</th>
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
                  {distributions.map(d => (
                    <tr key={d.id}>
                      <td>{d.drama_title}</td>
                      <td>{d.episode_number ? `第${d.episode_number}集` : '整剧'}</td>
                      <td>{d.recommendation_slot || '-'}</td>
                      <td>{d.campaign || '-'}</td>
                      <td>¥{d.unlock_price}</td>
                      <td>{d.member_benefit || '-'}</td>
                      <td>{d.distribution_channel || '-'}</td>
                      <td>v{d.version}</td>
                      <td>{d.created_at}</td>
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
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1f2937' }}>新建分发配置</span>
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
                    <option value="">整剧</option>
                    {episodes.map(e => (
                      <option key={e.id} value={e.id}>第{e.episode_number}集</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>推荐位</label>
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
                    value={form.recommendation_slot}
                    onChange={e => setForm({...form, recommendation_slot: e.target.value})}
                  >
                    <option value="">无</option>
                    <option value="首页推荐">首页推荐</option>
                    <option value="热门榜单">热门榜单</option>
                    <option value="分类推荐">分类推荐</option>
                    <option value="编辑精选">编辑精选</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>活动</label>
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
                    value={form.campaign}
                    onChange={e => setForm({...form, campaign: e.target.value})}
                  >
                    <option value="">无</option>
                    <option value="暑期活动">暑期活动</option>
                    <option value="春节特惠">春节特惠</option>
                    <option value="新用户优惠">新用户优惠</option>
                    <option value="会员专享">会员专享</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>解锁价格(元)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      color: '#1f2937',
                      background: '#fff'
                    }}
                    value={form.unlock_price}
                    onChange={e => setForm({...form, unlock_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>投放渠道</label>
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
                    value={form.distribution_channel}
                    onChange={e => setForm({...form, distribution_channel: e.target.value})}
                  >
                    <option value="">无</option>
                    <option value="短视频平台">短视频平台</option>
                    <option value="长视频平台">长视频平台</option>
                    <option value="社交平台">社交平台</option>
                    <option value="全渠道">全渠道</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>会员权益</label>
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
                    value={form.member_benefit}
                    onChange={e => setForm({...form, member_benefit: e.target.value})}
                    placeholder="如：会员免费看、会员半价"
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
              >保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
