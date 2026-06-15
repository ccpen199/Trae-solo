import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';

export default function Dashboard() {
  const { showToast } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [riskStats, setRiskStats] = useState<any>(null);
  const [diagStats, setDiagStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statRes, diagRes, orderRes, riskRes] = await Promise.all([
        api.get('/orders/stats/summary'),
        api.get('/admin/diagnostic/stats'),
        api.get('/orders/admin/list', { params: { page: 1, pageSize: 10 } }),
        api.get('/admin/risk/logs', { params: { limit: 20 } })
      ] as any);
      if (statRes.success) setStats(statRes.data);
      if (diagRes.success) setDiagStats(diagRes.data);
      if (orderRes.success) setOrders(orderRes.data.list || []);
      if (riskRes.success) setRiskStats({ logs: riskRes.data || [] });
    } catch (e: any) {
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const STAT_CARDS = stats ? [
    { label: '今日订单', value: stats.today?.orders || 0, icon: '📋', color: '#6366f1', trend: '+12.5%' },
    { label: '今日流水', value: `¥${Number(stats.today?.amount || 0).toFixed(2)}`, icon: '💰', color: '#10b981', trend: '+8.3%' },
    { label: '本月订单', value: stats.month?.orders || 0, icon: '📦', color: '#f59e0b', trend: '+15.2%' },
    { label: '本月佣金', value: `¥${Number(stats.monthCommission || 0).toFixed(2)}`, icon: '🎁', color: '#ef4444', trend: '+22.8%' },
    { label: '注册用户', value: stats.totalUsers || 0, icon: '👥', color: '#8b5cf6', trend: '+5.7%' },
    { label: '在售商品', value: stats.totalProducts || 0, icon: '🛍️', color: '#06b6d4', trend: null },
    { label: '今日失败', value: stats.todayFailures || 0, icon: '⚠️', color: '#ef4444', trend: '-3.1%' },
    { label: '本月流水', value: `¥${Number(stats.month?.amount || 0).toFixed(0)}`, icon: '📈', color: '#3b82f6', trend: '+18.6%' }
  ] : [];

  const STATUS_MAP: Record<string, { text: string; cls: string }> = {
    pending: { text: '待支付', cls: 'tag-orange' },
    paid: { text: '待充值', cls: 'tag-blue' },
    recharging: { text: '充值中', cls: 'tag-blue' },
    completed: { text: '已完成', cls: 'tag-green' },
    failed: { text: '已失败', cls: 'tag-red' }
  };

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>;

  return (
    <div>
      <div className="stats-grid">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            {card.trend && (
              <div className={`trend ${card.trend.startsWith('+') ? 'up' : 'down'}`}>
                {card.trend.startsWith('+') ? '↑' : '↓'} {card.trend.replace(/[+-]/, '')} 较昨日
              </div>
            )}
            <div className="icon" style={{ color: card.color }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 充值诊断分析（近30天）</div>
          </div>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#fef2f2', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{diagStats?.totalFailures || 0}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>总失败订单</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0fdf4', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{diagStats?.autoRecoveryRate || 0}%</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>自动恢复率</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#dbeafe', borderRadius: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{diagStats?.avgDiagnosticTime || 0}s</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>平均诊断时间</div>
            </div>
          </div>

          {diagStats?.byRootCause && Object.keys(diagStats.byRootCause).length > 0 && (
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>失败原因分布</div>
              {Object.entries(diagStats.byRootCause).map(([key, val]: any) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div className="flex-between" style={{ fontSize: 13, marginBottom: 4 }}>
                    <span>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: 600 }}>{val} 次</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${(val / (diagStats.totalFailures || 1) * 100)}%`,
                      background: key.includes('STOCK') ? '#ef4444' : key.includes('TIMEOUT') ? '#f59e0b' : key.includes('REGION') ? '#8b5cf6' : '#6366f1'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🛡️ 风控监测</div>
            <span className="tag tag-orange">实时</span>
          </div>
          {riskStats?.logs?.length > 0 ? (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {riskStats.logs.slice(0, 10).map((log: any, idx: number) => (
                <div key={idx} style={{
                  padding: '10px 0', borderBottom: idx < 9 ? '1px solid #f1f5f9' : 'none',
                  fontSize: 12
                }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span className={`tag ${
                      log.risk_level === 'critical' ? 'tag-red' :
                      log.risk_level === 'high' ? 'tag-orange' :
                      log.risk_level === 'medium' ? 'tag-blue' : 'tag-gray'
                    }`}>{log.risk_level?.toUpperCase()}</span>
                    {log.blocked ? <span className="tag tag-red">已拦截</span> : <span className="tag tag-green">放行</span>}
                  </div>
                  <div style={{ color: '#374151' }}>{log.action} - {log.region} · {log.ip?.slice(0, 15)}...</div>
                  <div style={{ color: '#94a3b8', marginTop: 2, fontSize: 11 }}>
                    {new Date((log.created_at || 0) * 1000).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">🛡️</div>暂无风控记录</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 最新订单</div>
          <button className="btn btn-default btn-sm" onClick={() => location.hash = '#/orders'}>查看全部 →</button>
        </div>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品</th>
              <th>用户</th>
              <th>账号</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => {
              const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-gray' };
              return (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.order_no}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                  <td>{o.user_phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{o.recharge_account}</td>
                  <td style={{ fontWeight: 600, color: '#ef4444' }}>¥{o.final_amount}</td>
                  <td><span className={`tag ${s.cls}`}>{s.text}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date((o.created_at || 0) * 1000).toLocaleString('zh-CN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
