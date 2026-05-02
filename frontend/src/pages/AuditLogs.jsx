import React, { useState, useEffect } from 'react';
import { api } from '../api';
import dayjs from 'dayjs';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: '',
    operatorId: '',
    startTime: '',
    endTime: ''
  });
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.operatorId) params.operatorId = filters.operatorId;
      if (filters.startTime) params.startTime = filters.startTime;
      if (filters.endTime) params.endTime = filters.endTime;
      params.limit = 100;

      const response = await api.getAuditLogs(params);
      if (response.success) {
        setLogs(response.data);
        const types = [...new Set(response.data.map(log => log.event_type))];
        setEventTypes(types);
      }
    } catch (error) {
      console.error('加载审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && logs.length === 0) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>审计日志</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          系统操作审计追踪，支持按状态、人员和时间维度追查
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>事件类型</label>
            <select
              className="input"
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
            >
              <option value="">全部类型</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{getEventTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>开始时间</label>
            <input
              type="date"
              className="input"
              value={filters.startTime}
              onChange={(e) => handleFilterChange('startTime', e.target.value)}
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#666' }}>结束时间</label>
            <input
              type="date"
              className="input"
              value={filters.endTime}
              onChange={(e) => handleFilterChange('endTime', e.target.value)}
            />
          </div>
          <button 
            className="btn btn-default"
            onClick={loadLogs}
          >
            🔄 刷新
          </button>
          <button 
            className="btn btn-default"
            onClick={() => setFilters({ eventType: '', operatorId: '', startTime: '', endTime: '' })}
          >
            🗑️ 清除筛选
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>操作记录 ({logs.length} 条)</h3>
        </div>

        {logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logs.map((log, index) => (
              <div
                key={log.id}
                style={{
                  padding: 16,
                  background: index % 2 === 0 ? '#fafafa' : '#fff',
                  borderRadius: 8,
                  border: '1px solid #e8e8e8'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span className={`status-badge status-${log.event_type === 'order_created' || log.event_type === 'order_completed' ? 'approved' : log.event_type === 'order_cancelled' || log.event_type === 'order_rejected' ? 'rejected' : 'tryon_in_progress'}`}>
                        {getEventTypeLabel(log.event_type)}
                      </span>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                      <strong>{log.operator_name}</strong>
                      <span style={{ color: '#999', marginLeft: 8 }}>({log.operator_role})</span>
                      <span style={{ color: '#666', marginLeft: 8 }}>执行了操作</span>
                    </div>

                    {log.description && (
                      <div style={{ 
                        fontSize: 13, 
                        color: '#666', 
                        background: '#fff',
                        padding: 12,
                        borderRadius: 4,
                        borderLeft: '3px solid #1890ff'
                      }}>
                        {log.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 16, 
                  marginTop: 12, 
                  paddingTop: 12, 
                  borderTop: '1px dashed #e8e8e8',
                  fontSize: 12,
                  color: '#999'
                }}>
                  {log.order_id && (
                    <span>订单: <span style={{ color: '#1890ff' }}>{log.order_id}</span></span>
                  )}
                  {log.product_id && (
                    <span>商品: <span style={{ color: '#52c41a' }}>{log.product_id}</span></span>
                  )}
                  {log.model_3d_id && (
                    <span>3D模型: <span style={{ color: '#722ed1' }}>{log.model_3d_id}</span></span>
                  )}
                  <span>操作人ID: {log.operator_id}</span>
                  <span>日志ID: {log.id}</span>
                </div>

                {log.before_data && Object.keys(log.before_data).length > 0 && (
                  <div style={{ marginTop: 12, fontSize: 12 }}>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                        查看变更详情
                      </summary>
                      <div style={{ marginTop: 8, padding: 12, background: '#fffbe6', borderRadius: 4 }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>变更前:</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 11, color: '#ff4d4f' }}>
                          {JSON.stringify(log.before_data, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            暂无审计日志记录
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>审计事件类型说明</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            { type: 'order_created', label: '订单创建', desc: '创建新的试穿订单' },
            { type: 'camera_opened', label: '摄像头打开', desc: '用户打开摄像头开始试穿' },
            { type: 'recognition_started', label: '识别开始', desc: '开始人脸/人体识别' },
            { type: 'recognition_completed', label: '识别完成', desc: '人脸/人体识别完成' },
            { type: 'tryon_started', label: '试穿开始', desc: '开始AR试穿叠加商品' },
            { type: 'tryon_completed', label: '试穿完成', desc: 'AR试穿完成' },
            { type: 'model_locked', label: '模型锁定', desc: '3D模型被锁定防止并发' },
            { type: 'model_unlocked', label: '模型解锁', desc: '3D模型被解锁' },
            { type: 'screenshot_saved', label: '截图保存', desc: '试穿效果截图已保存' },
            { type: 'order_shared', label: '订单分享', desc: '试穿订单已分享' },
            { type: 'approval_submitted', label: '提交审批', desc: '订单提交审批' },
            { type: 'order_approved', label: '审批通过', desc: '订单审批通过' },
            { type: 'order_rejected', label: '审批驳回', desc: '订单审批驳回' },
            { type: 'order_reassigned', label: '订单转派', desc: '订单责任人转派' },
            { type: 'order_placed', label: '下单成功', desc: '订单确认下单' },
            { type: 'order_paid', label: '支付完成', desc: '订单支付完成' },
            { type: 'order_shipped', label: '已发货', desc: '订单已发货' },
            { type: 'order_completed', label: '订单完成', desc: '订单流程完成' },
            { type: 'order_cancelled', label: '订单取消', desc: '订单被取消' },
            { type: 'reverse_created', label: '逆向单创建', desc: '创建售后逆向订单' },
            { type: 'notification_sent', label: '通知发送', desc: '系统发送通知' },
            { type: 'todo_created', label: '待办创建', desc: '创建新的待办事项' },
            { type: 'todo_completed', label: '待办完成', desc: '待办事项已完成' },
            { type: 'snapshot_created', label: '统计快照', desc: '生成统计快照' }
          ].map(item => (
            <div key={item.type} style={{ 
              padding: 12, 
              background: '#fafafa', 
              borderRadius: 4,
              fontSize: 13
            }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                <span className="status-badge status-pending_approval" style={{ marginRight: 8, fontSize: 11 }}>
                  {item.label}
                </span>
                <span style={{ color: '#999', fontSize: 11 }}>{item.type}</span>
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getEventTypeLabel(type) {
  const labels = {
    order_created: '订单创建',
    camera_opened: '摄像头打开',
    recognition_started: '识别开始',
    recognition_completed: '识别完成',
    tryon_started: '试穿开始',
    tryon_completed: '试穿完成',
    model_locked: '模型锁定',
    model_unlocked: '模型解锁',
    screenshot_saved: '截图保存',
    order_shared: '订单分享',
    approval_submitted: '提交审批',
    order_approved: '审批通过',
    order_rejected: '审批驳回',
    order_reassigned: '订单转派',
    order_placed: '下单成功',
    order_paid: '支付完成',
    order_shipped: '已发货',
    order_completed: '订单完成',
    order_cancelled: '订单取消',
    reverse_created: '逆向单创建',
    notification_sent: '通知发送',
    todo_created: '待办创建',
    todo_completed: '待办完成',
    snapshot_created: '统计快照'
  };
  return labels[type] || type;
}

export default AuditLogs;
