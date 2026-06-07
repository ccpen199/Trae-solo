import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminIncentives = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPool, setNewPool] = useState({
    name: '',
    type: 'peak_hour',
    area_code: '',
    start_time: '',
    end_time: '',
    total_budget: 0,
    min_orders: 3,
    bonus_amount: 5
  });

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform/incentive-pools');
      setPools(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/incentive-pools', {
        ...newPool,
        start_time: Math.floor(new Date(newPool.start_time).getTime() / 1000),
        end_time: Math.floor(new Date(newPool.end_time).getTime() / 1000)
      });
      setMessage({ type: 'success', text: '激励红包池创建成功' });
      setShowCreateModal(false);
      loadPools();
    } catch (e) {
      setMessage({ type: 'error', text: '创建失败' });
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🎁 激励红包池配置</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 新建红包池</button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="alert alert-info" style={{ marginBottom: '20px' }}>
        <strong>激励规则说明：</strong>骑手在指定时间区域内完成指定单数后，每单额外获得红包奖励，从红包池预算中扣除。
      </div>

      <div className="grid grid-3">
        {pools.map((pool) => (
          <div key={pool.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px' }}>{pool.name}</h3>
              <span className={`badge ${pool.is_active ? 'badge-success' : 'badge-default'}`}>
                {pool.is_active ? '进行中' : '已结束'}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              类型：{pool.type === 'peak_hour' ? '高峰时段' : pool.type === 'weather' ? '天气补贴' : '区域冲单'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>总预算：</strong>¥{pool.total_budget.toFixed(2)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>剩余预算：</strong>¥{pool.remaining_budget.toFixed(2)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>规则：</strong>满 {pool.min_orders} 单，每单奖 ¥{pool.bonus_amount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {new Date(pool.start_time * 1000).toLocaleString()} ~ {new Date(pool.end_time * 1000).toLocaleString()}
            </div>
          </div>
        ))}
        {pools.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
            暂无激励红包池
          </div>
        )}
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="card-title">新建激励红包池</h3>
            <form onSubmit={handleCreatePool}>
              <div className="form-group">
                <label className="form-label">红包池名称</label>
                <input type="text" className="form-input" value={newPool.name}
                  onChange={(e) => setNewPool({ ...newPool, name: e.target.value })} required
                  placeholder="如：午高峰冲单奖" />
              </div>
              <div className="form-group">
                <label className="form-label">激励类型</label>
                <select className="form-select" value={newPool.type} onChange={(e) => setNewPool({ ...newPool, type: e.target.value })}>
                  <option value="peak_hour">高峰时段激励</option>
                  <option value="weather">恶劣天气补贴</option>
                  <option value="area">区域冲单激励</option>
                </select>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">开始时间</label>
                  <input type="datetime-local" className="form-input" value={newPool.start_time}
                    onChange={(e) => setNewPool({ ...newPool, start_time: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间</label>
                  <input type="datetime-local" className="form-input" value={newPool.end_time}
                    onChange={(e) => setNewPool({ ...newPool, end_time: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">总预算(元)</label>
                  <input type="number" className="form-input" value={newPool.total_budget}
                    onChange={(e) => setNewPool({ ...newPool, total_budget: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">最低单量</label>
                  <input type="number" className="form-input" value={newPool.min_orders}
                    onChange={(e) => setNewPool({ ...newPool, min_orders: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">每单奖励(元)</label>
                  <input type="number" className="form-input" value={newPool.bonus_amount}
                    onChange={(e) => setNewPool({ ...newPool, bonus_amount: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-block" onClick={() => setShowCreateModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary btn-block">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIncentives;
