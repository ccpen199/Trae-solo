import React, { useState, useEffect } from 'react';

function ChangeOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    fetch('/api/change-orders')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setOrders(data);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📝 配置变更</h1>
        <p>管理应用配置变更流程</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>变更单列表</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>应用</th>
              <th>类型</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(function(order) {
              return (
                <tr key={order.id}>
                  <td><strong>{order.title}</strong></td>
                  <td>{order.app_name}</td>
                  <td><span className="tag">{order.type}</span></td>
                  <td><span className={'status-badge status-' + order.status}>{order.status}</span></td>
                  <td>{order.created_by}</td>
                  <td>{order.created_at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="empty-state">暂无变更单</div>
        )}
      </div>
    </div>
  );
}

export default ChangeOrders;
