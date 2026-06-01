import React, { useState, useEffect } from 'react';
import { adjustmentsAPI } from '../api';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [adjustRes, notifyRes] = await Promise.all([
      adjustmentsAPI.getAll(),
      adjustmentsAPI.getNotifications('dispatcher')
    ]);

    if (adjustRes.success) setAdjustments(adjustRes.data);
    if (notifyRes.success) setNotifications(notifyRes.data);
  }

  async function markAsRead(id) {
    await adjustmentsAPI.markRead(id);
    setNotifications(notifications.filter(n => n.id !== id));
  }

  const typeLabels = {
    'update': '更新',
    'delay': '延误',
    'cancel': '取消',
    'reassign': '改靠',
    'weather': '天气停工'
  };

  return (
    <div>
      <div className="page-header">
        <h1>调整记录</h1>
      </div>

      {notifications.length > 0 && (
        <div className="card">
          <h3>📬 未读通知 ({notifications.length})</h3>
          <table className="table">
            <thead>
              <tr>
                <th>消息</th>
                <th>相关船舶</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id}>
                  <td>{n.message}</td>
                  <td>{n.ship_name || '-'}</td>
                  <td>{new Date(n.created_at).toLocaleString()}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => markAsRead(n.id)}
                    >
                      标记已读
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3>调整历史</h3>
        <table className="table">
          <thead>
            <tr>
              <th>船舶</th>
              <th>航次</th>
              <th>泊位</th>
              <th>调整类型</th>
              <th>原因</th>
              <th>通知角色</th>
              <th>调整时间</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map(a => (
              <tr key={a.id}>
                <td>{a.ship_name}</td>
                <td>{a.voyage}</td>
                <td>{a.berth_name || '-'}</td>
                <td>
                  <span className={`badge ${
                    a.adjustment_type === 'delay' ? 'badge-warning' :
                    a.adjustment_type === 'cancel' ? 'badge-error' : 'badge-info'
                  }`}>
                    {typeLabels[a.adjustment_type] || a.adjustment_type}
                  </span>
                </td>
                <td>{a.reason || '-'}</td>
                <td>{a.notified_roles || '-'}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
