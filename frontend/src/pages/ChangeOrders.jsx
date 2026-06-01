import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { Link } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';

function ChangeOrders() {
  const [orders, setOrders] = useState([]);
  const [apps, setApps] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'config',
    app_id: '',
    env_id: '',
    content: '',
    priority: 'medium',
    create_reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, appsRes, envsRes] = await Promise.all([
        apiService.getChangeOrders(),
        apiService.getApplications(),
        apiService.getEnvironments()
      ]);
      setOrders(ordersRes.data);
      setApps(appsRes.data);
      setEnvs(envsRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createChangeOrder(formData);
      setShowModal(false);
      setFormData({
        title: '',
        type: 'config',
        app_id: '',
        env_id: '',
        content: '',
        priority: 'medium',
        create_reason: ''
      });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      created: '已创建',
      submitted: '已提交',
      executing: '执行中',
      reviewed: '已复核',
      rejected: '已退回',
      closed: '已关闭'
    };
    return labels[status] || status;
  };

  const filteredOrders = statusFilter 
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">变更单管理</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => apiService.exportData('change-orders')}>
            <Download size={16} /> 导出
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> 新建变更单
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <label>状态：</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">全部</option>
            <option value="created">已创建</option>
            <option value="submitted">已提交</option>
            <option value="executing">执行中</option>
            <option value="reviewed">已复核</option>
            <option value="rejected">已退回</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>变更单号</th>
                <th>标题</th>
                <th>类型</th>
                <th>应用</th>
                <th>环境</th>
                <th>优先级</th>
                <th>状态</th>
                <th>创建人</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td><code>{order.order_no}</code></td>
                  <td>{order.title}</td>
                  <td>{order.type}</td>
                  <td>{order.app_name || '-'}</td>
                  <td>{order.env_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${order.priority}`}>
                      {order.priority === 'high' ? '高' : order.priority === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{order.creator_name || '-'}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <Link to={`/change-orders/${order.id}`} className="link-text">详情</Link>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="10" className="empty-state">暂无变更单数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建变更单</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>标题 *</label>
                  <input 
                    required 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="请输入变更单标题"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>变更类型</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="config">配置变更</option>
                      <option value="deploy">发布部署</option>
                      <option value="rollback">回滚</option>
                      <option value="data">数据变更</option>
                      <option value="infrastructure">基础设施</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>优先级</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>关联应用</label>
                    <select value={formData.app_id} onChange={e => setFormData({...formData, app_id: e.target.value})}>
                      <option value="">请选择</option>
                      {apps.map(a => (
                        <option key={a.id} value={a.id}>{a.app_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>关联环境</label>
                    <select value={formData.env_id} onChange={e => setFormData({...formData, env_id: e.target.value})}>
                      <option value="">请选择</option>
                      {envs.filter(e => !formData.app_id || e.app_id == formData.app_id).map(e => (
                        <option key={e.id} value={e.id}>{e.env_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>变更内容</label>
                  <textarea 
                    rows="3"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>创建原因 *</label>
                  <textarea 
                    rows="2"
                    required
                    value={formData.create_reason}
                    onChange={e => setFormData({...formData, create_reason: e.target.value})}
                    placeholder="请说明创建此变更单的原因"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChangeOrders;
