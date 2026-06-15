import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';

export default function Dashboard() {
  const { showToast } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res: any = await api.get('/admin/dashboard');
      if (res.success) setData(res.data);
    } catch (e: any) {
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const STAT_CARDS = data ? [
    { label: '今日GMV', value: `¥${Number(data.todayGMV || 0).toFixed(2)}`, icon: '💰', color: '#10b981', trend: '+12.5%' },
    { label: '今日订单', value: data.todayOrders || 0, icon: '📋', color: '#6366f1', trend: '+8.3%' },
    { label: '累计GMV', value: `¥${Number(data.totalGMV || 0).toFixed(0)}`, icon: '📈', color: '#8b5cf6', trend: null },
    { label: '累计订单', value: data.totalOrders || 0, icon: '📦', color: '#f59e0b', trend: null },
    { label: '注册用户', value: data.totalUsers || 0, icon: '👥', color: '#06b6d4', trend: '+5.7%' },
    { label: '在售商品', value: data.totalProducts || 0, icon: '🛍️', color: '#ec4899', trend: null },
    { label: '供应商数', value: data.totalSuppliers || 0, icon: '🏭', color: '#14b8a6', trend: null },
    { label: '今日失败', value: data.todayFailures || 0, icon: '⚠️', color: '#ef4444', trend: '-3.1%' }
  ] : [];

  const COMMISSION_CARDS = data ? [
    { label: '本月佣金', value: `¥${Number(data.monthCommission || 0).toFixed(2)}`, icon: '🎁', color: '#8b5cf6' },
    { label: '待结算佣金', value: `¥${Number(data.pendingCommission || 0).toFixed(2)}`, icon: '⏳', color: '#f59e0b' },
    { label: '充值成功率', value: `${Number(data.rechargeSuccessRate || 0).toFixed(1)}%`, icon: '✅', color: '#10b981' },
    { label: '卡密池总量', value: data.cardPoolCount || 0, icon: '🎫', color: '#6366f1' }
  ] : [];

  const RISK_CARDS = data ? [
    { label: '风控日志数', value: data.riskLogCount || 0, icon: '📜', color: '#6366f1' },
    { label: '今日拦截', value: data.blockedToday || 0, icon: '🚫', color: '#ef4444' },
    { label: 'IP黑名单', value: data.ipBlacklistCount || 0, icon: '🛡️', color: '#f59e0b' },
    { label: '地域限制', value: data.regionLimitCount || 0, icon: '🗺️', color: '#8b5cf6' }
  ] : [];

  const STATUS_MAP: Record<string, { text: string; cls: string; color: string }> = {
    pending: { text: '待支付', cls: 'tag-orange', color: '#f59e0b' },
    paid: { text: '待充值', cls: 'tag-blue', color: '#3b82f6' },
    recharging: { text: '充值中', cls: 'tag-blue', color: '#6366f1' },
    completed: { text: '已完成', cls: 'tag-green', color: '#10b981' },
    failed: { text: '已失败', cls: 'tag-red', color: '#ef4444' }
  };

  const RISK_LEVEL_MAP: Record<string, { text: string; cls: string; color: string }> = {
    critical: { text: '严重', cls: 'tag-red', color: '#ef4444' },
    high: { text: '高', cls: 'tag-orange', color: '#f59e0b' },
    medium: { text: '中', cls: 'tag-blue', color: '#3b82f6' },
    low: { text: '低', cls: 'tag-green', color: '#10b981' }
  };

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>;

  const statusTotal = data?.statusBreakdown?.reduce((sum: number, item: any) => sum + (item.cnt || 0), 0) || 1;
  const riskTotal = data?.levelDistribution?.reduce((sum: number, item: any) => sum + (item.cnt || 0), 0) || 1;

  const getConicGradient = () => {
    if (!data?.levelDistribution?.length) return '#e2e8f0';
    let cumulative = 0;
    const stops: string[] = [];
    data.levelDistribution.forEach((item: any) => {
      const s = RISK_LEVEL_MAP[item.risk_level] || { color: '#94a3b8' };
      const pct = ((item.cnt || 0) / riskTotal) * 100;
      stops.push(`${s.color} ${cumulative}%`);
      cumulative += pct;
      stops.push(`${s.color} ${cumulative}%`);
    });
    return `conic-gradient(${stops.join(', ')})`;
  };

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

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {COMMISSION_CARDS.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            <div className="icon" style={{ color: card.color }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 订单状态分布</div>
            <span className="tag tag-blue">总计: {statusTotal}</span>
          </div>
          {data?.statusBreakdown?.length > 0 ? (
            <div>
              {data.statusBreakdown.map((item: any, idx: number) => {
                const s = STATUS_MAP[item.status] || { text: item.status, cls: 'tag-gray', color: '#94a3b8' };
                const pct = ((item.cnt || 0) / statusTotal) * 100;
                return (
                  <div key={idx} style={{ marginBottom: 14 }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span className="text-sm">
                        <span className={`tag ${s.cls}`} style={{ marginRight: 8 }}>{s.text}</span>
                      </span>
                      <span className="text-sm text-bold">{item.cnt} 单 ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: s.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">📊</div>暂无数据</div>}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🛡️ 风险等级分布</div>
          </div>
          {data?.levelDistribution?.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 160, height: 160, borderRadius: '50%',
                margin: '20px auto',
                position: 'relative',
                background: getConicGradient()
              }}>
                <div style={{
                  position: 'absolute', inset: 30, borderRadius: '50%',
                  background: 'white',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>总计</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{riskTotal}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {data.levelDistribution.map((item: any, idx: number) => {
                  const s = RISK_LEVEL_MAP[item.risk_level] || { text: item.risk_level, cls: 'tag-gray', color: '#94a3b8' };
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }}></span>
                      <span className="text-muted">{s.text}</span>
                      <span className="text-bold">{item.cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <div className="empty" style={{ padding: '40px 20px' }}><div className="empty-icon">🛡️</div>暂无数据</div>}
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {RISK_CARDS.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            <div className="icon" style={{ color: card.color }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">🏭 供应商业绩统计</div>
          <span className="text-sm text-muted">共 {data?.supplierStats?.length || 0} 家供应商</span>
        </div>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>供应商</th>
              <th>编码</th>
              <th>状态</th>
              <th>分润比例</th>
              <th>订单数</th>
              <th>总金额</th>
              <th>失败数</th>
              <th>失败率</th>
            </tr>
          </thead>
          <tbody>
            {data?.supplierStats?.length > 0 ? data.supplierStats.map((s: any) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.code}</td>
                <td>{s.status === 1 ? <span className="tag tag-green">正常</span> : <span className="tag tag-gray">停用</span>}</td>
                <td>{(s.settlement_ratio * 100).toFixed(1)}%</td>
                <td>{s.totalOrders || 0}</td>
                <td style={{ color: '#ef4444', fontWeight: 600 }}>¥{Number(s.totalAmount || 0).toFixed(2)}</td>
                <td style={{ color: '#ef4444' }}>{s.failCount || 0}</td>
                <td>
                  {s.failRate !== undefined && s.failRate !== null ? (
                    <span className={`tag ${Number(s.failRate) > 5 ? 'tag-red' : Number(s.failRate) > 2 ? 'tag-orange' : 'tag-green'}`}>
                      {Number(s.failRate).toFixed(2)}%
                    </span>
                  ) : '-'}
                </td>
              </tr>
            )) : <tr><td colSpan={8} className="empty"><div className="empty-icon">🏭</div>暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎫 卡密池概览</div>
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#f0fdf4', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>{data?.cardPoolCount || 0}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>总卡密数</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#dbeafe', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{data?.cardUsed || 0}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>已使用</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#fef2f2', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{data?.cardExpired || 0}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>已过期</div>
            </div>
          </div>
          <div>
            <div className="flex-between text-sm mb-8">
              <span className="text-muted">可用率</span>
              <span className="text-bold">
                {data?.cardPoolCount ? Math.round(((data.cardPoolCount - (data.cardUsed || 0)) / data.cardPoolCount) * 100) : 0}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${data?.cardPoolCount ? ((data.cardPoolCount - (data.cardUsed || 0)) / data.cardPoolCount) * 100 : 0}%`
              }}></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🔍 诊断统计</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#6366f1' }}>{data?.diagnosticCount || 0}</div>
            <div style={{ color: '#64748b', marginTop: 8 }}>累计诊断次数</div>
          </div>
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 10, textAlign: 'center' }}>
            <div className="text-sm text-muted">智能诊断系统实时监控订单异常，自动分析失败原因并提供解决方案</div>
          </div>
        </div>
      </div>
    </div>
  );
}
