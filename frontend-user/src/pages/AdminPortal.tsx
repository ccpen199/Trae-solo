import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { adminApi } from '../api/modules';

interface RiskLog {
  id: string;
  type: string;
  level: 'high' | 'medium' | 'low';
  ip?: string;
  user_id?: string;
  reason: string;
  created_at: number;
  status: 'blocked' | 'warning' | 'released';
}

interface Settlement {
  id: string;
  supplier_name: string;
  period: string;
  total_amount: number;
  settled_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
}

interface ProfitConfig {
  id: string;
  name: string;
  level1_rate: number;
  level2_rate: number;
  level3_rate: number;
  platform_rate: number;
  supplier_rate: number;
  status: number;
}

interface CardPoolStat {
  id: string;
  product_name: string;
  total_count: number;
  used_count: number;
  encrypted_count: number;
  encryption_algorithm: string;
}

interface CryptoLog {
  id: string;
  action: 'encrypt' | 'decrypt';
  operator: string;
  card_count: number;
  algorithm: string;
  created_at: number;
  status: 'success' | 'failed';
}

interface Invoice {
  id: string;
  invoice_no: string;
  amount: number;
  type: 'vat' | 'normal' | 'electronic';
  title: string;
  status: 'pending' | 'issued' | 'mailed' | 'received';
  created_at: number;
}

export default function AdminPortal() {
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:50212';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riskLogs, setRiskLogs] = useState<RiskLog[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [profitConfigs, setProfitConfigs] = useState<ProfitConfig[]>([]);
  const [cardPool, setCardPool] = useState<CardPoolStat[]>([]);
  const [cryptoLogs, setCryptoLogs] = useState<CryptoLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'settlement' | 'profit' | 'cardpool' | 'invoice'>('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getDashboard()
        .then((res: any) => setStats(res?.data || res))
        .catch(() => adminApi.getStats().then((res: any) => setStats(res?.data || res)).catch(() => null)),
      adminApi.getRiskLogs(5).then((res: any) => setRiskLogs(res?.data || res || [])).catch(() => []),
      adminApi.getSettlements().then((res: any) => setSettlements(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getProfitConfigs().then((res: any) => setProfitConfigs(res?.data || res || [])).catch(() => []),
      adminApi.getCardPool().then((res: any) => setCardPool(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getCardCryptoLogs().then((res: any) => setCryptoLogs(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getInvoices().then((res: any) => setInvoices(res?.data?.list || res?.data || res || [])).catch(() => [])
    ]).finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: '订单管理', value: stats?.totalOrders ?? stats?.orderCount ?? 0, suffix: '单', icon: '📦', color: '#667eea' },
    { label: '商品管理', value: stats?.totalProducts ?? stats?.productCount ?? 0, suffix: '款', icon: '🛒', color: '#52c41a' },
    { label: '用户管理', value: stats?.totalUsers ?? stats?.userCount ?? 0, suffix: '人', icon: '👥', color: '#fa8c16' },
    { label: '交易额', value: `¥${Number(stats?.totalGMV || stats?.gmv || 0).toLocaleString()}`, suffix: '', icon: '💰', color: '#f5576c' }
  ];

  const extraMetrics = [
    { label: '今日风控拦截', value: stats?.riskBlockedToday ?? stats?.riskCount ?? 0, suffix: '次', icon: '🛡️', color: '#ff4d4f' },
    { label: '待处理结算', value: stats?.pendingSettlements ?? 0, suffix: '笔', icon: '💳', color: '#1890ff' },
    { label: '卡密池总量', value: stats?.cardPoolTotal ?? stats?.cardPoolCount ?? 0, suffix: '张', icon: '🔐', color: '#722ed1' },
    { label: '本月分润', value: `¥${Number(stats?.monthlyProfit || 0).toLocaleString()}`, suffix: '', icon: '📈', color: '#13c2c2' }
  ];

  const tabs = [
    { key: 'overview', label: '📊 数据概览' },
    { key: 'risk', label: `🛡️ 风控${riskLogs.length > 0 ? ` (${riskLogs.length})` : ''}` },
    { key: 'settlement', label: `💳 结算${settlements.length > 0 ? ` (${settlements.length})` : ''}` },
    { key: 'profit', label: '📈 分润' },
    { key: 'cardpool', label: `🔐 卡密${cardPool.length > 0 ? ` (${cardPool.length})` : ''}` },
    { key: 'invoice', label: `🧾 发票${invoices.length > 0 ? ` (${invoices.length})` : ''}` }
  ];

  const formatTime = (ts: number) => {
    if (!ts) return '-';
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getRiskLevelStyle = (level: string) => {
    switch (level) {
      case 'high': return { bg: '#fff1f0', color: '#cf1322', border: '#ffa39e' };
      case 'medium': return { bg: '#fffbe6', color: '#d48806', border: '#ffe58f' };
      default: return { bg: '#e6f7ff', color: '#096dd9', border: '#91d5ff' };
    }
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string; text: string }> = {
      blocked: { bg: '#fff1f0', color: '#cf1322', text: '已拦截' },
      warning: { bg: '#fffbe6', color: '#d48806', text: '已告警' },
      released: { bg: '#f6ffed', color: '#389e0d', text: '已放行' },
      pending: { bg: '#fffbe6', color: '#d48806', text: '待处理' },
      processing: { bg: '#e6f7ff', color: '#096dd9', text: '处理中' },
      completed: { bg: '#f6ffed', color: '#389e0d', text: '已完成' },
      failed: { bg: '#fff1f0', color: '#cf1322', text: '已失败' },
      issued: { bg: '#e6f7ff', color: '#096dd9', text: '已开票' },
      mailed: { bg: '#fff7e6', color: '#d46b08', text: '已邮寄' },
      received: { bg: '#f6ffed', color: '#389e0d', text: '已签收' },
      success: { bg: '#f6ffed', color: '#389e0d', text: '成功' },
      encrypt: { bg: '#f9f0ff', color: '#722ed1', text: '加密' },
      decrypt: { bg: '#fff0f6', color: '#eb2f96', text: '解密' }
    };
    return map[status] || { bg: '#fafafa', color: '#999', text: status };
  };

  return (
    <div>
      <Header title="运营后台" />
      <div className="card">
        <div className="flex-between mb-16">
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>运营后台数据概览</h2>
            <p className="text-gray mt-8">风控拦截、供应商结算、分润、卡密池加密解密、发票统一管理</p>
          </div>
          <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '8px 14px' }}>
            打开独立后台
          </a>
        </div>

        <div className="grid-2">
          {metrics.map(item => (
            <div key={item.label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -4, top: -4, fontSize: 40, opacity: 0.08 }}>{item.icon}</div>
              <div className="num" style={{ color: item.color }}>{loading ? '...' : item.value}{!loading && item.suffix}</div>
              <div className="label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          {extraMetrics.map(item => (
            <div key={item.label} style={{
              padding: 14,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${item.color}10, ${item.color}05)`,
              border: `1px solid ${item.color}30`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
                    {loading ? '...' : item.value}{!loading && item.suffix}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{item.label}</div>
                </div>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: activeTab === tab.key ? 600 : 500,
                cursor: 'pointer',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                color: activeTab === tab.key ? 'white' : '#666',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid-2">
            <Link to="/category" className="tag tag-blue" style={{ justifyContent: 'center', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 20 }}>🛒</span>
              <span>商品筛选管理</span>
              <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>200+SKU 商品池</span>
            </Link>
            <Link to="/orders" className="tag tag-green" style={{ justifyContent: 'center', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 20 }}>📦</span>
              <span>订单详情追踪</span>
              <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>通道切换/诊断/重试</span>
            </Link>
            <Link to="/commission" className="tag tag-orange" style={{ justifyContent: 'center', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <span>佣金结算中心</span>
              <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>三级分销/返佣复查</span>
            </Link>
            <a href={`${adminUrl}/card-pool`} target="_blank" rel="noopener noreferrer" className="tag tag-purple" style={{ justifyContent: 'center', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 20 }}>🔐</span>
              <span>卡密池管理</span>
              <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>AES-256-CBC 加密</span>
            </a>
          </div>
        )}

        {activeTab === 'risk' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                🛡️ 风控拦截记录 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>最近 {riskLogs.length} 条</span>
              </div>
              <a href={`${adminUrl}/risk`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                全部记录 →
              </a>
            </div>
            {riskLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无风控拦截记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {riskLogs.map((log) => {
                  const lvStyle = getRiskLevelStyle(log.level);
                  const stStyle = getStatusStyle(log.status);
                  return (
                    <div key={log.id} style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'white',
                      border: `1px solid ${lvStyle.border}`,
                      borderLeft: `3px solid ${lvStyle.color}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background: lvStyle.bg,
                            color: lvStyle.color
                          }}>
                            {log.level === 'high' ? '高危' : log.level === 'medium' ? '中危' : '低危'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{log.type}</span>
                        </div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: stStyle.bg,
                          color: stStyle.color
                        }}>
                          {stStyle.text}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                        {log.reason}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999' }}>
                        <span>{log.ip ? `IP: ${log.ip}` : log.user_id ? `用户: ${log.user_id.slice(0, 8)}` : ''}</span>
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settlement' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                💳 供应商结算单 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>共 {settlements.length} 笔</span>
              </div>
              <a href={`${adminUrl}/settlements`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                全部结算 →
              </a>
            </div>
            {settlements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无结算记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {settlements.slice(0, 5).map((s) => {
                  const stStyle = getStatusStyle(s.status);
                  return (
                    <div key={s.id} style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'white',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{s.supplier_name}</div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: stStyle.bg,
                          color: stStyle.color
                        }}>
                          {stStyle.text}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
                        <div>
                          <div style={{ color: '#999' }}>账期</div>
                          <div style={{ color: '#333', fontWeight: 500 }}>{s.period}</div>
                        </div>
                        <div>
                          <div style={{ color: '#999' }}>应结金额</div>
                          <div style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{s.total_amount?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#999' }}>已结金额</div>
                          <div style={{ color: '#52c41a', fontWeight: 600 }}>¥{s.settled_amount?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, color: '#999', textAlign: 'right' }}>
                        创建: {formatTime(s.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profit' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                📈 分润比例配置
              </div>
              <a href={`${adminUrl}/profit-configs`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                编辑配置 →
              </a>
            </div>
            {profitConfigs.length === 0 ? (
              <div style={{
                padding: 16,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f0f5ff, #f9f0ff)',
                border: '1px solid #d6e4ff'
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                  默认三级分销分润比例
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'L1 直推', rate: 5, color: '#667eea', bg: '#f0f5ff' },
                    { label: 'L2 间推', rate: 3, color: '#f5576c', bg: '#fff0f6' },
                    { label: 'L3 三级', rate: 2, color: '#fa8c16', bg: '#fff7e6' },
                    { label: '平台分成', rate: 5, color: '#52c41a', bg: '#f6ffed' }
                  ].map((item) => (
                    <div key={item.label} style={{
                      padding: 12,
                      borderRadius: 8,
                      background: item.bg,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.rate}%</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profitConfigs.map((cfg) => (
                  <div key={cfg.id} style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'white',
                    border: `1px solid ${cfg.status === 1 ? '#b7eb8f' : '#f0f0f0'}`,
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{cfg.name}</div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: cfg.status === 1 ? '#f6ffed' : '#f5f5f5',
                        color: cfg.status === 1 ? '#389e0d' : '#999'
                      }}>
                        {cfg.status === 1 ? '启用中' : '已停用'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                      <div style={{ textAlign: 'center', padding: '8px 4px', background: '#f0f5ff', borderRadius: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#667eea' }}>{(cfg.level1_rate * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: '#999' }}>L1 直推</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fff0f6', borderRadius: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f5576c' }}>{(cfg.level2_rate * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: '#999' }}>L2 间推</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fff7e6', borderRadius: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fa8c16' }}>{(cfg.level3_rate * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: '#999' }}>L3 三级</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 4px', background: '#f6ffed', borderRadius: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#52c41a' }}>{(cfg.platform_rate * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: '#999' }}>平台分成</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 4px', background: '#e6f7ff', borderRadius: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1890ff' }}>{(cfg.supplier_rate * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: '#999' }}>供应商</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cardpool' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                🔐 卡密池加密状态 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>{cardPool.length} 个商品池</span>
              </div>
              <a href={`${adminUrl}/card-pool`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                卡密池管理 →
              </a>
            </div>

            {cardPool.length > 0 && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cardPool.slice(0, 4).map((cp) => (
                  <div key={cp.id} style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #f0f5ff 100%)',
                    border: '1px solid #d3adf7'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{cp.product_name}</div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        background: '#722ed1',
                        color: 'white'
                      }}>
                        {cp.encryption_algorithm || 'AES-256-CBC'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#999' }}>总量</div>
                        <div style={{ fontWeight: 600, color: '#333' }}>{cp.total_count || 0}张</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#999' }}>已用</div>
                        <div style={{ fontWeight: 600, color: '#fa8c16' }}>{cp.used_count || 0}张</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#999' }}>已加密</div>
                        <div style={{ fontWeight: 600, color: '#52c41a' }}>{cp.encrypted_count || 0}张</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#333',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🔒 加密解密操作日志</span>
              <a href={`${adminUrl}/card-pool/crypto-logs`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea', fontWeight: 400 }}>
                全部日志 →
              </a>
            </div>
            {cryptoLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 12, background: '#fafafa', borderRadius: 10 }}>
                暂无加密解密日志
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cryptoLogs.slice(0, 5).map((log) => {
                  const stStyle = getStatusStyle(log.status);
                  const actStyle = getStatusStyle(log.action);
                  return (
                    <div key={log.id} style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'white',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: actStyle.bg,
                          color: actStyle.color
                        }}>
                          {actStyle.text}
                        </span>
                        <span style={{ color: '#666' }}>{log.operator} · {log.card_count}张卡密</span>
                        <span style={{ color: '#999', fontSize: 10 }}>({log.algorithm})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: stStyle.bg,
                          color: stStyle.color
                        }}>
                          {stStyle.text}
                        </span>
                        <span style={{ color: '#999' }}>{formatTime(log.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invoice' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                🧾 发票管理 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>共 {invoices.length} 张</span>
              </div>
              <a href={`${adminUrl}/invoices`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                全部发票 →
              </a>
            </div>
            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无发票记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invoices.slice(0, 5).map((inv) => {
                  const stStyle = getStatusStyle(inv.status);
                  const typeMap: Record<string, string> = { vat: '增值税专票', normal: '普通发票', electronic: '电子发票' };
                  return (
                    <div key={inv.id} style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'white',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>#{inv.invoice_no}</span>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            background: '#f5f5f5',
                            color: '#666'
                          }}>
                            {typeMap[inv.type] || inv.type}
                          </span>
                        </div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: stStyle.bg,
                          color: stStyle.color
                        }}>
                          {stStyle.text}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                        <div>
                          <div style={{ color: '#333', fontWeight: 500, marginBottom: 2 }}>{inv.title}</div>
                          <div style={{ color: '#999' }}>开票时间: {formatTime(inv.created_at)}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f' }}>
                          ¥{inv.amount?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
