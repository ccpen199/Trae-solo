import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const WorkOrders = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processNote, setProcessNote] = useState('');

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setWorkOrders([
        {
          id: 'GD202605001',
          property: '朝阳区国贸CBD精装一居室',
          type: 'quality',
          status: 'pending',
          creator: '张先生',
          createdAt: '2026-05-20 10:30',
          description: '房源发布后的质量检查，核验房屋装修、家具家电等情况',
          items: [
            { name: '房屋结构', status: 'pending', note: '' },
            { name: '装修情况', status: 'pending', note: '' },
            { name: '家具家电', status: 'pending', note: '' },
            { name: '水电燃气', status: 'pending', note: '' },
            { name: '门窗锁具', status: 'pending', note: '' }
          ],
          images: ['客厅照片.jpg', '卧室照片.jpg', '厨房照片.jpg']
        },
        {
          id: 'GD202605002',
          property: '海淀区中关村两居室',
          type: 'maintenance',
          status: 'processing',
          creator: '王女士',
          createdAt: '2026-05-18 14:20',
          assignee: '李质检员',
          description: '租客反映空调不制冷，需要检修',
          items: [
            { name: '空调检查', status: 'pass', note: '空调滤网需清洗' },
            { name: '电路检查', status: 'pass', note: '电路正常' },
            { name: '遥控器检查', status: 'pending', note: '' }
          ],
          images: ['空调照片.jpg'],
          timeline: [
            { time: '2026-05-18 14:20', action: '工单创建', operator: '王女士' },
            { time: '2026-05-18 15:00', action: '指派质检员', operator: '系统' },
            { time: '2026-05-19 09:30', action: '质检员上门', operator: '李质检员' }
          ]
        },
        {
          id: 'GD202605003',
          property: '西城区金融街三居室',
          type: 'checkout',
          status: 'completed',
          creator: '刘先生',
          createdAt: '2026-05-10 09:00',
          assignee: '张质检员',
          completedAt: '2026-05-10 16:30',
          description: '租客退租验房，检查房屋设施完好情况',
          items: [
            { name: '墙面地板', status: 'pass', note: '正常磨损' },
            { name: '家具家电', status: 'pass', note: '完好无损' },
            { name: '水电燃气', status: 'pass', note: '费用已结清' },
            { name: '钥匙门禁', status: 'pass', note: '已全部归还' }
          ],
          images: ['验房报告1.jpg', '验房报告2.jpg'],
          result: '房屋状况良好，押金全额退还',
          timeline: [
            { time: '2026-05-10 09:00', action: '工单创建', operator: '刘先生' },
            { time: '2026-05-10 09:30', action: '指派质检员', operator: '系统' },
            { time: '2026-05-10 14:00', action: '质检员上门', operator: '张质检员' },
            { time: '2026-05-10 16:30', action: '质检完成', operator: '张质检员' }
          ]
        },
        {
          id: 'GD202605004',
          property: '东城区东直门一居室',
          type: 'quality',
          status: 'rejected',
          creator: '孙先生',
          createdAt: '2026-05-08 11:00',
          assignee: '王质检员',
          completedAt: '2026-05-08 17:00',
          description: '房源发布质检',
          items: [
            { name: '房屋结构', status: 'pass', note: '结构安全' },
            { name: '装修情况', status: 'fail', note: '墙面有多处开裂，需要修补' },
            { name: '家具家电', status: 'fail', note: '部分家具损坏' },
            { name: '水电燃气', status: 'pass', note: '正常' },
            { name: '门窗锁具', status: 'fail', note: '防盗门锁损坏' }
          ],
          images: ['墙面开裂.jpg', '门锁损坏.jpg'],
          result: '质检不通过，需整改后重新提交',
          rejectReason: '墙面开裂、家具损坏、门锁损坏等问题需整改',
          timeline: [
            { time: '2026-05-08 11:00', action: '工单创建', operator: '孙先生' },
            { time: '2026-05-08 11:30', action: '指派质检员', operator: '系统' },
            { time: '2026-05-08 15:00', action: '质检员上门', operator: '王质检员' },
            { time: '2026-05-08 17:00', action: '质检驳回', operator: '王质检员' }
          ]
        },
        {
          id: 'GD202605005',
          property: '丰台区丽泽商务区两居室',
          type: 'routine',
          status: 'processing',
          creator: '吴女士',
          createdAt: '2026-05-25 08:30',
          assignee: '赵质检员',
          description: '季度例行安全检查',
          items: [
            { name: '消防设施', status: 'pending', note: '' },
            { name: '燃气安全', status: 'pending', note: '' },
            { name: '电路安全', status: 'pending', note: '' },
            { name: '防盗设施', status: 'pending', note: '' }
          ],
          timeline: [
            { time: '2026-05-25 08:30', action: '工单创建', operator: '系统' },
            { time: '2026-05-25 09:00', action: '指派质检员', operator: '系统' }
          ]
        }
      ]);
    } catch (error) {
      console.error('获取工单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderTypes = [
    { value: 'quality', label: '房源质检' },
    { value: 'maintenance', label: '维修工单' },
    { value: 'checkout', label: '退租验房' },
    { value: 'routine', label: '例行检查' }
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已驳回' }
  ];

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    ...orderTypes
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待处理', className: 'badge-warning' },
      processing: { label: '处理中', className: 'badge-info' },
      completed: { label: '已完成', className: 'badge-success' },
      rejected: { label: '已驳回', className: 'badge-danger' }
    };
    return statusMap[status] || { label: status, className: '' };
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      quality: '房源质检',
      maintenance: '维修工单',
      checkout: '退租验房',
      routine: '例行检查'
    };
    return typeMap[type] || type;
  };

  const getItemStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待检查', className: 'badge-warning' },
      pass: { label: '通过', className: 'badge-success' },
      fail: { label: '不通过', className: 'badge-danger' }
    };
    return statusMap[status] || { label: status, className: '' };
  };

  const filteredOrders = workOrders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const typeMatch = typeFilter === 'all' || order.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleProcess = (order) => {
    setSelectedOrder(order);
    setProcessNote('');
    setShowProcessModal(true);
  };

  const handleConfirmProcess = () => {
    if (!processNote) {
      alert('请填写处理说明');
      return;
    }
    alert(`工单 ${selectedOrder.id} 处理已提交！`);
    setShowProcessModal(false);
    setWorkOrders(prev => prev.map(o => 
      o.id === selectedOrder.id 
        ? { ...o, status: 'processing', assignee: user?.real_name || user?.username || '我' }
        : o
    ));
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="flex-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">房源质检工单系统</h1>
          <p className="text-gray">专业的房源质检和维修工单管理</p>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div className="text-2xl font-bold" style={{ color: '#1890ff' }}>
              {workOrders.length}
            </div>
            <div className="text-gray text-sm">全部工单</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <div className="text-2xl font-bold" style={{ color: '#faad14' }}>
              {workOrders.filter(o => o.status === 'pending').length}
            </div>
            <div className="text-gray text-sm">待处理</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <div className="text-2xl font-bold" style={{ color: '#1890ff' }}>
              {workOrders.filter(o => o.status === 'processing').length}
            </div>
            <div className="text-gray text-sm">处理中</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div className="text-2xl font-bold" style={{ color: '#52c41a' }}>
              {workOrders.filter(o => o.status === 'completed').length}
            </div>
            <div className="text-gray text-sm">已完成</div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-4 flex-wrap">
            <div className="filter-item" style={{ minWidth: '180px' }}>
              <label className="form-label">状态筛选</label>
              <select 
                className="form-input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-item" style={{ minWidth: '180px' }}>
              <label className="form-label">类型筛选</label>
              <select 
                className="form-input"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <h3 className="font-bold">工单列表</h3>
          <span className="text-gray text-sm">共 {filteredOrders.length} 条记录</span>
        </div>
        <div className="card-body">
          {filteredOrders.length === 0 ? (
            <div className="text-center text-gray" style={{ padding: '3rem' }}>
              暂无工单记录
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单编号</th>
                  <th>房源</th>
                  <th>类型</th>
                  <th>创建人</th>
                  <th>创建时间</th>
                  <th>处理人</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const status = getStatusBadge(order.status);
                  return (
                    <tr key={order.id}>
                      <td className="font-bold">{order.id}</td>
                      <td className="text-sm">{order.property}</td>
                      <td>
                        <span className="tag">{getTypeLabel(order.type)}</span>
                      </td>
                      <td>{order.creator}</td>
                      <td className="text-sm">{order.createdAt}</td>
                      <td className="text-gray">{order.assignee || '-'}</td>
                      <td>
                        <span className={`badge ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                            onClick={() => handleViewDetail(order)}
                          >
                            查看详情
                          </button>
                          {order.status === 'pending' && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                              onClick={() => handleProcess(order)}
                            >
                              处理
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">工单详情 - {selectedOrder.id}</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="flex-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="tag">{getTypeLabel(selectedOrder.type)}</span>
                  <span className={`badge ${getStatusBadge(selectedOrder.status).className}`}>
                    {getStatusBadge(selectedOrder.status).label}
                  </span>
                </div>
                <span className="text-gray text-sm">{selectedOrder.createdAt}</span>
              </div>
              
              <div className="mb-4">
                <h5 className="font-bold mb-2">{selectedOrder.property}</h5>
                <p className="text-gray text-sm">{selectedOrder.description}</p>
              </div>

              <div className="grid grid-2 mb-4" style={{ gap: '1rem' }}>
                <div>
                  <div className="text-gray text-sm">创建人</div>
                  <div>{selectedOrder.creator}</div>
                </div>
                <div>
                  <div className="text-gray text-sm">处理人</div>
                  <div>{selectedOrder.assignee || '暂未指派'}</div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-bold mb-3">质检项目</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.items?.map((item, i) => {
                    const itemStatus = getItemStatusBadge(item.status);
                    return (
                      <div key={i} className="flex-between" style={{ 
                        padding: '0.75rem', 
                        background: '#f9fafb', 
                        borderRadius: '6px' 
                      }}>
                        <span>{item.name}</span>
                        <div className="flex items-center gap-3">
                          {item.note && <span className="text-gray text-sm">{item.note}</span>}
                          <span className={`badge ${itemStatus.className}`}>
                            {itemStatus.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrder.images && selectedOrder.images.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-bold mb-2">相关图片</h5>
                  <div className="flex gap-2 flex-wrap">
                    {selectedOrder.images.map((img, i) => (
                      <span key={i} className="tag" style={{ padding: '0.5rem 0.75rem' }}>
                        🖼️ {img}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.result && (
                <div className="mb-4" style={{ 
                  background: selectedOrder.status === 'completed' ? '#f0fdf4' : '#fef2f2', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: `1px solid ${selectedOrder.status === 'completed' ? '#86efac' : '#fca5a5'}`
                }}>
                  <div className="font-bold mb-1">
                    {selectedOrder.status === 'completed' ? '✅ 质检结果' : '❌ 驳回原因'}
                  </div>
                  <p className="text-sm">{selectedOrder.result || selectedOrder.rejectReason}</p>
                </div>
              )}

              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <div>
                  <h5 className="font-bold mb-2">处理进度</h5>
                  <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    {selectedOrder.timeline.map((item, i) => (
                      <div key={i} style={{ 
                        position: 'relative', 
                        paddingBottom: i < selectedOrder.timeline.length - 1 ? '1rem' : 0,
                        borderLeft: '2px solid #e5e7eb',
                        paddingLeft: '1.5rem'
                      }}>
                        <div style={{ 
                          position: 'absolute', 
                          left: '-8px', 
                          top: '0',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: i === selectedOrder.timeline.length - 1 ? '#52c41a' : '#d1d5db'
                        }} />
                        <div className="text-sm font-bold">{item.action}</div>
                        <div className="text-gray text-xs">{item.time} · {item.operator}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetailModal(false)}>关闭</button>
              {selectedOrder.status === 'pending' && (
                <button className="btn btn-primary" onClick={() => {
                  setShowDetailModal(false);
                  handleProcess(selectedOrder);
                }}>
                  处理工单
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showProcessModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">处理工单 - {selectedOrder.id}</h3>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <strong>工单信息：</strong>
                <p className="mt-1">{selectedOrder.property}</p>
                <p className="text-sm">{selectedOrder.description}</p>
              </div>
              
              <div className="form-group">
                <label className="form-label">质检项目</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex-between" style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px' 
                    }}>
                      <span>{item.name}</span>
                      <div className="flex gap-2">
                        <button className="btn" style={{ 
                          padding: '0.25rem 0.75rem', 
                          fontSize: '12px',
                          background: '#d1fae5',
                          color: '#065f46'
                        }}>
                          通过
                        </button>
                        <button className="btn" style={{ 
                          padding: '0.25rem 0.75rem', 
                          fontSize: '12px',
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          不通过
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">上传图片（可选）</label>
                <div style={{ 
                  border: '2px dashed #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📷</div>
                  <p className="text-gray text-sm">点击上传质检照片</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">处理说明 *</label>
                <textarea 
                  className="form-input"
                  rows="3"
                  value={processNote}
                  onChange={e => setProcessNote(e.target.value)}
                  placeholder="请详细描述质检情况和处理意见..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowProcessModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmProcess}>
                提交处理结果
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
