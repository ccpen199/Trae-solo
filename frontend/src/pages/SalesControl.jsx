import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

function SalesControl({ user }) {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(1);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [properties, setProperties] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockForm, setLockForm] = useState({ customer_name: '', customer_phone: '', lock_hours: 24 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding && selectedFloor) {
      loadProperties();
    }
  }, [selectedBuilding, selectedFloor]);

  const loadBuildings = async () => {
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
    } catch (error) {
      console.error('加载楼栋失败:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await api.get('/properties', {
        params: { building_id: selectedBuilding, floor: selectedFloor }
      });
      setProperties(response.data);
    } catch (error) {
      console.error('加载房源失败:', error);
    }
  };

  const handleLock = async () => {
    if (!selectedUnit || !lockForm.customer_name) return;
    
    setLoading(true);
    try {
      await api.post(`/properties/${selectedUnit.id}/lock`, lockForm);
      setShowLockModal(false);
      setSelectedUnit(null);
      setLockForm({ customer_name: '', customer_phone: '', lock_hours: 24 });
      loadProperties();
      alert('锁房成功！');
    } catch (error) {
      alert(error.response?.data?.error || '锁房失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!selectedUnit) return;
    
    try {
      await api.post(`/properties/${selectedUnit.id}/unlock`);
      setSelectedUnit(null);
      loadProperties();
      alert('解锁成功！');
    } catch (error) {
      alert(error.response?.data?.error || '解锁失败');
    }
  };

  const getStatusText = (status) => {
    const map = {
      available: '可售',
      locked: '锁定',
      subscribed: '认购',
      contracted: '已签约',
      contracting: '签约中'
    };
    return map[status] || status;
  };

  const floors = Array.from({ length: 33 }, (_, i) => i + 1);

  return (
    <div>
      <div className="filter-bar">
        <select value={selectedBuilding} onChange={(e) => setSelectedBuilding(Number(e.target.value))}>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button className="btn btn-default btn-sm" onClick={loadProperties}>
          🔄 刷新
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>楼层：</span>
          <div className="floor-nav">
            {floors.slice(0, 10).map((floor) => (
              <button
                key={floor}
                className={`floor-btn ${selectedFloor === floor ? 'active' : ''}`}
                onClick={() => setSelectedFloor(floor)}
              >
                {floor}F
              </button>
            ))}
            <select value={selectedFloor} onChange={(e) => setSelectedFloor(Number(e.target.value))}>
              {floors.map((floor) => (
                <option key={floor} value={floor}>{floor}层</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sales-control">
        <div className="units-grid">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className={`unit-card ${prop.status}`}
              onClick={() => setSelectedUnit(prop)}
              style={{ borderColor: selectedUnit?.id === prop.id ? '#1890ff' : undefined }}
            >
              <div className="unit-number">{prop.unit_number}</div>
              <div className="unit-info">
                <div>{prop.house_type}</div>
                <div>{prop.area}㎡ · {prop.orientation}</div>
                <div>表价: ¥{prop.list_price.toLocaleString()}</div>
                <div>底价: ¥{prop.base_price.toLocaleString()}</div>
              </div>
              <span className={`status-badge ${prop.status}`}>
                {getStatusText(prop.status)}
              </span>
              {prop.status === 'locked' && prop.lock_customer && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                  锁定: {prop.lock_customer}
                  {prop.consultant_name && ` (${prop.consultant_name})`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedUnit && (
        <div className="modal-overlay" onClick={() => setSelectedUnit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>房源详情 - {selectedUnit.unit_number}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="label">户型</div>
                <div className="value">{selectedUnit.house_type}</div>
              </div>
              <div className="detail-item">
                <div className="label">面积</div>
                <div className="value">{selectedUnit.area}㎡</div>
              </div>
              <div className="detail-item">
                <div className="label">朝向</div>
                <div className="value">{selectedUnit.orientation}</div>
              </div>
              <div className="detail-item">
                <div className="label">装修</div>
                <div className="value">{selectedUnit.decoration}</div>
              </div>
              <div className="detail-item">
                <div className="label">表价</div>
                <div className="value">¥{selectedUnit.list_price.toLocaleString()}/㎡</div>
              </div>
              <div className="detail-item">
                <div className="label">底价</div>
                <div className="value">¥{selectedUnit.base_price.toLocaleString()}/㎡</div>
              </div>
            </div>
            
            <div className="modal-actions">
              {selectedUnit.status === 'available' && (user.role === 'consultant' || user.role === 'manager' || user.role === 'admin') && (
                <button className="btn btn-warning" onClick={() => setShowLockModal(true)}>
                  锁定房源
                </button>
              )}
              {selectedUnit.status === 'locked' && (user.role === 'manager' || user.role === 'admin') && (
                <>
                  <button className="btn btn-success" onClick={() => {
                    setSelectedUnit(null);
                    alert('请前往认购管理页面创建认购单');
                  }}>
                    发起认购
                  </button>
                  <button className="btn btn-danger" onClick={handleUnlock}>
                    强制解锁
                  </button>
                </>
              )}
              <button className="btn btn-default" onClick={() => setSelectedUnit(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showLockModal && (
        <div className="modal-overlay" onClick={() => setShowLockModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>锁定房源</h3>
            <div className="form-group">
              <label>客户姓名 *</label>
              <input
                type="text"
                value={lockForm.customer_name}
                onChange={(e) => setLockForm({ ...lockForm, customer_name: e.target.value })}
                placeholder="请输入客户姓名"
              />
            </div>
            <div className="form-group">
              <label>联系电话</label>
              <input
                type="text"
                value={lockForm.customer_phone}
                onChange={(e) => setLockForm({ ...lockForm, customer_phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="form-group">
              <label>锁定时长（小时）</label>
              <input
                type="number"
                value={lockForm.lock_hours}
                onChange={(e) => setLockForm({ ...lockForm, lock_hours: Number(e.target.value) })}
                min="1"
                max="72"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleLock} disabled={loading}>
                {loading ? '处理中...' : '确认锁定'}
              </button>
              <button className="btn btn-default" onClick={() => setShowLockModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesControl;
