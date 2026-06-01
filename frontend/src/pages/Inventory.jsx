import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api';

function Inventory() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [adjustModal, setAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity_change: 0, operator: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, logsRes] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getLogs()
      ]);
      setItems(itemsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAdjust = async () => {
    try {
      await inventoryApi.adjust({
        inventory_id: selectedItem.id,
        ...adjustForm
      });
      setAdjustModal(false);
      loadData();
    } catch (err) {
      alert('调整失败');
    }
  };

  const getQualityBadge = (level) => {
    const badges = {
      normal: 'badge-success',
      expiring: 'badge-warning',
      rejected: 'badge-danger'
    };
    return badges[level] || 'badge-info';
  };

  const getQualityText = (level) => {
    const texts = {
      normal: '正常',
      expiring: '临期',
      rejected: '不合格'
    };
    return texts[level] || level;
  };

  const getTempTag = (zone) => {
    const tags = {
      cold: 'tag-cold',
      frozen: 'tag-frozen',
      normal: 'tag-normal'
    };
    return tags[zone] || 'tag-normal';
  };

  const getTempText = (zone) => {
    const texts = {
      cold: '冷藏',
      frozen: '冷冻',
      normal: '常温'
    };
    return texts[zone] || zone;
  };

  return (
    <div>
      <h1 className="page-title">库存管理</h1>
      
      <div className="tabs">
        <div className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          库存列表
        </div>
        <div className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          库存变动日志
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>库存列表</h3>
          <table className="table">
            <thead>
              <tr>
                <th>SKU编码</th>
                <th>商品名称</th>
                <th>温区</th>
                <th>批次号</th>
                <th>库位</th>
                <th>品质等级</th>
                <th>库存数量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.sku_code}</td>
                  <td>{item.name}</td>
                  <td><span className={`tag ${getTempTag(item.temperature_zone)}`}>{getTempText(item.temperature_zone)}</span></td>
                  <td>{item.batch_no}</td>
                  <td>{item.location}</td>
                  <td><span className={`badge ${getQualityBadge(item.quality_level)}`}>{getQualityText(item.quality_level)}</span></td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setSelectedItem(item);
                      setAdjustModal(true);
                    }}>调整库存</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>库存变动日志</h3>
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>商品</th>
                <th>批次</th>
                <th>变动类型</th>
                <th>变动数量</th>
                <th>操作人</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                  <td>{log.sku_name}</td>
                  <td>{log.batch_no}</td>
                  <td>{log.change_type}</td>
                  <td style={{ color: log.quantity_change > 0 ? '#27ae60' : '#e74c3c' }}>
                    {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                  </td>
                  <td>{log.operator || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>调整库存 - {selectedItem?.name}</h3>
            <p>当前库存: {selectedItem?.quantity} {selectedItem?.unit}</p>
            <div className="form-group">
              <label>变动数量</label>
              <input type="number" value={adjustForm.quantity_change} onChange={e => setAdjustForm({...adjustForm, quantity_change: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>操作人</label>
              <input type="text" value={adjustForm.operator} onChange={e => setAdjustForm({...adjustForm, operator: e.target.value})} />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea value={adjustForm.notes} onChange={e => setAdjustForm({...adjustForm, notes: e.target.value})} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAdjustModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAdjust}>确认调整</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
