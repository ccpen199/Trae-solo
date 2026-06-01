import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../api';
import type { Delivery } from '../api';

function deliveryStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: '待选片',
    selecting: '选片中',
    selected: '已选片',
    retouching: '修图中',
    retouched: '已修图',
    delivering: '交付中',
    completed: '已交付',
  };
  const label = map[status] || status;
  const cls = status === 'completed' ? 'ok' : status === 'delivering' || status === 'retouching' ? 'active' : 'warn';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function DeliveryList() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Delivery[]>('/api/deliveries')
      .then(setDeliveries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>交付管理</h1>
          <p>共 {deliveries.length} 个交付项目</p>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="card empty-state">
          <p>暂无交付项目</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>相册名称</th>
              <th>客户</th>
              <th>渠道</th>
              <th>状态</th>
              <th>进度</th>
              <th>交付日期</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id} onClick={() => navigate(`/deliveries/${d.id}`)}>
                <td><strong>{d.album_name}</strong></td>
                <td>{d.client_name}</td>
                <td>{d.channel || '-'}</td>
                <td>{deliveryStatusBadge(d.status)}</td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar">
                      <div
                        className={`fill ${d.progress >= 100 ? 'ok' : d.progress >= 50 ? '' : 'warn'}`}
                        style={{ width: `${d.progress}%` }}
                      />
                    </div>
                    <span>{d.progress}%</span>
                  </div>
                </td>
                <td>{d.delivery_date || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
