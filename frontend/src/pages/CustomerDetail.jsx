import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api.js';

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    const res = await api.get(`/customers/${id}`);
    setCustomer(res.data);
  };

  if (!customer) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-default" onClick={() => navigate(-1)}>← 返回</button>
          <h2>{customer.name}</h2>
          {Boolean(customer.is_child) && <span className="badge badge-warning">儿童</span>}
          {Boolean(customer.is_special) && <span className="badge badge-error">特殊人群</span>}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={`/optometry/new?customer_id=${id}`} className="btn btn-success">新建验光</Link>
          <Link to={`/orders/new?customer_id=${id}`} className="btn btn-primary">创建订单</Link>
        </div>
      </div>

      {Boolean(customer.is_special) && customer.special_notes && (
        <div className="alert alert-warning">
          <strong>⚠️ 特殊提醒：</strong>{customer.special_notes}
        </div>
      )}

      <div className="tabs">
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</div>
        <div className={`tab ${activeTab === 'optometry' ? 'active' : ''}`} onClick={() => setActiveTab('optometry')}>验光记录</div>
        <div className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>历史订单</div>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <div className="card-title">基本信息</div>
          <div className="grid-2">
            <div>
              <div style={{ marginBottom: 16 }}>
                <span className="text-muted">手机号：</span>
                <span>{customer.phone}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="text-muted">性别：</span>
                <span>{customer.gender || '-'}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="text-muted">年龄：</span>
                <span>{customer.age || '-'}</span>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 16 }}>
                <span className="text-muted">镜架偏好：</span>
                <span>{customer.frame_preference || '-'}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="text-muted">眼健康提示：</span>
                <span>{customer.health_tips || '-'}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="text-muted">创建时间：</span>
                <span>{customer.created_at}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'optometry' && (
        <div className="card">
          <div className="card-title">验光记录</div>
          {customer.optometryRecords?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>验光师</th>
                  <th>球镜(OD/OS)</th>
                  <th>柱镜(OD/OS)</th>
                  <th>瞳距</th>
                  <th>矫正视力</th>
                  <th>验光时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customer.optometryRecords.map(r => (
                  <tr key={r.id}>
                    <td>{r.optometrist}</td>
                    <td>{r.sphere_od || '-'}/{r.sphere_os || '-'}</td>
                    <td>{r.cylinder_od || '-'}/{r.cylinder_os || '-'}</td>
                    <td>{r.pd || '-'}</td>
                    <td>{r.corrected_vision_od || '-'}/{r.corrected_vision_os || '-'}</td>
                    <td>{r.created_at?.split('T')[0]}</td>
                    <td>
                      <Link to={`/optometry/${r.id}/edit`} className="btn btn-sm btn-default">修改</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-muted">暂无验光记录</div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card">
          <div className="card-title">历史订单</div>
          {customer.orders?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.order_no}</td>
                    <td>¥{o.total_amount}</td>
                    <td><span className="badge badge-primary">{o.status}</span></td>
                    <td>{o.created_at?.split('T')[0]}</td>
                    <td>
                      <Link to={`/orders/${o.id}`} className="btn btn-sm btn-default">查看</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-muted">暂无订单</div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerDetail;
