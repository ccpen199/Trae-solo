import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, formatCurrency } from '../api';
import type { Order } from '../api';

function orderStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: '待定',
    deposit_paid: '已付定金',
    contract_signed: '已签约',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };
  const label = map[status] || status;
  const cls = status === 'completed' ? 'ok' : status === 'cancelled' ? 'error' : status === 'in_progress' ? 'active' : 'warn';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Order[]>('/api/orders')
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>订单管理</h1>
          <p>共 {orders.length} 个订单</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card empty-state">
          <p>暂无订单</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>套餐</th>
              <th>金额</th>
              <th>已付</th>
              <th>状态</th>
              <th>拍摄日期</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)}>
                <td><strong>{o.order_no}</strong></td>
                <td>{o.client_name}</td>
                <td>{o.package_name || '-'}</td>
                <td>{formatCurrency(o.amount)}</td>
                <td>{formatCurrency(o.paid_amount)}</td>
                <td>{orderStatusBadge(o.status)}</td>
                <td>{o.shoot_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
