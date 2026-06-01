import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = '/api';

const shelfStatusMap = {
  draft: { label: '草稿', class: 'badge-draft' },
  review: { label: '审核中', class: 'badge-review' },
  published: { label: '已上架', class: 'badge-published' }
};

const paymentTypeMap = {
  free: '免费',
  per_episode: '按集付费',
  vip_only: '会员专享'
};

export default function DramaList() {
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDrama, setEditingDrama] = useState(null);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    genre: '',
    copyright_holder: '',
    actors: '',
    synopsis: '',
    cover_url: '',
    episode_count: 0,
    payment_type: 'per_episode',
    shelf_status: 'draft'
  });

  useEffect(() => {
    fetchDramas();
  }, []);

  const fetchDramas = async () => {
    axios.get(`${API_BASE}/dramas`).then(r => {
      setDramas(r.data.data || []);
      setLoading(false);
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('请输入剧名');
      return;
    }
    if (editingDrama) {
      await axios.put(`${API_BASE}/dramas/${editingDrama}`, form);
    } else {
      await axios.post(`${API_BASE}/dramas`, form);
    }
    setShowModal(false);
    setEditingDrama(null);
    resetForm();
    fetchDramas();
  };

  const handleEdit = (d) => {
    setEditingDrama(d.id);
    setForm({
      title: d.title,
      genre: d.genre,
      copyright_holder: d.copyright_holder,
      actors: d.actors,
      synopsis: d.synopsis,
      cover_url: d.cover_url,
      episode_count: d.episode_count,
      payment_type: d.payment_type,
      shelf_status: d.shelf_status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除该剧集？')) return;
    await axios.delete(`${API_BASE}/dramas/${id}`);
    fetchDramas();
  };

  const resetForm = () => {
    setForm({
      title: '',
      genre: '',
      copyright_holder: '',
      actors: '',
      synopsis: '',
      cover_url: '',
      episode_count: 0,
      payment_type: 'per_episode',
      shelf_status: 'draft'
    });
  };

  const openAdd = () => {
    console.log('openAdd called, showModal was:', showModal);
    resetForm();
    setEditingDrama(null);
    setShowModal(true);
    console.log('showModal set to true');
  };

  const filtered = dramas.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.genre.includes(search)
  );

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">剧集档案</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: showModal ? '#10b981' : '#9ca3af', fontWeight: 600 }}>
              {showModal ? '✓ 模态框已打开' : '○ 点击右侧按钮新建'}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowModal(true);
              }}
              style={{ zIndex: 9999, position: 'relative' }}
            >
              + 新建剧集
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="搜索剧名或题材..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ color: '#9ca3af' }}>共 {filtered.length} 部</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎭</div>
              暂无剧集
            </div>
          ) : (
            <div className="drama-grid">
              {filtered.map(d => {
                const st = shelfStatusMap[d.shelf_status] || shelfStatusMap.draft;
                return (
                  <div
                    className="drama-card"
                    key={d.id}
                    onClick={() => navigate(`/drama/${d.id}`)}
                  >
                    <img
                      className="drama-cover"
                      src={d.cover_url || `https://picsum.photos/seed/drama${d.id}/400/600`}
                      alt={d.title}
                      onError={(e) => { e.target.src = 'https://picsum.photos/seed/default/400/600'; }}
                    />
                    <div className="drama-info">
                      <div className="drama-name">{d.title}</div>
                      <div className="drama-meta">
                        <span className="drama-genre">{d.genre || '未分类'}</span>
                        <span>{d.episode_count}集</span>
                        <span className={`badge ${st.class}`}>{st.label}</span>
                      </div>
                      {d.copyright_holder && (
                        <div className="drama-field" title="版权方">
                          <span className="drama-field-label">©</span> {d.copyright_holder}
                        </div>
                      )}
                      {d.actors && (
                        <div className="drama-field" title="演员">
                          <span className="drama-field-label">🎭</span> {d.actors.substring(0, 20)}{d.actors.length > 20 ? '...' : ''}
                        </div>
                      )}
                      <div className="drama-field">
                        <span className="drama-field-label">💰</span> {paymentTypeMap[d.payment_type] || '未设置'}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <Link
                          to={`/drama/${d.id}`}
                          className="action-link"
                          onClick={e => e.stopPropagation()}
                        >
                          详情
                        </Link>
                        <span
                          className="action-link"
                          onClick={(e) => { e.stopPropagation(); handleEdit(d); }}
                        >
                          编辑
                        </span>
                        <span
                          className="action-link action-link-danger"
                          onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                        >
                          删除
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                {editingDrama ? '编辑剧集' : '新建剧集'}
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
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>剧名 *</label>
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
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>题材</label>
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
                    value={form.genre}
                    onChange={e => setForm({...form, genre: e.target.value})}
                    placeholder="如：都市爱情"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>版权方</label>
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
                    value={form.copyright_holder}
                    onChange={e => setForm({...form, copyright_holder: e.target.value})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>演员</label>
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
                    value={form.actors}
                    onChange={e => setForm({...form, actors: e.target.value})}
                    placeholder="多个演员用逗号分隔"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>分集数</label>
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
                    value={form.episode_count}
                    onChange={e => setForm({...form, episode_count: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>付费方式</label>
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
                    value={form.payment_type}
                    onChange={e => setForm({...form, payment_type: e.target.value})}
                  >
                    <option value="free">免费</option>
                    <option value="per_episode">按集付费</option>
                    <option value="vip_only">会员专享</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>上架状态</label>
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
                    value={form.shelf_status}
                    onChange={e => setForm({...form, shelf_status: e.target.value})}
                  >
                    <option value="draft">草稿</option>
                    <option value="review">审核中</option>
                    <option value="published">已上架</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>封面URL</label>
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
                    value={form.cover_url}
                    onChange={e => setForm({...form, cover_url: e.target.value})}
                    placeholder="封面图片链接"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>简介</label>
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
                    value={form.synopsis}
                    onChange={e => setForm({...form, synopsis: e.target.value})}
                    placeholder="剧集简介..."
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
              >保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
