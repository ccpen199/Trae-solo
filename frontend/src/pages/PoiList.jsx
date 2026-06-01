import { useState, useEffect } from 'react';
import api from '../api.js';

const FACILITY_OPTIONS = ['免费WiFi', '空调', '包厢', '停车位', '刷卡支付', '扫码点餐', '充电宝', '无烟区', '儿童座椅', '宠物友好', '24小时营业', '支持预约', '提供发票', '会员服务', '外送服务'];
const ACCESSIBILITY_OPTIONS = ['无障碍通道', '轮椅可用', '无障碍卫生间', '轮椅租借', '盲道', '手语服务', '助听器兼容', '无障碍电梯', '低位服务台', '暂无'];

function getCategoryIcon(catId) {
  const icons = { 1: '🍜', 2: '🏛️', 3: '👨‍👩‍👧', 4: '🎯', 5: '💇' };
  return icons[catId] || '📍';
}

function PoiList() {
  const [pois, setPois] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [newPoi, setNewPoi] = useState({
    name: '', category_id: '', address: '', avg_price: '', business_hours: '',
    contact: '', description: '', tags: '', facilities: [], accessibility: '',
    latitude: '', longitude: ''
  });

  const loadPois = () => {
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    api.get('pois', { params })
      .then(res => setPois(res.data.list || []))
      .catch(err => console.error('Failed to load POIs:', err));
  };

  useEffect(() => {
    api.get('categories')
      .then(res => setCategories(res.data || []))
      .catch(err => console.error('Failed to load categories:', err));
  }, []);

  useEffect(() => {
    loadPois();
  }, [selectedCategory]);

  const handleAddPoi = (e) => {
    e.preventDefault();
    if (!newPoi.name.trim()) {
      setSubmitSuccess({ type: 'error', msg: '请填写商家名称' });
      return;
    }
    if (!newPoi.category_id) {
      setSubmitSuccess({ type: 'error', msg: '请选择商家分类' });
      return;
    }

    setSubmitLoading(true);
    const poiData = {
      ...newPoi,
      facilities: newPoi.facilities.join(','),
      avg_price: parseFloat(newPoi.avg_price) || 0,
      latitude: parseFloat(newPoi.latitude) || null,
      longitude: parseFloat(newPoi.longitude) || null
    };

    api.post('pois', poiData)
      .then(() => {
        setSubmitSuccess({ type: 'success', msg: `商家「${newPoi.name}」添加成功！` });
        setShowAddForm(false);
        setNewPoi({
          name: '', category_id: '', address: '', avg_price: '', business_hours: '',
          contact: '', description: '', tags: '', facilities: [], accessibility: '',
          latitude: '', longitude: ''
        });
        loadPois();
        setTimeout(() => setSubmitSuccess(null), 3000);
      })
      .catch(err => {
        setSubmitSuccess({ type: 'error', msg: '添加失败：' + (err.response?.data?.error || err.message) });
      })
      .finally(() => setSubmitLoading(false));
  };

  const toggleFacility = (facility) => {
    setNewPoi(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>🏪 商家POI管理</h2>
        <button
          className="btn btn-primary"
          onClick={showAddForm ? () => setShowAddForm(false) : () => setShowAddForm(true)}
          style={{ fontSize: '1rem' }}
        >
          {showAddForm ? '✕ 收起表单' : '➕ 添加商家'}
        </button>
      </div>

      {submitSuccess && (
        <div style={{
          background: submitSuccess.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: submitSuccess.type === 'success' ? '#166534' : '#991b1b',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{submitSuccess.type === 'success' ? '✅' : '❌'} {submitSuccess.msg}</span>
          <button
            onClick={() => setSubmitSuccess(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'inherit' }}
          >✕</button>
        </div>
      )}

      {showAddForm && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '2px solid #ff6b35'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#ff6b35' }}>📝 添加新商家</h3>
          <form onSubmit={handleAddPoi}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">商家名称 * <span style={{color:'#ef4444'}}>(必填)</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入商家名称"
                  value={newPoi.name}
                  onChange={(e) => setNewPoi({ ...newPoi, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">分类 * <span style={{color:'#ef4444'}}>(必填)</span></label>
                <select
                  className="form-select"
                  value={newPoi.category_id}
                  onChange={(e) => setNewPoi({ ...newPoi, category_id: e.target.value })}
                >
                  <option value="">选择分类</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{getCategoryIcon(cat.id)} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">详细地址</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入详细地址"
                value={newPoi.address}
                onChange={(e) => setNewPoi({ ...newPoi, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">人均消费 (元)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="如：128"
                  value={newPoi.avg_price}
                  onChange={(e) => setNewPoi({ ...newPoi, avg_price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">营业时间</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：10:00-22:00"
                  value={newPoi.business_hours}
                  onChange={(e) => setNewPoi({ ...newPoi, business_hours: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入联系电话"
                  value={newPoi.contact}
                  onChange={(e) => setNewPoi({ ...newPoi, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">设施标签 <span style={{color:'#999', fontWeight:'normal'}}>(点击选择)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {FACILITY_OPTIONS.map(facility => (
                  <label
                    key={facility}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: newPoi.facilities.includes(facility) ? '#ff6b35' : '#f0f0f0',
                      color: newPoi.facilities.includes(facility) ? 'white' : '#333',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      userSelect: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={newPoi.facilities.includes(facility)}
                      onChange={() => toggleFacility(facility)}
                    />
                    {newPoi.facilities.includes(facility) ? '✓ ' : ''}{facility}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">无障碍信息</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ACCESSIBILITY_OPTIONS.map(opt => (
                  <label
                    key={opt}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: newPoi.accessibility === opt ? '#3b82f6' : '#f0f0f0',
                      color: newPoi.accessibility === opt ? 'white' : '#333',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      userSelect: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name="accessibility"
                      style={{ display: 'none' }}
                      checked={newPoi.accessibility === opt}
                      onChange={() => setNewPoi({ ...newPoi, accessibility: opt })}
                    />
                    {newPoi.accessibility === opt ? '✓ ' : ''}{opt}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">标签（逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：老字号,网红店,聚餐,约会"
                  value={newPoi.tags}
                  onChange={(e) => setNewPoi({ ...newPoi, tags: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">经纬度</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    placeholder="纬度 39.93"
                    value={newPoi.latitude}
                    onChange={(e) => setNewPoi({ ...newPoi, latitude: e.target.value })}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    placeholder="经度 116.45"
                    value={newPoi.longitude}
                    onChange={(e) => setNewPoi({ ...newPoi, longitude: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">商家简介</label>
              <textarea
                className="form-textarea"
                placeholder="请输入商家简介，方便用户了解"
                value={newPoi.description}
                onChange={(e) => setNewPoi({ ...newPoi, description: e.target.value })}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, fontSize: '1rem', padding: '0.8rem' }}
                disabled={submitLoading}
              >
                {submitLoading ? '提交中...' : '✅ 确认添加'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '1rem', padding: '0.8rem' }}
                onClick={() => {
                  setShowAddForm(false);
                  setNewPoi({
                    name: '', category_id: '', address: '', avg_price: '', business_hours: '',
                    contact: '', description: '', tags: '', facilities: [], accessibility: '',
                    latitude: '', longitude: ''
                  });
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="category-tabs">
        <div
          className={`category-tab ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          全部 ({pois.length})
        </div>
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`category-tab ${selectedCategory == cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {getCategoryIcon(cat.id)} {cat.name}
          </div>
        ))}
      </div>

      {pois.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
          <p>暂无商家数据</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAddForm(true)}>
            添加第一个商家
          </button>
        </div>
      ) : (
        <div className="poi-list">
          {pois.map(poi => (
            <div key={poi.id} className="poi-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedPoi(selectedPoi === poi.id ? null : poi.id)}>
              <div className="poi-info" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getCategoryIcon(poi.category_id)}</span>
                  <span className="poi-name">{poi.name}</span>
                </div>
                <div className="poi-rating">
                  {'⭐'.repeat(Math.round(poi.rating || 0))} {poi.rating?.toFixed(1) || '暂无评分'}
                  <span style={{ marginLeft: '1rem', color: '#999', fontSize: '0.85rem' }}>
                    {poi.review_count || 0} 条评价
                  </span>
                </div>
                <div className="poi-address">📍 {poi.address || '地址待补充'}</div>
                {poi.avg_price && <div className="poi-price">💰 人均 ¥{poi.avg_price}</div>}
                {poi.business_hours && <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>⏰ {poi.business_hours}</div>}
                {poi.contact && <div style={{ color: '#666', fontSize: '0.9rem' }}>📞 {poi.contact}</div>}

                {selectedPoi === poi.id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #ff6b35' }}>
                    {poi.description && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong>📋 简介：</strong>{poi.description}
                      </div>
                    )}
                    {poi.facilities && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong>🏷️ 设施：</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                          {poi.facilities.split(',').map((f, i) => (
                            <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {poi.accessibility && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <strong>♿ 无障碍：</strong>
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>{poi.accessibility}</span>
                      </div>
                    )}
                    {poi.tags && (
                      <div>
                        <strong>🔖 标签：</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                          {poi.tags.split(',').map((t, i) => (
                            <span key={i} style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', minWidth: '100px' }}>
                <div style={{
                  background: poi.category_id == 1 ? '#fef2f2' : poi.category_id == 2 ? '#eff6ff' : poi.category_id == 3 ? '#f0fdf4' : poi.category_id == 4 ? '#faf5ff' : '#fffbeb',
                  color: poi.category_id == 1 ? '#dc2626' : poi.category_id == 2 ? '#2563eb' : poi.category_id == 3 ? '#16a34a' : poi.category_id == 4 ? '#9333ea' : '#d97706',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  {poi.category_name}
                </div>
                <div style={{ marginTop: '0.5rem', color: '#999', fontSize: '0.75rem' }}>
                  {selectedPoi === poi.id ? '点击收起 ▲' : '点击展开 ▼'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PoiList;
