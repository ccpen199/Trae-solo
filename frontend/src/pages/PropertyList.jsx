import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState({ building_id: '', status: '' });
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    loadBuildings();
    loadProperties();
  }, [filters]);

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
      const params = {};
      if (filters.building_id) params.building_id = filters.building_id;
      if (filters.status) params.status = filters.status;
      
      const response = await api.get('/properties', { params });
      setProperties(response.data);
    } catch (error) {
      console.error('加载房源失败:', error);
    }
  };

  const loadPropertyDetail = async (id) => {
    try {
      const response = await api.get(`/properties/${id}`);
      setSelectedProperty(response.data);
    } catch (error) {
      console.error('加载房源详情失败:', error);
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

  const getStatusTagClass = (status) => {
    const map = {
      available: 'tag-success',
      locked: 'tag-warning',
      subscribed: 'tag-info',
      contracted: 'tag-error',
      contracting: 'tag-info'
    };
    return map[status] || '';
  };

  return (
    <div>
      <div className="filter-bar">
        <select
          value={filters.building_id}
          onChange={(e) => setFilters({ ...filters, building_id: e.target.value })}
        >
          <option value="">全部楼栋</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">全部状态</option>
          <option value="available">可售</option>
          <option value="locked">锁定</option>
          <option value="subscribed">认购</option>
          <option value="contracted">已签约</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>楼栋</th>
            <th>房号</th>
            <th>户型</th>
            <th>面积</th>
            <th>朝向</th>
            <th>装修</th>
            <th>表价(元/㎡)</th>
            <th>底价(元/㎡)</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop) => (
            <tr key={prop.id}>
              <td>{prop.building_name}</td>
              <td>{prop.unit_number}</td>
              <td>{prop.house_type}</td>
              <td>{prop.area}㎡</td>
              <td>{prop.orientation}</td>
              <td>{prop.decoration}</td>
              <td>{prop.list_price.toLocaleString()}</td>
              <td>{prop.base_price.toLocaleString()}</td>
              <td>
                <span className={`tag ${getStatusTagClass(prop.status)}`}>
                  {getStatusText(prop.status)}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-default btn-sm"
                  onClick={() => loadPropertyDetail(prop.id)}
                >
                  详情
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedProperty && (
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>房源详情 - {selectedProperty.building_name} {selectedProperty.unit_number}</h3>
            
            <div className="detail-grid">
              <div className="detail-item">
                <div className="label">户型</div>
                <div className="value">{selectedProperty.house_type}</div>
              </div>
              <div className="detail-item">
                <div className="label">面积</div>
                <div className="value">{selectedProperty.area}㎡</div>
              </div>
              <div className="detail-item">
                <div className="label">朝向</div>
                <div className="value">{selectedProperty.orientation}</div>
              </div>
              <div className="detail-item">
                <div className="label">装修</div>
                <div className="value">{selectedProperty.decoration}</div>
              </div>
              <div className="detail-item">
                <div className="label">表价</div>
                <div className="value">¥{selectedProperty.list_price.toLocaleString()}/㎡</div>
              </div>
              <div className="detail-item">
                <div className="label">底价</div>
                <div className="value">¥{selectedProperty.base_price.toLocaleString()}/㎡</div>
              </div>
              <div className="detail-item">
                <div className="label">总价（表）</div>
                <div className="value">¥{(selectedProperty.list_price * selectedProperty.area / 10000).toFixed(2)}万</div>
              </div>
              <div className="detail-item">
                <div className="label">总价（底）</div>
                <div className="value">¥{(selectedProperty.base_price * selectedProperty.area / 10000).toFixed(2)}万</div>
              </div>
            </div>

            <div className="history-list">
              <h4>状态变更历史</h4>
              {selectedProperty.history?.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="time">{item.created_at}</div>
                  <div className="content">
                    {item.old_status && `${getStatusText(item.old_status)} → `}
                    <strong>{getStatusText(item.new_status)}</strong>
                    <span style={{ color: '#666', marginLeft: '8px' }}>
                      来源: {item.source}
                      {item.operator_name && ` | 操作人: ${item.operator_name}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-default" onClick={() => setSelectedProperty(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyList;
