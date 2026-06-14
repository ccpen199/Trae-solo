import React, { useState, useEffect } from 'react';
import api from '../api';

const typeMap = {
  fee_reminder: { label: '年费提醒', color: '#1890ff', icon: '💳' },
  case_update: { label: '案件更新', color: '#722ed1', icon: '📋' },
  trademark_alert: { label: '商标预警', color: '#faad14', icon: '⚠️' },
  system: { label: '系统通知', color: '#52c41a', icon: '🔔' }
};

const statusMap = {
  pending: { label: '待处理', color: '#faad14' },
  processing: { label: '处理中', color: '#1890ff' },
  completed: { label: '已完成', color: '#52c41a' },
  rejected: { label: '已驳回', color: '#ff4d4f' }
};

const priorityMap = {
  high: { label: '高', color: '#ff4d4f' },
  medium: { label: '中', color: '#faad14' },
  low: { label: '低', color: '#52c41a' }
};

const mockNotifications = [
  {
    id: 1,
    title: '商标"智云科技"第35类异议答辩提醒',
    message: '您的商标"智云科技"在第35类收到异议申请，请在30天内提交答辩材料。',
    type: 'trademark_alert',
    is_read: false,
    created_at: '2026-06-01 10:30:00',
    status: 'pending',
    assignee: '张经理',
    priority: 'high',
    deadline: '2026-07-01',
    description: '商标局于2026年5月30日发出异议通知书，对方公司对我司第35类"智云科技"商标提出异议，认为该商标与其在先注册商标构成近似。需要在规定期限内提交答辩材料，否则商标将被不予核准注册。',
    timeline: [
      { status: '收到通知', time: '2026-06-01 09:00:00', completed: true },
      { status: '分配处理', time: '2026-06-01 10:30:00', completed: true },
      { status: '处理中', time: '', completed: false },
      { status: '复查', time: '', completed: false },
      { status: '完成', time: '', completed: false }
    ],
    handleRecords: [
      { handler: '张经理', time: '2026-06-01 10:30:00', opinion: '已接收通知，正在准备答辩材料', result: '处理中' }
    ],
    reviewRecords: []
  },
  {
    id: 2,
    title: '第12345678号商标年费缴纳提醒',
    message: '您的第12345678号商标即将到期，请在2026年7月15日前缴纳年费。',
    type: 'fee_reminder',
    is_read: true,
    created_at: '2026-06-03 14:20:00',
    status: 'processing',
    assignee: '李专员',
    priority: 'medium',
    deadline: '2026-07-15',
    description: '第12345678号"智云"商标注册有效期将于2026年8月15日届满，根据商标法规定，需在期满前12个月内办理续展手续。现已进入续展期，请及时缴纳年费并办理续展。',
    timeline: [
      { status: '收到通知', time: '2026-06-03 14:00:00', completed: true },
      { status: '分配处理', time: '2026-06-03 14:20:00', completed: true },
      { status: '处理中', time: '2026-06-05 09:00:00', completed: true },
      { status: '复查', time: '', completed: false },
      { status: '完成', time: '', completed: false }
    ],
    handleRecords: [
      { handler: '李专员', time: '2026-06-03 14:20:00', opinion: '已接收通知', result: '处理中' },
      { handler: '李专员', time: '2026-06-05 09:00:00', opinion: '已确认商标信息，准备走付款流程', result: '处理中' }
    ],
    reviewRecords: []
  },
  {
    id: 3,
    title: '版权登记案件状态更新',
    message: '您的软件著作权登记申请（案件号：CR202605001）已完成审核，等待制证。',
    type: 'case_update',
    is_read: true,
    created_at: '2026-05-28 09:15:00',
    status: 'completed',
    assignee: '王主管',
    priority: 'low',
    deadline: '',
    description: '我司提交的"智云数据管理系统V2.0"软件著作权登记申请已于2026年5月27日通过版权保护中心审核，预计10个工作日内颁发著作权登记证书。',
    timeline: [
      { status: '收到通知', time: '2026-05-28 09:00:00', completed: true },
      { status: '分配处理', time: '2026-05-28 09:15:00', completed: true },
      { status: '处理中', time: '2026-05-28 10:00:00', completed: true },
      { status: '复查', time: '2026-05-29 14:00:00', completed: true },
      { status: '完成', time: '2026-05-30 16:30:00', completed: true }
    ],
    handleRecords: [
      { handler: '王主管', time: '2026-05-28 09:15:00', opinion: '已接收通知，确认审核结果', result: '处理中' },
      { handler: '王主管', time: '2026-05-28 10:00:00', opinion: '已核查案件信息，审核通过无误', result: '处理中' },
      { handler: '王主管', time: '2026-05-30 16:30:00', opinion: '已完成归档，等待发证', result: '已完成' }
    ],
    reviewRecords: [
      { reviewer: '赵经理', time: '2026-05-29 14:00:00', opinion: '审核结果无误，同意结案' }
    ]
  },
  {
    id: 4,
    title: '专利申请补正通知书',
    message: '您的发明专利申请（申请号：CN202610012345.6）收到审查意见通知书，请在15天内答复。',
    type: 'system',
    is_read: true,
    created_at: '2026-06-02 16:45:00',
    status: 'rejected',
    assignee: '刘工程师',
    priority: 'high',
    deadline: '2026-06-17',
    description: '发明专利"基于AI的智能数据分析方法"收到第一次审查意见通知书，审查员认为权利要求1-3不具备创造性，需要在15天内提交补正材料或意见陈述书。',
    timeline: [
      { status: '收到通知', time: '2026-06-02 16:00:00', completed: true },
      { status: '分配处理', time: '2026-06-02 16:45:00', completed: true },
      { status: '处理中', time: '2026-06-03 10:00:00', completed: true },
      { status: '复查', time: '2026-06-06 11:00:00', completed: true },
      { status: '完成', time: '', completed: false }
    ],
    handleRecords: [
      { handler: '刘工程师', time: '2026-06-02 16:45:00', opinion: '已接收审查意见', result: '处理中' },
      { handler: '刘工程师', time: '2026-06-03 10:00:00', opinion: '正在分析审查意见，准备修改权利要求书', result: '处理中' },
      { handler: '刘工程师', time: '2026-06-05 17:00:00', opinion: '已完成第一次修改稿，提交复查', result: '待复查' }
    ],
    reviewRecords: [
      { reviewer: '陈总工', time: '2026-06-06 11:00:00', opinion: '修改后的权利要求仍存在创造性问题，建议补充对比文件和技术效果说明，重新修改后再提交' }
    ]
  },
  {
    id: 5,
    title: '商标监测报告 - 第9类',
    message: '本周监测到3件与您方"智云"商标近似的第9类商标申请，请及时处理。',
    type: 'trademark_alert',
    is_read: false,
    created_at: '2026-06-07 08:00:00',
    status: 'pending',
    assignee: '张经理',
    priority: 'medium',
    deadline: '2026-06-21',
    description: '根据商标监测系统，2026年6月1日-6月7日期间，共有3件第9类商标申请与我司"智云"系列商标构成近似，均处于初审公告期，可在异议期内提出异议。',
    timeline: [
      { status: '收到通知', time: '2026-06-07 08:00:00', completed: true },
      { status: '分配处理', time: '', completed: false },
      { status: '处理中', time: '', completed: false },
      { status: '复查', time: '', completed: false },
      { status: '完成', time: '', completed: false }
    ],
    handleRecords: [],
    reviewRecords: []
  }
];

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', is_read: '' });
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [handleOpinion, setHandleOpinion] = useState('');

  useEffect(() => { fetchNotifications(); }, [filters]);

  const fetchNotifications = async () => {
    try {
      setNotifications(mockNotifications);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filters.status && n.status !== filters.status) return false;
    if (filters.priority && n.priority !== filters.priority) return false;
    if (filters.type && n.type !== filters.type) return false;
    if (filters.is_read === 'unread' && n.is_read) return false;
    if (filters.is_read === 'read' && !n.is_read) return false;
    return true;
  });

  const markRead = async (id) => {
    try { await api.post(`/manager/notifications/${id}/read`); fetchNotifications(); } catch (err) {}
  };

  const viewDetail = (n) => {
    setDetailData({ ...n });
    setShowDetail(true);
    if (!n.is_read) {
      markRead(n.id);
    }
  };

  const handleStatusChange = (newStatus) => {
    const updatedRecords = [...detailData.handleRecords];
    const handlers = ['张经理', '李专员', '王主管', '刘工程师'];
    const handler = handlers[Math.floor(Math.random() * handlers.length)];
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const resultMap = {
      processing: '处理中',
      completed: '已完成',
      rejected: '已驳回'
    };
    
    updatedRecords.push({
      handler: handler,
      time: now,
      opinion: handleOpinion || `标记为${statusMap[newStatus]?.label}`,
      result: resultMap[newStatus] || statusMap[newStatus]?.label
    });

    const updatedTimeline = detailData.timeline.map(item => {
      if (newStatus === 'processing' && item.status === '处理中') {
        return { ...item, time: now, completed: true };
      }
      if (newStatus === 'completed' && (item.status === '复查' || item.status === '完成')) {
        return { ...item, time: now, completed: true };
      }
      return item;
    });

    const updated = { ...detailData, status: newStatus, handleRecords: updatedRecords, timeline: updatedTimeline };
    setDetailData(updated);
    setHandleOpinion('');
    
    setNotifications(prev => prev.map(item => item.id === detailData.id ? updated : item));
  };

  const requestReview = () => {
    const updatedRecords = [...detailData.handleRecords];
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    updatedRecords.push({
      handler: '当前处理人',
      time: now,
      opinion: handleOpinion || '申请复查',
      result: '待复查'
    });

    const updatedTimeline = detailData.timeline.map(item => {
      if (item.status === '复查') {
        return { ...item, time: now, completed: true };
      }
      return item;
    });

    const updated = { ...detailData, handleRecords: updatedRecords, timeline: updatedTimeline };
    setDetailData(updated);
    setHandleOpinion('');
    
    setNotifications(prev => prev.map(item => item.id === detailData.id ? updated : item));
  };

  const closeNotification = () => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const updatedTimeline = detailData.timeline.map(item => {
      if (item.status === '完成') {
        return { ...item, time: now, completed: true };
      }
      return item;
    });
    const updated = { ...detailData, status: 'completed', timeline: updatedTimeline };
    setDetailData(updated);
    setNotifications(prev => prev.map(item => item.id === detailData.id ? updated : item));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>🔔 消息通知</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...styles.filterBtn, ...(filters.is_read === '' ? styles.activeBtn : {}) }} onClick={() => setFilters(p => ({ ...p, is_read: '' }))}>全部</button>
          <button style={{ ...styles.filterBtn, ...(filters.is_read === 'unread' ? styles.activeBtn : {}) }} onClick={() => setFilters(p => ({ ...p, is_read: 'unread' }))}>未读</button>
          <button style={{ ...styles.filterBtn, ...(filters.is_read === 'read' ? styles.activeBtn : {}) }} onClick={() => setFilters(p => ({ ...p, is_read: 'read' }))}>已读</button>
        </div>
      </div>

      <div style={styles.filterBar}>
        <select style={styles.filterSelect} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">全部状态</option>
          {Object.keys(statusMap).map(s => <option key={s} value={s}>{statusMap[s].label}</option>)}
        </select>
        <select style={styles.filterSelect} value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">全部优先级</option>
          {Object.keys(priorityMap).map(p => <option key={p} value={p}>{priorityMap[p].label}</option>)}
        </select>
        <select style={styles.filterSelect} value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">全部类型</option>
          {Object.keys(typeMap).map(t => <option key={t} value={t}>{typeMap[t].label}</option>)}
        </select>
      </div>

      <div style={styles.card}>
        <div style={styles.notifList}>
          {filteredNotifications.map((n) => (
            <div key={n.id} style={{ ...styles.notifItem, ...(n.is_read ? {} : styles.unread) }}>
              <div style={{ ...styles.icon, background: (typeMap[n.type] || typeMap.system).color + '15', color: (typeMap[n.type] || typeMap.system).color }}>
                {(typeMap[n.type] || typeMap.system).icon}
              </div>
              <div style={{ flex: 1, marginLeft: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontWeight: n.is_read ? '400' : '600', fontSize: '14px' }}>{n.title}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ ...styles.badge, background: (statusMap[n.status] || statusMap.pending).color + '20', color: (statusMap[n.status] || statusMap.pending).color }}>
                        {(statusMap[n.status] || statusMap.pending).label}
                      </span>
                      <span style={{ ...styles.priorityBadge, background: (priorityMap[n.priority] || priorityMap.medium).color + '20', color: (priorityMap[n.priority] || priorityMap.medium).color }}>
                        优先级：{(priorityMap[n.priority] || priorityMap.medium).label}
                      </span>
                      <span style={{ ...styles.badge, background: (typeMap[n.type] || typeMap.system).color + '15', color: (typeMap[n.type] || typeMap.system).color }}>
                        {(typeMap[n.type] || typeMap.system).label}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#bfbfbf' }}>{n.created_at}</span>
                    {n.deadline && (
                      <span style={{ fontSize: '12px', color: '#ff4d4f' }}>⏰ 截止：{n.deadline}</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#595959', marginBottom: '8px' }}>{n.message}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    <span>👤 责任人：{n.assignee}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={styles.handleBtn} onClick={() => viewDetail(n)}>处理</button>
                  </div>
                </div>
              </div>
              {!n.is_read && <div style={styles.unreadDot}></div>}
            </div>
          ))}
          {filteredNotifications.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>🎉 暂无通知</div>}
        </div>
      </div>

      {showDetail && detailData && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📋 通知详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>{detailData.title}</h4>
                <span style={{ ...styles.badge, background: (statusMap[detailData.status] || statusMap.pending).color + '20', color: (statusMap[detailData.status] || statusMap.pending).color }}>
                  {(statusMap[detailData.status] || statusMap.pending).label}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: '#8c8c8c' }}>类型：</span>{(typeMap[detailData.type] || typeMap.system).label}</div>
                <div><span style={{ color: '#8c8c8c' }}>优先级：</span>
                  <span style={{ color: (priorityMap[detailData.priority] || priorityMap.medium).color }}>
                    {(priorityMap[detailData.priority] || priorityMap.medium).label}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>创建时间：</span>{detailData.created_at}</div>
                <div><span style={{ color: '#8c8c8c' }}>责任人：</span>{detailData.assignee}</div>
                {detailData.deadline && (
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#8c8c8c' }}>截止日期：</span><span style={{ color: '#ff4d4f' }}>{detailData.deadline}</span></div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>📝 通知内容</h4>
              <div style={{ background: '#fafafa', borderRadius: '8px', padding: '16px', fontSize: '13px', lineHeight: '1.8', color: '#595959' }}>
                {detailData.description || detailData.message}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>📊 处理状态流转</h4>
              <div style={{ background: '#fafafa', borderRadius: '8px', padding: '20px 16px' }}>
                {detailData.timeline.map((item, index) => (
                  <div key={index} style={{ display: 'flex', position: 'relative', paddingBottom: index < detailData.timeline.length - 1 ? '16px' : '0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '12px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: item.completed ? '#52c41a' : '#d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        flexShrink: 0,
                        zIndex: 1
                      }}>
                        {item.completed ? '✓' : index + 1}
                      </div>
                      {index < detailData.timeline.length - 1 && (
                        <div style={{
                          width: '2px',
                          flex: 1,
                          background: item.completed && detailData.timeline[index + 1]?.completed ? '#52c41a' : '#f0f0f0',
                          marginTop: '4px'
                        }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1, paddingTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: item.completed ? '600' : '400', color: item.completed ? '#262626' : '#bfbfbf' }}>
                          {item.status}
                        </span>
                        {item.time && <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.time}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0' }}>📋 处理记录</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {detailData.handleRecords && detailData.handleRecords.length > 0 ? (
                  detailData.handleRecords.map((record, index) => (
                    <div key={index} style={{
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '500' }}>👤 {record.handler}</span>
                        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{record.time}</span>
                      </div>
                      <div style={{ color: '#595959', marginBottom: '4px' }}>处理意见：{record.opinion}</div>
                      <div><span style={{ ...styles.badge, background: '#1890ff20', color: '#1890ff', fontSize: '11px' }}>{record.result}</span></div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c', fontSize: '13px' }}>暂无处理记录</div>
                )}
              </div>
            </div>

            {detailData.reviewRecords && detailData.reviewRecords.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>🔍 复查记录</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailData.reviewRecords.map((record, index) => (
                    <div key={index} style={{
                      background: '#fffbe6',
                      border: '1px solid #ffe58f',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '500' }}>👤 {record.reviewer}</span>
                        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{record.time}</span>
                      </div>
                      <div style={{ color: '#595959' }}>复查意见：{record.opinion}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailData.status !== 'completed' && detailData.status !== 'rejected' && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>✏️ 处理操作</h4>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '60px',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="请输入处理意见..."
                  value={handleOpinion}
                  onChange={(e) => setHandleOpinion(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {detailData.status === 'pending' && (
                    <button style={{ ...styles.actionBtn, background: '#1890ff', color: '#fff' }} onClick={() => handleStatusChange('processing')}>
                      标记处理中
                    </button>
                  )}
                  {detailData.status === 'processing' && (
                    <>
                      <button style={{ ...styles.actionBtn, background: '#52c41a', color: '#fff' }} onClick={() => handleStatusChange('completed')}>
                        提交处理结果
                      </button>
                      <button style={{ ...styles.actionBtn, background: '#faad14', color: '#fff' }} onClick={requestReview}>
                        申请复查
                      </button>
                    </>
                  )}
                  <button style={styles.actionBtn} onClick={closeNotification}>
                    关闭
                  </button>
                </div>
              </div>
            )}

            {detailData.status === 'rejected' && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>✏️ 处理操作</h4>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '60px',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="请输入处理意见..."
                  value={handleOpinion}
                  onChange={(e) => setHandleOpinion(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...styles.actionBtn, background: '#1890ff', color: '#fff' }} onClick={() => handleStatusChange('processing')}>
                    重新处理
                  </button>
                  <button style={styles.actionBtn} onClick={closeNotification}>
                    关闭
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={styles.pageBtn} onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  filterBtn: { padding: '6px 16px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' },
  activeBtn: { background: '#1890ff', borderColor: '#1890ff', color: '#fff' },
  filterBar: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  filterSelect: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', background: '#fff', outline: 'none' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  notifList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  notifItem: { display: 'flex', alignItems: 'flex-start', padding: '16px', borderRadius: '10px', cursor: 'pointer', position: 'relative', background: '#fafafa' },
  unread: { background: '#e6f7ff', border: '1px solid #91d5ff' },
  icon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, marginTop: '2px' },
  unreadDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#f5222d', position: 'absolute', right: '16px', top: '16px' },
  badge: { padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500' },
  priorityBadge: { padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500' },
  handleBtn: { padding: '4px 16px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  pageBtn: { padding: '6px 14px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' },
  actionBtn: { padding: '8px 16px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }
};
