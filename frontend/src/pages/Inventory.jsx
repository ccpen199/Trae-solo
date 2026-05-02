import React, { useEffect, useState } from 'react';
import { gameApi } from '../services/api';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await gameApi.getInventory();
      setItems(response.data);
    } catch (err) {
      console.error('获取背包失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemIcon = (item) => {
    const icons = {
      '木柴': '🪵',
      '石头': '🪨',
      '水': '💧',
      '泥土': '🟫',
      '种子': '🌱',
      '木板': '🪓',
      '砖块': '🧱',
      '花园': '🌸',
      '喷泉': '⛲',
      '小屋': '🏠',
    };
    return icons[item.name] || '📦';
  };

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.category === filter);

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'material', label: '材料' },
    { value: 'decoration', label: '装饰' },
    { value: 'building', label: '建筑' },
  ];

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '24px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            📦 我的背包
          </h2>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`btn ${filter === cat.value ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                onClick={() => setFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>背包空空如也</h3>
            <p style={{ marginTop: '8px' }}>去领取每日奖励获得材料吧！</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`item-card rarity-${item.rarity}`}
              >
                <div className="item-icon">{getItemIcon(item)}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-level">Lv.{item.level} · {item.rarity === 'common' ? '普通' : item.rarity === 'uncommon' ? '优秀' : item.rarity === 'rare' ? '稀有' : item.rarity === 'epic' ? '史诗' : '传说'}</div>
                <div className="item-count">数量: {item.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
