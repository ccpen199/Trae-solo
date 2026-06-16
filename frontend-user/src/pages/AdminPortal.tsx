import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { adminApi } from '../api/modules';

export default function AdminPortal() {
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:50212';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then((res: any) => setStats(res?.data || res))
      .catch(() => adminApi.getStats().then((res: any) => setStats(res?.data || res)).catch(() => null))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: '订单管理', value: stats?.totalOrders ?? 0, suffix: '单' },
    { label: '商品管理', value: stats?.totalProducts ?? 0, suffix: '款' },
    { label: '用户管理', value: stats?.totalUsers ?? 0, suffix: '人' },
    { label: '交易额', value: `¥${Number(stats?.totalGMV || 0).toLocaleString()}`, suffix: '' }
  ];

  return (
    <div>
      <Header title="管理后台" />
      <div className="card">
        <div className="flex-between mb-16">
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>管理后台数据概览</h2>
            <p className="text-gray mt-8">商品、订单、用户、佣金与卡密池统一运营管理</p>
          </div>
          <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '8px 14px' }}>
            打开独立后台
          </a>
        </div>

        <div className="grid-2">
          {metrics.map(item => (
            <div key={item.label} className="stat-card">
              <div className="num">{loading ? '...' : item.value}{!loading && item.suffix}</div>
              <div className="label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="grid-2">
          <Link to="/category" className="tag tag-blue" style={{ justifyContent: 'center', padding: '10px 12px' }}>商品筛选</Link>
          <Link to="/orders" className="tag tag-green" style={{ justifyContent: 'center', padding: '10px 12px' }}>订单详情</Link>
          <Link to="/commission" className="tag tag-orange" style={{ justifyContent: 'center', padding: '10px 12px' }}>佣金结算</Link>
          <a href={`${adminUrl}/card-pool`} target="_blank" rel="noopener noreferrer" className="tag tag-purple" style={{ justifyContent: 'center', padding: '10px 12px' }}>
            卡密池管理
          </a>
        </div>
      </div>
    </div>
  );
}
