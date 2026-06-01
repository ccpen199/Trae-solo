import React, { useState, useEffect } from 'react';
import { interviews } from '../api';

function Timeline() {
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const res = await interviews.list({ limit: 50 });
      setInterviewList(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadAuditLogs = async (id) => {
    setLogsLoading(true);
    try {
      const res = await interviews.getAudit(id);
      setAuditLogs(res.data);
      setSelectedInterview(id);
    } catch (err) {
      console.error(err);
    }
    setLogsLoading(false);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '待处理',
      transcribing: '转写中',
      transcribed: '已转写',
      reviewing: '审核中',
      clustering: '聚类中',
      summarizing: '总结中',
      completed: '已完成',
      archived: '已归档'
    };
    return labels[status] || status;
  };

  const getActionIcon = (action) => {
    const icons = {
      create: '➕',
      update: '✏️',
      delete: '🗑️',
      batch_update: '📦',
      auto_generate: '🤖'
    };
    return icons[action] || '📝';
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>时间线</h2>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>访谈记录</h3>
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {interviewList.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">暂无访谈记录</div>
              </div>
            ) : (
              interviewList.map(interview => (
                <div 
                  key={interview.id}
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: selectedInterview === interview.id ? '#ebf8ff' : 'transparent',
                    borderRadius: '8px',
                    marginBottom: '4px'
                  }}
                  onClick={() => loadAuditLogs(interview.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ marginBottom: '4px' }}>{interview.title}</h4>
                    <span className={`badge badge-${interview.status}`} style={{ fontSize: '11px' }}>
                      {getStatusLabel(interview.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {interview.interviewee_name || '未命名被访者'} · 
                    {new Date(interview.created_at * 1000).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>变更历史</h3>
          </div>
          {!selectedInterview ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">👈</div>
              <div className="empty-state-title">选择左侧访谈查看详情</div>
            </div>
          ) : logsLoading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="timeline" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {auditLogs.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}>
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">暂无变更记录</div>
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-dot" style={{
                      background: log.action_type === 'delete' ? '#fc8181' : 
                                  log.action_type === 'create' ? '#68d391' : '#4299e1'
                    }}></div>
                    <div className="timeline-time">
                      {new Date(log.created_at * 1000).toLocaleString('zh-CN')}
                    </div>
                    <div className="timeline-title">
                      {getActionIcon(log.action_type)} {log.actor_name}
                    </div>
                    <div className="timeline-desc">
                      {log.change_reason}
                      <div style={{ fontSize: '12px', marginTop: '4px', color: '#a0aec0' }}>
                        对象: {log.object_type}
                      </div>
                    </div>
                    {log.recovery_path && (
                      <div style={{ marginTop: '8px' }}>
                        <span className="tag" style={{ cursor: 'pointer' }}>
                          🔄 可恢复
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
