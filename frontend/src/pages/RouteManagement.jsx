import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { routesAPI, resourcesAPI } from '../api/index.js';

function RouteManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [resources, setResources] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [validation, setValidation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_days: 1,
    status: 'draft'
  });
  const [resourceForm, setResourceForm] = useState({
    resource_id: '',
    day_number: 1,
    order_in_day: 1,
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchRoutes();
    fetchResources();
  }, []);

  useEffect(() => {
    if (id) {
      const route = routes.find(r => r.id === parseInt(id));
      if (route) {
        fetchRouteDetail(route.id);
      }
    }
  }, [id, routes]);

  const fetchRoutes = async () => {
    try {
      const response = await routesAPI.getAll();
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await resourcesAPI.getAll();
      setResources(response.data.filter(r => !r.is_closed));
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const fetchRouteDetail = async (routeId) => {
    try {
      const response = await routesAPI.get(routeId);
      setSelectedRoute(response.data);
      setValidation(null);
    } catch (error) {
      console.error('Failed to fetch route detail:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRoute && !showModal) {
        await routesAPI.update(selectedRoute.id, formData);
      } else {
        const response = await routesAPI.create(formData);
        navigate(`/routes/${response.data.id}`);
      }
      fetchRoutes();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save route:', error);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      await routesAPI.addResource(selectedRoute.id, resourceForm);
      fetchRouteDetail(selectedRoute.id);
      setShowAddResource(false);
      setResourceForm({
        resource_id: '',
        day_number: 1,
        order_in_day: 1,
        start_time: '',
        end_time: ''
      });
    } catch (error) {
      console.error('Failed to add resource:', error);
    }
  };

  const handleRemoveResource = async (routeResourceId) => {
    if (confirm('确定要移除这个资源吗？')) {
      try {
        await routesAPI.removeResource(selectedRoute.id, routeResourceId);
        fetchRouteDetail(selectedRoute.id);
      } catch (error) {
        console.error('Failed to remove resource:', error);
      }
    }
  };

  const handleValidate = async () => {
    try {
      const response = await routesAPI.validate(selectedRoute.id);
      setValidation(response.data);
    } catch (error) {
      console.error('Failed to validate route:', error);
    }
  };

  const handleDelete = async (routeId) => {
    if (confirm('确定要删除这条线路吗？')) {
      try {
        await routesAPI.delete(routeId);
        fetchRoutes();
        if (selectedRoute?.id === routeId) {
          setSelectedRoute(null);
          navigate('/routes');
        }
      } catch (error) {
        console.error('Failed to delete route:', error);
      }
    }
  };

  const getBadgeClass = (type) => {
    const classes = {
      scenic: 'badge-scenic',
      hotel: 'badge-hotel',
      restaurant: 'badge-restaurant',
      transport: 'badge-transport',
      activity: 'badge-activity'
    };
    return classes[type] || '';
  };

  const getTypeName = (type) => {
    const names = {
      scenic: '景点',
      hotel: '酒店',
      restaurant: '餐厅',
      transport: '交通',
      activity: '活动'
    };
    return names[type] || type;
  };

  const groupResourcesByDay = (resources) => {
    const grouped = {};
    resources.forEach(r => {
      if (!grouped[r.day_number]) grouped[r.day_number] = [];
      grouped[r.day_number].push(r);
    });
    return grouped;
  };

  const getTotalPrice = () => {
    if (!selectedRoute?.resources) return 0;
    return selectedRoute.resources.reduce((sum, r) => sum + (r.price || 0), 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem' }}>
      <div>
        <div className="page-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
          <h2>🗺️ 线路管理</h2>
          <button className="btn btn-primary" onClick={() => {
            setFormData({ name: '', description: '', duration_days: 1, status: 'draft' });
            setShowModal(true);
          }}>
            + 创建线路
          </button>
        </div>

        <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
          {routes.map(route => (
            <div 
              key={route.id} 
              className={`card ${selectedRoute?.id === route.id ? 'selected' : ''}`}
              style={{ cursor: 'pointer', border: selectedRoute?.id === route.id ? '2px solid #667eea' : 'none' }}
              onClick={() => {
                fetchRouteDetail(route.id);
                navigate(`/routes/${route.id}`);
              }}
            >
              <div className="card-header">
                <h3 className="card-title">{route.name}</h3>
                <span className={`card-status ${route.status === 'published' ? 'status-active' : 'status-inactive'}`}>
                  {route.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
              <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                {route.description || '暂无描述'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                  {route.duration_days} 天
                </span>
                <button 
                  className="btn btn-small btn-danger"
                  onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedRoute ? (
          <div>
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 style={{ marginBottom: '0.5rem' }}>{selectedRoute.name}</h2>
                  <p style={{ color: '#718096' }}>{selectedRoute.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={handleValidate}>
                    🔍 校验线路
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowAddResource(true)}>
                    + 添加资源
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ color: '#718096', fontSize: '0.85rem' }}>行程天数</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#667eea' }}>{selectedRoute.duration_days} 天</div>
                </div>
                <div>
                  <span style={{ color: '#718096', fontSize: '0.85rem' }}>资源数量</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#667eea' }}>{selectedRoute.resources?.length || 0} 个</div>
                </div>
                <div>
                  <span style={{ color: '#718096', fontSize: '0.85rem' }}>参考总价</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#667eea' }}>¥{getTotalPrice()}</div>
                </div>
              </div>

              {validation && (
                <div className="validation-issues" style={{ marginBottom: '1.5rem' }}>
                  <h4>{validation.valid ? '✅ 线路校验通过' : '⚠️ 发现以下问题'}</h4>
                  {validation.issues.length > 0 && (
                    <ul>
                      {validation.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {selectedRoute.resources?.length === 0 ? (
                <div className="empty-state">
                  暂无资源，点击右上角「添加资源」开始规划行程
                </div>
              ) : (
                Object.entries(groupResourcesByDay(selectedRoute.resources)).map(([day, dayResources]) => (
                  <div key={day} className="route-day">
                    <div className="route-day-title">第 {day} 天</div>
                    {dayResources.sort((a, b) => a.order_in_day - b.order_in_day).map(rr => (
                      <div key={rr.id} className="route-resource-item">
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span className={`badge ${getBadgeClass(rr.resource_type)}`}>{getTypeName(rr.resource_type)}</span>
                            <strong>{rr.resource_name}</strong>
                            {rr.is_closed && <span className="card-status status-closed">已停业</span>}
                          </div>
                          <div className="route-resource-time">
                            {rr.start_time && rr.end_time ? `${rr.start_time} - ${rr.end_time}` : '时间未设置'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                            供应商: {rr.supplier_name || '未设置'} | ¥{rr.price}
                          </div>
                        </div>
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={() => handleRemoveResource(rr.id)}
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              从左侧选择一条线路查看详情，或创建新线路
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>创建新线路</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>线路名称</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div className="form-group">
                  <label>线路描述</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3" />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>行程天数</label>
                    <input type="number" min="1" value={formData.duration_days} onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="form-group">
                    <label>状态</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="draft">草稿</option>
                      <option value="published">已发布</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">创建</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddResource && (
        <div className="modal-overlay" onClick={() => setShowAddResource(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加资源到线路</h3>
              <button className="modal-close" onClick={() => setShowAddResource(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddResource}>
                <div className="form-group">
                  <label>选择资源</label>
                  <select value={resourceForm.resource_id} onChange={(e) => setResourceForm({...resourceForm, resource_id: e.target.value})} required>
                    <option value="">请选择资源</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id}>
                        [{getTypeName(r.type)}] {r.name} - ¥{r.price}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>第几天</label>
                    <input type="number" min="1" value={resourceForm.day_number} onChange={(e) => setResourceForm({...resourceForm, day_number: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="form-group">
                    <label>当天顺序</label>
                    <input type="number" min="1" value={resourceForm.order_in_day} onChange={(e) => setResourceForm({...resourceForm, order_in_day: parseInt(e.target.value) || 1})} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>开始时间</label>
                    <input type="time" value={resourceForm.start_time} onChange={(e) => setResourceForm({...resourceForm, start_time: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>结束时间</label>
                    <input type="time" value={resourceForm.end_time} onChange={(e) => setResourceForm({...resourceForm, end_time: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddResource(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">添加</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteManagement;
