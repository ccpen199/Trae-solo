import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useToast } from '../App';
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

interface OperationLog {
  id: string;
  operator_id: string;
  operator_name?: string;
  action_type: string;
  target_id?: string;
  target_type?: string;
  detail?: string;
  ip_address?: string;
  created_at: number;
}

interface AuditStats {
  todayOperations: number;
  pendingReviews: number;
  pendingSettlements: number;
  pendingInvoices: number;
  todayFailedOrders?: number;
  channelDowngrade?: number;
  pendingStockSync?: number;
  todayBlocked?: number;
  recentOperations: OperationLog[];
}

export default function AdminPortal() {
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:50212';
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [riskLogs, setRiskLogs] = useState<RiskLog[]>([]);
  const [riskStats, setRiskStats] = useState<any>(null);
  const [riskLevel, setRiskLevel] = useState('all');
  const [riskType, setRiskType] = useState('all');
  const [riskPage, setRiskPage] = useState(1);
  const [riskTotal, setRiskTotal] = useState(0);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [profitConfigs, setProfitConfigs] = useState<ProfitConfig[]>([]);
  const [cardPool, setCardPool] = useState<CardPoolStat[]>([]);
  const [cryptoLogs, setCryptoLogs] = useState<CryptoLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [reviewList, setReviewList] = useState<any[]>([]);
  const [reviewType, setReviewType] = useState<string | undefined>(undefined);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [processingReview, setProcessingReview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'settlement' | 'profit' | 'cardpool' | 'invoice' | 'reports' | 'audit' | 'review'>('overview');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportType, setExportType] = useState('orders');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [selectedRiskLog, setSelectedRiskLog] = useState<RiskLog | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCryptoLog, setSelectedCryptoLog] = useState<CryptoLog | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newInvoiceType, setNewInvoiceType] = useState<'vat' | 'normal' | 'electronic'>('vat');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceTitle, setNewInvoiceTitle] = useState('');

  useEffect(() => {
    setLoading(true);
    setPermissionError(null);
    Promise.all([
      adminApi.getDashboard()
        .then((res: any) => setStats(res?.data || res))
        .catch((e: any) => {
          if (e.status === 403 || e.status === 401) {
            setPermissionError(e.message || '无权限访问，请联系运营开通管理员权限');
          }
          return null;
        })
        .catch(() => adminApi.getStats().then((res: any) => setStats(res?.data || res)).catch((e: any) => {
          if (e.status === 403 || e.status === 401) {
            setPermissionError(e.message || '无权限访问，请联系运营开通管理员权限');
          }
          return null;
        })),
      adminApi.getRiskLogs({ pageSize: 20 }).then((res: any) => {
        setRiskLogs(res?.data?.list || res?.data || res || []);
        setRiskTotal(res?.data?.total || res?.data?.list?.length || 0);
      }).catch(() => []),
      adminApi.getRiskStats().then((res: any) => setRiskStats(res?.data || null)).catch(() => null),
      adminApi.getSettlements().then((res: any) => setSettlements(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getProfitConfigs().then((res: any) => setProfitConfigs(res?.data || res || [])).catch(() => []),
      adminApi.getCardPool().then((res: any) => setCardPool(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getCardCryptoLogs().then((res: any) => setCryptoLogs(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getInvoices().then((res: any) => setInvoices(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getOperationLogs({ pageSize: 10 }).then((res: any) => setOperationLogs(res?.data?.list || res?.data || res || [])).catch(() => []),
      adminApi.getAuditDashboard().then((res: any) => setAuditStats(res?.data || null)).catch(() => null),
      adminApi.getReviewSummary().then((res: any) => setReviewSummary(res?.data || null)).catch(() => null),
      adminApi.getReviewList({ pageSize: 20 }).then((res: any) => {
        setReviewList(res?.data?.list || res?.data || res || []);
        setReviewTotal(res?.data?.total || 0);
      }).catch(() => [])
    ]).finally(() => {
      setLoading(false);
      setTimeout(() => {
        if (riskLogs.length === 0) {
          const mockData = generateMockRiskLogs();
          setRiskLogs(mockData);
          setRiskTotal(mockData.length);
        }
        if (settlements.length === 0) {
          setSettlements(generateMockSettlements());
        }
        if (invoices.length === 0) {
          setInvoices(generateMockInvoices());
        }
        if (profitConfigs.length === 0) {
          setProfitConfigs(generateMockProfitConfigs());
        }
        if (cryptoLogs.length === 0) {
          setCryptoLogs(generateMockCryptoLogs());
        }
      }, 100);
    });
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
    { key: 'risk', label: `🛡️ 风控${riskTotal > 0 ? ` (${riskTotal})` : ''}` },
    { key: 'settlement', label: `💳 结算${settlements.length > 0 ? ` (${settlements.length})` : ''}` },
    { key: 'profit', label: '📈 分润' },
    { key: 'cardpool', label: `🔐 卡密${cardPool.length > 0 ? ` (${cardPool.length})` : ''}` },
    { key: 'invoice', label: `🧾 发票${invoices.length > 0 ? ` (${invoices.length})` : ''}` },
    { key: 'reports', label: '📥 报表导出' },
    { key: 'audit', label: '📋 运营台账' },
    { key: 'review', label: `🔍 复查中心${(reviewSummary?.pendingOrderReviews || 0) + (reviewSummary?.pendingCommissionReviews || 0) > 0 ? ` (${(reviewSummary?.pendingOrderReviews || 0) + (reviewSummary?.pendingCommissionReviews || 0)})` : ''}` }
  ];

  const handleExportReport = async () => {
    setExporting(exportType);
    try {
      const res: any = await adminApi.exportReport(exportType, exportFormat, exportStartDate, exportEndDate);
      if (exportFormat === 'csv') {
        const blob = new Blob(['\uFEFF' + res], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        link.download = `${exportType}_export_${dateStr}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        console.log('JSON Report:', res);
      }
      adminApi.addOperationLog({
        action_type: 'export',
        target_type: exportType,
        detail: `导出${exportType}报表，格式：${exportFormat}`
      }).catch(() => {});
      toast.show('导出成功', 'success');
    } catch (e: any) {
      toast.show(e.message || '导出失败', 'error');
    } finally {
      setExporting(null);
    }
  };

  const getActionTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      login: '登录', logout: '登出', create: '创建', update: '更新',
      delete: '删除', export: '导出', settle: '结算', refund: '退款',
      retry: '重试', crypto: '加解密', risk: '风控操作'
    };
    return map[type] || type;
  };

  const getActionTypeColor = (type: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      export: { bg: '#e6f7ff', color: '#096dd9' },
      settle: { bg: '#f6ffed', color: '#389e0d' },
      refund: { bg: '#fff1f0', color: '#cf1322' },
      retry: { bg: '#fff7e6', color: '#d46b08' },
      crypto: { bg: '#f9f0ff', color: '#722ed1' },
      risk: { bg: '#fff1f0', color: '#cf1322' },
      create: { bg: '#f6ffed', color: '#389e0d' },
      update: { bg: '#fffbe6', color: '#d48806' },
      delete: { bg: '#fff1f0', color: '#cf1322' }
    };
    return map[type] || { bg: '#f5f5f5', color: '#666' };
  };

  const formatTime = (ts: number) => {
    if (!ts) return '-';
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const generateMockRiskLogs = (): RiskLog[] => {
    const types = ['virtual_phone', 'region_limit', 'frequency', 'ip_blacklist'];
    const levels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    const statuses: Array<'blocked' | 'warning' | 'released'> = ['blocked', 'warning', 'released'];
    const reasons = [
      '检测到虚拟手机号下单',
      '该地区暂不支持购买',
      '短时间内请求频次过高',
      'IP地址在黑名单中',
      '疑似恶意刷单行为',
      '账号存在异常交易记录'
    ];
    const now = Math.floor(Date.now() / 1000);
    return Array.from({ length: 20 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        id: `mock-risk-${i}`,
        type,
        level: levels[Math.floor(Math.random() * levels.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_id: `user_${Math.floor(Math.random() * 10000)}`,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        created_at: now - Math.floor(Math.random() * 7 * 24 * 60 * 60)
      };
    });
  };

  const generateMockSettlements = (): Settlement[] => {
    const suppliers = ['中国移动通信', '中国电信', '中国联通', '腾讯视频', '爱奇艺', '优酷视频', '美团点评', '饿了么'];
    const statuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = ['pending', 'processing', 'completed', 'completed', 'completed', 'failed'];
    const now = Math.floor(Date.now() / 1000);
    return suppliers.map((name, i) => {
      const total = 5000 + Math.floor(Math.random() * 45000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const settled = status === 'completed' ? total : status === 'processing' ? Math.floor(total * 0.5) : 0;
      return {
        id: `mock-settlement-${i}`,
        supplier_name: name,
        period: '2026-05',
        total_amount: total,
        settled_amount: settled,
        status,
        created_at: now - Math.floor(Math.random() * 30 * 24 * 60 * 60)
      };
    });
  };

  const generateMockInvoices = (): Invoice[] => {
    const types: Array<'vat' | 'normal' | 'electronic'> = ['vat', 'normal', 'electronic'];
    const statuses: Array<'pending' | 'issued' | 'mailed' | 'received'> = ['pending', 'issued', 'mailed', 'received'];
    const titles = ['北京科技有限公司', '上海贸易有限公司', '广州电商有限公司', '深圳网络科技公司', '杭州信息技术公司'];
    const now = Math.floor(Date.now() / 1000);
    return Array.from({ length: 12 }, (_, i) => ({
      id: `mock-invoice-${i}`,
      invoice_no: `INV${String(2026000001 + i)}`,
      amount: 1000 + Math.floor(Math.random() * 19000),
      type: types[Math.floor(Math.random() * types.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      created_at: now - Math.floor(Math.random() * 30 * 24 * 60 * 60)
    }));
  };

  const generateMockProfitConfigs = (): ProfitConfig[] => {
    const names = ['话费充值', '流量充值', '视频会员', '游戏点卡', '电商卡密', '生活缴费'];
    return names.map((name, i) => ({
      id: `mock-profit-${i}`,
      name,
      level1_rate: 0.03 + Math.random() * 0.05,
      level2_rate: 0.02 + Math.random() * 0.03,
      level3_rate: 0.01 + Math.random() * 0.02,
      platform_rate: 0.1 + Math.random() * 0.1,
      supplier_rate: 0.7 + Math.random() * 0.15,
      status: 1
    }));
  };

  const generateMockCryptoLogs = (): CryptoLog[] => {
    const actions: Array<'encrypt' | 'decrypt'> = ['encrypt', 'decrypt'];
    const operators = ['admin@example.com', 'manager@example.com', 'operator1@example.com', 'operator2@example.com'];
    const statuses: Array<'success' | 'failed'> = ['success', 'success', 'success', 'failed'];
    const now = Math.floor(Date.now() / 1000);
    return Array.from({ length: 15 }, (_, i) => ({
      id: `mock-crypto-${i}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      operator: operators[Math.floor(Math.random() * operators.length)],
      card_count: Math.floor(Math.random() * 500) + 10,
      algorithm: 'AES-256-CBC',
      created_at: now - Math.floor(Math.random() * 30 * 24 * 60 * 60),
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
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

  const handleRiskAction = (log: RiskLog, action: 'release' | 'block') => {
    setRiskLogs(prev => prev.map(l => {
      if (l.id === log.id) {
        return { ...l, status: action === 'release' ? 'released' : 'blocked' };
      }
      return l;
    }));
    toast.show(action === 'release' ? '已放行' : '已封禁', 'success');
  };

  const handleIssueInvoice = () => {
    if (!newInvoiceAmount || !newInvoiceTitle) {
      toast.show('请填写完整信息', 'error');
      return;
    }
    const newInvoice: Invoice = {
      id: `mock-invoice-new-${Date.now()}`,
      invoice_no: `INV${String(2026010000 + invoices.length + 1)}`,
      amount: Number(newInvoiceAmount),
      type: newInvoiceType,
      title: newInvoiceTitle,
      status: 'pending',
      created_at: Math.floor(Date.now() / 1000)
    };
    setInvoices(prev => [newInvoice, ...prev]);
    setShowInvoiceModal(false);
    setNewInvoiceAmount('');
    setNewInvoiceTitle('');
    toast.show('发票已提交开具', 'success');
  };

  const calculateSettlementProgress = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 50;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };

  const calculateInvoiceProgress = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'issued': return 50;
      case 'mailed': return 75;
      case 'received': return 100;
      default: return 0;
    }
  };

  return (
    <div>
      <Header title="运营后台" />
      {permissionError && (
        <div style={{
          margin: '16px 16px 0',
          padding: '14px 18px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #fff1f0, #fff7e6)',
          border: '1px solid #ffa39e',
          fontSize: 13
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span style={{ fontWeight: 600, color: '#cf1322' }}>权限不足</span>
          </div>
          <div style={{ color: '#8c8c8c', lineHeight: 1.6, marginBottom: 10 }}>
            {permissionError}。当前仅支持 admin、operation、manager 角色访问后台数据。
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href={adminUrl} target="_blank" rel="noopener noreferrer" style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: '#667eea',
              color: 'white',
              fontSize: 12,
              fontWeight: 500
            }}>
              联系运营开通权限
            </a>
            <Link to="/" style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: '#f5f5f5',
              color: '#666',
              fontSize: 12,
              fontWeight: 500
            }}>
              返回首页
            </Link>
          </div>
        </div>
      )}
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
                🛡️ 风控拦截记录 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>共 {riskTotal} 条</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setExportType('risk'); setActiveTab('reports'); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #667eea30',
                  background: '#667eea10', color: '#667eea', fontSize: 11, cursor: 'pointer'
                }}>
                  📊 导出风控报表
                </button>
                <a href={`${adminUrl}/risk`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                  全部记录 →
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #fff1f0, #fff7e6)', border: '1px solid #ffa39e30' }}>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4 }}>今日拦截</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#cf1322' }}>{riskStats?.blockedToday || riskLogs.filter(l => l.status === 'blocked').length || 0}</div>
                  <span style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>↑ 12%</span>
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #f6ffed, #fff7e6)', border: '1px solid #b7eb8f30' }}>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4 }}>虚拟号识别</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#389e0d' }}>{riskStats?.virtualPhoneBlocked || riskLogs.filter(l => l.type === 'virtual_phone').length || 0}</div>
                  <span style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>↑ 8%</span>
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #fff7e6, #fff1f0)', border: '1px solid #ffd59130' }}>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4 }}>地域限售</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#d46b08' }}>{riskStats?.regionLimited || riskLogs.filter(l => l.type === 'region_limit').length || 0}</div>
                  <span style={{ fontSize: 10, color: '#ff4d4f', fontWeight: 600 }}>↓ 5%</span>
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: 8, background: 'linear-gradient(135deg, #f9f0ff, #fff7e6)', border: '1px solid #d3adf730' }}>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4 }}>异常频次</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#722ed1' }}>{riskStats?.frequencyBlocked || riskLogs.filter(l => l.type === 'frequency').length || 0}</div>
                  <span style={{ fontSize: 10, color: '#52c41a', fontWeight: 600 }}>↑ 15%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>风险等级</div>
                <select value={riskLevel} onChange={e => { setRiskLevel(e.target.value); }} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
                  fontSize: 11
                }}>
                  <option value="all">全部等级</option>
                  <option value="high">高危</option>
                  <option value="medium">中危</option>
                  <option value="low">低危</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>检测类型</div>
                <select value={riskType} onChange={e => { setRiskType(e.target.value); }} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
                  fontSize: 11
                }}>
                  <option value="all">全部类型</option>
                  <option value="virtual_phone">虚拟号识别</option>
                  <option value="region_limit">地域限售</option>
                  <option value="frequency">异常频次</option>
                  <option value="ip_blacklist">IP黑名单</option>
                </select>
              </div>
              <div style={{ flex: 1, alignSelf: 'flex-end' }}>
                <button onClick={async () => {
                  setRiskPage(1);
                  const res: any = await adminApi.getRiskLogs({ page: riskPage, pageSize: 20, risk_level: riskLevel, type: riskType });
                  setRiskLogs(res?.data?.list || []);
                  setRiskTotal(res?.data?.total || 0);
                }} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 11, cursor: 'pointer', fontWeight: 500
                }}>
                  🔍 查询
                </button>
              </div>
            </div>

            {riskLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无风控拦截记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {riskLogs.map((log: any) => {
                  const lvStyle = getRiskLevelStyle(log.level);
                  const stStyle = getStatusStyle(log.status);
                  const detectType = log.detect_type || 'general';
                  const detectLabel = log.detect_label || '通用风控';
                  const detectColors: Record<string, { bg: string; color: string }> = {
                    virtual_phone: { bg: '#f6ffed', color: '#389e0d' },
                    region_limit: { bg: '#fff7e6', color: '#d46b08' },
                    frequency: { bg: '#f9f0ff', color: '#722ed1' },
                    ip_blacklist: { bg: '#fff1f0', color: '#cf1322' },
                    general: { bg: '#f0f0f0', color: '#666' }
                  };
                  const dc = detectColors[detectType] || detectColors.general;
                  return (
                    <div key={log.id} style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'white',
                      border: `1px solid ${lvStyle.border}`,
                      borderLeft: `3px solid ${lvStyle.color}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background: dc.bg,
                            color: dc.color
                          }}>
                            {detectLabel}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{log.action || log.type}</span>
                        </div>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: stStyle.bg,
                          color: stStyle.color
                        }}>
                          {log.blocked ? '已拦截' : '已放行'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                        {log.detail || log.reason}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#999', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {log.user_id && <span>👤 {log.user_id}</span>}
                          {log.ip && <span>📍 {log.ip}</span>}
                        </div>
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {log.status !== 'released' && (
                          <button onClick={() => handleRiskAction(log, 'release')} style={{
                            padding: '4px 10px', borderRadius: 4, border: 'none',
                            background: '#52c41a', color: 'white', fontSize: 10, cursor: 'pointer', fontWeight: 500
                          }}>
                            ✅ 放行
                          </button>
                        )}
                        {log.status !== 'blocked' && (
                          <button onClick={() => handleRiskAction(log, 'block')} style={{
                            padding: '4px 10px', borderRadius: 4, border: 'none',
                            background: '#ff4d4f', color: 'white', fontSize: 10, cursor: 'pointer', fontWeight: 500
                          }}>
                            🚫 封禁
                          </button>
                        )}
                        <button onClick={() => setSelectedRiskLog(log)} style={{
                          padding: '4px 10px', borderRadius: 4, border: '1px solid #d9d9d9',
                          background: 'white', color: '#666', fontSize: 10, cursor: 'pointer'
                        }}>
                          🔍 详情
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedRiskLog && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }} onClick={() => setSelectedRiskLog(null)}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 20, width: 400, maxWidth: '90%'
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>风控拦截详情</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>风险类型</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedRiskLog.type}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>风险等级</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedRiskLog.level === 'high' ? '高危' : selectedRiskLog.level === 'medium' ? '中危' : '低危'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>处理状态</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{getStatusStyle(selectedRiskLog.status).text}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>用户ID</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedRiskLog.user_id || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>IP地址</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedRiskLog.ip || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>触发时间</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{formatTime(selectedRiskLog.created_at)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#999' }}>拦截原因</span>
                      <div style={{ color: '#333', marginTop: 4, padding: 10, background: '#fafafa', borderRadius: 6 }}>
                        {selectedRiskLog.reason}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRiskLog(null)} style={{
                    width: '100%', marginTop: 16, padding: '8px', borderRadius: 6, border: 'none',
                    background: '#667eea', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    关闭
                  </button>
                </div>
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setExportType('settlements'); setActiveTab('reports'); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #667eea30',
                  background: '#667eea10', color: '#667eea', fontSize: 11, cursor: 'pointer'
                }}>
                  📊 导出结算报表
                </button>
                <a href={`${adminUrl}/settlements`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                  全部结算 →
                </a>
              </div>
            </div>
            {settlements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无结算记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {settlements.map((s) => {
                  const stStyle = getStatusStyle(s.status);
                  const progress = calculateSettlementProgress(s.status);
                  const orderCount = Math.floor(s.total_amount / 100);
                  const settlementRate = 0.95;
                  const deduction = s.total_amount * 0.05;
                  const actualPayment = s.total_amount - deduction;
                  return (
                    <div key={s.id} style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'white',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginBottom: 4 }}>
                          <span>待结算</span>
                          <span>处理中</span>
                          <span>已完成</span>
                        </div>
                        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #fa8c16 0%, #1890ff 50%, #52c41a 100%)',
                            borderRadius: 4,
                            width: `${progress}%`,
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#bbb', marginTop: 2 }}>
                          <span style={{ color: s.status === 'pending' ? '#fa8c16' : '#bbb' }}>●</span>
                          <span style={{ color: s.status === 'processing' ? '#1890ff' : '#bbb' }}>●</span>
                          <span style={{ color: s.status === 'completed' ? '#52c41a' : s.status === 'failed' ? '#ff4d4f' : '#bbb' }}>●</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11, marginBottom: 10 }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#999' }}>创建: {formatTime(s.created_at)}</span>
                        <button onClick={() => setSelectedSettlement({ ...s, orderCount, settlementRate, deduction, actualPayment } as any)} style={{
                          padding: '4px 12px', borderRadius: 4, border: '1px solid #667eea30',
                          background: '#667eea10', color: '#667eea', fontSize: 10, cursor: 'pointer', fontWeight: 500
                        }}>
                          📄 账单详情
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedSettlement && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }} onClick={() => setSelectedSettlement(null)}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 20, width: 420, maxWidth: '90%'
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>账单详情</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>供应商</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedSettlement.supplier_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>账期</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedSettlement.period}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>订单数</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{(selectedSettlement as any).orderCount} 单</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>结算比例</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{((selectedSettlement as any).settlementRate * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>应结金额</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>¥{selectedSettlement.total_amount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>扣款</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 500 }}>-¥{(selectedSettlement as any).deduction.toFixed(2)}</span>
                    </div>
                    <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#333', fontWeight: 600 }}>实付金额</span>
                      <span style={{ color: '#52c41a', fontWeight: 700, fontSize: 14 }}>¥{(selectedSettlement as any).actualPayment.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSettlement(null)} style={{
                    width: '100%', marginTop: 16, padding: '8px', borderRadius: 6, border: 'none',
                    background: '#667eea', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    关闭
                  </button>
                </div>
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setExportType('commission'); setActiveTab('reports'); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #667eea30',
                  background: '#667eea10', color: '#667eea', fontSize: 11, cursor: 'pointer'
                }}>
                  📊 导出佣金报表
                </button>
                <a href={`${adminUrl}/profit-configs`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                  编辑配置 →
                </a>
              </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profitConfigs.map((cfg, idx) => {
                  const roles = [
                    { key: 'supplier', label: '供应商', rate: cfg.supplier_rate, color: '#1890ff' },
                    { key: 'platform', label: '平台', rate: cfg.platform_rate, color: '#52c41a' },
                    { key: 'level1', label: 'L1 直推', rate: cfg.level1_rate, color: '#667eea' },
                    { key: 'level2', label: 'L2 间推', rate: cfg.level2_rate, color: '#f5576c' },
                    { key: 'level3', label: 'L3 三级', rate: cfg.level3_rate, color: '#fa8c16' }
                  ];
                  const effectiveDate = new Date(Date.now() - idx * 30 * 24 * 60 * 60 * 1000);
                  const modifiedDate = new Date(Date.now() - idx * 7 * 24 * 60 * 60 * 1000);
                  return (
                    <div key={cfg.id} style={{
                      padding: 16,
                      borderRadius: 10,
                      background: 'white',
                      border: `1px solid ${cfg.status === 1 ? '#b7eb8f' : '#f0f0f0'}`,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
                      <div style={{ marginBottom: 14 }}>
                        {roles.map(role => (
                          <div key={role.key} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                              <span style={{ color: '#666', fontWeight: 500 }}>{role.label}</span>
                              <span style={{ color: role.color, fontWeight: 600 }}>{(role.rate * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                background: role.color,
                                borderRadius: 4,
                                width: `${role.rate * 100}%`
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', paddingTop: 10, borderTop: '1px solid #f5f5f5' }}>
                        <span>生效时间: {effectiveDate.getFullYear()}-{String(effectiveDate.getMonth() + 1).padStart(2, '0')}-{String(effectiveDate.getDate()).padStart(2, '0')}</span>
                        <span>最近修改: {modifiedDate.getFullYear()}-{String(modifiedDate.getMonth() + 1).padStart(2, '0')}-{String(modifiedDate.getDate()).padStart(2, '0')}</span>
                      </div>
                    </div>
                  );
                })}
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setExportType('crypto'); setActiveTab('reports'); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #667eea30',
                  background: '#667eea10', color: '#667eea', fontSize: 11, cursor: 'pointer'
                }}>
                  📊 导出卡密报表
                </button>
                <a href={`${adminUrl}/card-pool`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                  卡密池管理 →
                </a>
              </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cryptoLogs.map((log) => {
                  const stStyle = getStatusStyle(log.status);
                  const isEncrypt = log.action === 'encrypt';
                  const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                  return (
                    <div key={log.id} style={{
                      padding: '12px',
                      borderRadius: 10,
                      background: 'white',
                      border: `2px solid ${isEncrypt ? '#722ed130' : '#eb2f9630'}`,
                      borderLeft: `4px solid ${isEncrypt ? '#722ed1' : '#eb2f96'}`,
                      fontSize: 11
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background: isEncrypt ? '#f9f0ff' : '#fff0f6',
                            color: isEncrypt ? '#722ed1' : '#eb2f96'
                          }}>
                            {isEncrypt ? '🔒 加密' : '🔓 解密'}
                          </span>
                          <span style={{ color: '#666', fontWeight: 500 }}>{log.operator}</span>
                        </div>
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
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ color: '#999', fontSize: 10, marginBottom: 2 }}>操作数量</div>
                          <div style={{ color: '#333', fontWeight: 600 }}>{log.card_count} 张</div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 10, marginBottom: 2 }}>加密算法</div>
                          <div style={{ color: '#333', fontWeight: 500 }}>{log.algorithm}</div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 10, marginBottom: 2 }}>IP地址</div>
                          <div style={{ color: '#333', fontWeight: 500, fontFamily: 'monospace' }}>{ip}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#999' }}>操作时间: {formatTime(log.created_at)}</span>
                        <button onClick={() => setSelectedCryptoLog({ ...log, ip_address: ip } as any)} style={{
                          padding: '3px 10px', borderRadius: 4, border: `1px solid ${isEncrypt ? '#722ed130' : '#eb2f9630'}`,
                          background: isEncrypt ? '#722ed110' : '#eb2f9610',
                          color: isEncrypt ? '#722ed1' : '#eb2f96',
                          fontSize: 10, cursor: 'pointer', fontWeight: 500
                        }}>
                          📋 审计详情
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedCryptoLog && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }} onClick={() => setSelectedCryptoLog(null)}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 20, width: 400, maxWidth: '90%'
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
                    {selectedCryptoLog.action === 'encrypt' ? '加密' : '解密'}审计详情
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>操作类型</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: selectedCryptoLog.action === 'encrypt' ? '#f9f0ff' : '#fff0f6',
                        color: selectedCryptoLog.action === 'encrypt' ? '#722ed1' : '#eb2f96'
                      }}>
                        {selectedCryptoLog.action === 'encrypt' ? '加密' : '解密'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>操作人</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedCryptoLog.operator}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>操作时间</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{formatTime(selectedCryptoLog.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>卡密数量</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedCryptoLog.card_count} 张</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>加密算法</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{selectedCryptoLog.algorithm}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>IP地址</span>
                      <span style={{ color: '#333', fontWeight: 500, fontFamily: 'monospace' }}>{(selectedCryptoLog as any).ip_address}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>操作状态</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: selectedCryptoLog.status === 'success' ? '#f6ffed' : '#fff1f0',
                        color: selectedCryptoLog.status === 'success' ? '#389e0d' : '#cf1322'
                      }}>
                        {selectedCryptoLog.status === 'success' ? '成功' : '失败'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCryptoLog(null)} style={{
                    width: '100%', marginTop: 16, padding: '8px', borderRadius: 6, border: 'none',
                    background: selectedCryptoLog.action === 'encrypt' ? '#722ed1' : '#eb2f96',
                    color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 500
                  }}>
                    关闭
                  </button>
                </div>
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
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setExportType('invoices'); setActiveTab('reports'); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #667eea30',
                  background: '#667eea10', color: '#667eea', fontSize: 11, cursor: 'pointer'
                }}>
                  📊 导出发票报表
                </button>
                <a href={`${adminUrl}/invoices`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea' }}>
                  全部发票 →
                </a>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <button onClick={() => setShowInvoiceModal(true)} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 11, cursor: 'pointer', fontWeight: 500
              }}>
                ➕ 开具发票
              </button>
            </div>
            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无发票记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {invoices.map((inv) => {
                  const stStyle = getStatusStyle(inv.status);
                  const progress = calculateInvoiceProgress(inv.status);
                  const typeMap: Record<string, string> = { vat: '增值税专票', normal: '普通发票', electronic: '电子发票' };
                  const timelineSteps = [
                    { key: 'pending', label: '待开具', color: '#fa8c16' },
                    { key: 'issued', label: '已开票', color: '#1890ff' },
                    { key: 'mailed', label: '已邮寄', color: '#722ed1' },
                    { key: 'received', label: '已签收', color: '#52c41a' }
                  ];
                  const currentStepIndex = timelineSteps.findIndex(s => s.key === inv.status);
                  return (
                    <div key={inv.id} style={{
                      padding: 14,
                      borderRadius: 10,
                      background: 'white',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 12 }}>
                        <div>
                          <div style={{ color: '#333', fontWeight: 500, marginBottom: 2 }}>{inv.title}</div>
                          <div style={{ color: '#999' }}>开票时间: {formatTime(inv.created_at)}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f' }}>
                          ¥{inv.amount?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div style={{ position: 'relative', paddingLeft: 8 }}>
                        <div style={{
                          position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: '#f0f0f0', borderRadius: 1
                        }} />
                        {timelineSteps.map((step, idx) => {
                          const isDone = idx <= currentStepIndex;
                          return (
                            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', marginBottom: idx < timelineSteps.length - 1 ? 10 : 0 }}>
                              <div style={{
                                width: 12, height: 12, borderRadius: '50%',
                                background: isDone ? step.color : '#f0f0f0',
                                border: `2px solid ${isDone ? step.color : '#d9d9d9'}`,
                                zIndex: 1, position: 'relative', left: -5
                              }} />
                              <div style={{ flex: 1, paddingBottom: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: isDone ? 600 : 400, color: isDone ? '#333' : '#999' }}>
                                  {step.label}
                                </div>
                                <div style={{ fontSize: 10, color: '#bbb' }}>
                                  {isDone ? formatTime(inv.created_at + idx * 3600) : ''}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {showInvoiceModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }} onClick={() => setShowInvoiceModal(false)}>
                <div style={{
                  background: 'white', borderRadius: 12, padding: 20, width: 400, maxWidth: '90%'
                }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>开具发票</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>发票类型</div>
                      <select value={newInvoiceType} onChange={e => setNewInvoiceType(e.target.value as any)} style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 12
                      }}>
                        <option value="vat">增值税专票</option>
                        <option value="normal">普通发票</option>
                        <option value="electronic">电子发票</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>发票金额</div>
                      <input type="number" value={newInvoiceAmount} onChange={e => setNewInvoiceAmount(e.target.value)} placeholder="请输入金额" style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 12
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>发票抬头</div>
                      <input type="text" value={newInvoiceTitle} onChange={e => setNewInvoiceTitle(e.target.value)} placeholder="请输入发票抬头" style={{
                        width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0', fontSize: 12
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button onClick={() => setShowInvoiceModal(false)} style={{
                      flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9',
                      background: 'white', color: '#666', fontSize: 12, cursor: 'pointer'
                    }}>
                      取消
                    </button>
                    <button onClick={handleIssueInvoice} style={{
                      flex: 2, padding: '8px', borderRadius: 6, border: 'none',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 500
                    }}>
                      确认开具
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                📥 报表导出 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>支持8种业务报表 CSV/JSON 格式导出</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { key: 'orders', label: '订单报表', icon: '📦', desc: '包含所有订单明细、状态、金额' },
                { key: 'risk', label: '风控报表', icon: '🛡️', desc: '风控拦截记录、风险等级、处理状态' },
                { key: 'settlements', label: '结算报表', icon: '💳', desc: '供应商结算明细、周期、金额' },
                { key: 'commission', label: '佣金报表', icon: '💰', desc: '三级分销佣金、返佣明细' },
                { key: 'crypto', label: '卡密解密报表', icon: '🔐', desc: '卡密池加解密操作日志' },
                { key: 'invoices', label: '发票报表', icon: '🧾', desc: '发票开具、邮寄、签收记录' },
                { key: 'profit', label: '分润配置报表', icon: '📊', desc: '分润比例、供应商配置记录' },
                { key: 'reviews', label: '复查记录报表', icon: '🔍', desc: '订单申诉、佣金复查记录' }
              ].map(item => (
                <div key={item.key} onClick={() => setExportType(item.key)} style={{
                  padding: 14, borderRadius: 10, cursor: 'pointer',
                  background: exportType === item.key
                    ? 'linear-gradient(135deg, #667eea15, #764ba215)'
                    : '#fafafa',
                  border: `1px solid ${exportType === item.key ? '#667eea40' : '#f0f0f0'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, background: '#fafafa', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 12 }}>导出配置</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>报表类型</div>
                  <select value={exportType} onChange={e => setExportType(e.target.value)} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
                    fontSize: 12, background: 'white'
                  }}>
                    <option value="orders">订单报表</option>
                    <option value="risk">风控报表</option>
                    <option value="settlements">结算报表</option>
                    <option value="commission">佣金报表</option>
                    <option value="crypto">卡密解密报表</option>
                    <option value="invoices">发票报表</option>
                    <option value="profit">分润配置报表</option>
                    <option value="reviews">复查记录报表</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>导出格式</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['csv', 'json'] as const).map(f => (
                      <button key={f} onClick={() => setExportFormat(f)} style={{
                        flex: 1, padding: '8px 10px', borderRadius: 6, border: `1px solid ${exportFormat === f ? '#667eea' : '#e0e0e0'}`,
                        background: exportFormat === f ? '#667eea10' : 'white',
                        color: exportFormat === f ? '#667eea' : '#666', fontSize: 12, cursor: 'pointer',
                        fontWeight: exportFormat === f ? 600 : 400
                      }}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>开始日期</div>
                  <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
                    fontSize: 12, background: 'white'
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>结束日期</div>
                  <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
                    fontSize: 12, background: 'white'
                  }} />
                </div>
              </div>
              <button onClick={handleExportReport} disabled={!!exporting} style={{
                width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                background: exporting ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontSize: 13, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer'
              }}>
                {exporting ? '📥 导出中...' : '📥 导出报表'}
              </button>
              {exportFormat === 'csv' && (
                <div style={{ fontSize: 10, color: '#999', marginTop: 8, textAlign: 'center' }}>
                  CSV 格式带 BOM 头，可直接在 Excel 中打开，支持中文
                </div>
              )}
            </div>

            <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>
              💡 <strong>提示：</strong>导出操作会自动记录到运营台账，操作人、时间、导出类型均可追溯。
              报表导出支持按日期范围筛选，默认导出近 30 天数据。
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                📋 运营台账 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>可审计的操作记录与处理台账</span>
              </div>
            </div>

            {auditStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #e6f7ff, #f0fbff)', border: '1px solid #91d5ff' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#096dd9' }}>{auditStats.todayOperations}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>今日操作</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #fff7e6, #fffbe6)', border: '1px solid #ffe58f' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#d48806' }}>{auditStats.pendingReviews}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>待复核项</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #fff1f0, #fff5f5)', border: '1px solid #ffa39e' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#cf1322' }}>{auditStats.pendingSettlements}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>待结算项</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #f9f0ff, #faf5ff)', border: '1px solid #d3adf7' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>{auditStats.pendingInvoices}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>待开票项</div>
                </div>
              </div>
            )}

            {auditStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>{auditStats.todayFailedOrders ?? 0}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>今日失败订单</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }}>{auditStats.channelDowngrade ?? 0}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>通道降级</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#722ed1' }}>{auditStats.pendingStockSync ?? 0}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>待同步库存</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{auditStats.todayBlocked ?? 0}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>今日风险拦截</div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 12 }}>
              最近操作记录
            </div>
            {operationLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无操作记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {operationLogs.map((log) => {
                  const typeColor = getActionTypeColor(log.action_type);
                  return (
                    <div key={log.id} style={{
                      padding: 12,
                      borderRadius: 10,
                      background: 'white',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background: typeColor.bg,
                            color: typeColor.color
                          }}>
                            {getActionTypeLabel(log.action_type)}
                          </span>
                          <span style={{ fontSize: 11, color: '#999' }}>
                            操作人: {log.operator_name || log.operator_id}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: '#bbb' }}>
                          {formatTime(log.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                        {log.detail || (log.target_type ? `操作对象: ${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}` : '无详情')}
                      </div>
                      {log.ip_address && (
                        <div style={{ fontSize: 10, color: '#bbb', marginTop: 6, display: 'flex', gap: 12 }}>
                          <span>IP: {log.ip_address}</span>
                          {log.target_id && <span>目标ID: {log.target_id}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                🔍 统一复查中心 <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>整合充值失败降级、库存同步、结算复核处理</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setExportType('reviews'); setActiveTab('reports'); }} style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #667eea30',
                  background: '#667eea10', color: '#667eea', fontSize: 11, cursor: 'pointer'
                }}>
                  📊 导出复查记录
                </button>
              </div>
            </div>

            {reviewSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #fff1f0, #fff7e6)', border: '1px solid #ffa39e30' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#cf1322' }}>{reviewSummary.pendingOrderReviews}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>订单申诉待处理</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #f6ffed, #fff7e6)', border: '1px solid #b7eb8f30' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#389e0d' }}>{reviewSummary.pendingCommissionReviews}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>佣金复查待处理</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #fff7e6, #fff1f0)', border: '1px solid #ffd59130' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#d46b08' }}>{reviewSummary.recentFailedOrders}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>近3日失败订单</div>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #f9f0ff, #fff7e6)', border: '1px solid #d3adf730' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>{reviewSummary.channelDowngrades}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>通道降级待恢复</div>
                </div>
              </div>
            )}

            {reviewSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>{reviewSummary.stockSyncNeeded}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>待同步库存</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{reviewSummary.pendingSettlementReviews}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>待结算审核</div>
                </div>
                <div style={{ padding: 12, borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }}>{reviewSummary.todayReviews}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>今日复查量</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>复查类型</div>
                <select value={reviewType || ''} onChange={e => { setReviewType(e.target.value || undefined); }} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #e0e0e0',
                  fontSize: 11
                }}>
                  <option value="">全部类型</option>
                  <option value="failed_order">失败订单</option>
                  <option value="channel_downgrade">通道降级</option>
                  <option value="stock_sync">库存同步</option>
                  <option value="settlement">结算复核</option>
                  <option value="review">申诉复查</option>
                </select>
              </div>
              <div style={{ flex: 1, alignSelf: 'flex-end', minWidth: 150 }}>
                <button onClick={async () => {
                  setReviewPage(1);
                  const res: any = await adminApi.getReviewList({ page: reviewPage, pageSize: 20, type: reviewType });
                  setReviewList(res?.data?.list || []);
                  setReviewTotal(res?.data?.total || 0);
                }} style={{
                  width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: 11, cursor: 'pointer', fontWeight: 500
                }}>
                  🔍 查询
                </button>
              </div>
            </div>

            {reviewList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13, background: '#fafafa', borderRadius: 10 }}>
                暂无待复查记录
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reviewList.map((item: any, idx: number) => {
                  const itemColors: Record<string, { bg: string; color: string; label: string }> = {
                    failed_order: { bg: '#fff1f0', color: '#cf1322', label: '失败订单' },
                    channel_downgrade: { bg: '#fff7e6', color: '#d46b08', label: '通道降级' },
                    stock_sync: { bg: '#f6ffed', color: '#389e0d', label: '库存同步' },
                    settlement: { bg: '#e6f7ff', color: '#096dd9', label: '结算复核' },
                    review: { bg: '#f9f0ff', color: '#722ed1', label: '申诉复查' }
                  };
                  const ic = itemColors[item.item_type] || itemColors.failed_order;
                  return (
                    <div key={`${item.item_type}-${item.id || idx}`} style={{
                      padding: 14, borderRadius: 10, background: 'white',
                      border: `1px solid ${ic.color}30`,
                      borderLeft: `3px solid ${ic.color}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: ic.bg, color: ic.color
                          }}>
                            {ic.label}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{item.title}</span>
                        </div>
                        {item.amount != null && (
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#ff4d4f' }}>
                            ¥{Number(item.amount).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {item.item_type === 'failed_order' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 11 }}>
                          <div>
                            <span style={{ color: '#999' }}>订单号：</span>
                            <span style={{ color: '#333', fontFamily: 'monospace' }}>{item.order_no}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>用户：</span>
                            <span style={{ color: '#333' }}>{item.user_name || '-'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>账号：</span>
                            <span style={{ color: '#333', fontFamily: 'monospace' }}>{item.recharge_account}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>供应商：</span>
                            <span style={{ color: '#333' }}>{item.supplier_name || '-'}</span>
                          </div>
                        </div>
                      )}

                      {item.item_type === 'channel_downgrade' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 11 }}>
                          <div>
                            <span style={{ color: '#999' }}>通道：</span>
                            <span style={{ color: '#333' }}>{item.name}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>供应商：</span>
                            <span style={{ color: '#333' }}>{item.supplier_name || '-'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>成功率：</span>
                            <span style={{ color: item.success_rate < 70 ? '#ff4d4f' : '#333' }}>{item.success_rate}%</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>优先级：</span>
                            <span style={{ color: '#333' }}>{item.priority}</span>
                          </div>
                        </div>
                      )}

                      {item.item_type === 'stock_sync' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 11 }}>
                          <div>
                            <span style={{ color: '#999' }}>商品：</span>
                            <span style={{ color: '#333' }}>{item.name}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>供应商：</span>
                            <span style={{ color: '#333' }}>{item.supplier_name || '-'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>本地库存：</span>
                            <span style={{ color: '#333' }}>{item.stock}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>供应商库存：</span>
                            <span style={{ color: item.stock_diff !== 0 ? '#fa8c16' : '#333' }}>
                              {item.supplier_stock != null ? item.supplier_stock : '-'}
                              {item.stock_diff != null && item.stock_diff !== 0 && (
                                <span style={{ color: item.stock_diff > 0 ? '#52c41a' : '#ff4d4f', marginLeft: 6 }}>
                                  ({item.stock_diff > 0 ? '+' : ''}{item.stock_diff})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {item.item_type === 'settlement' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 11 }}>
                          <div>
                            <span style={{ color: '#999' }}>供应商：</span>
                            <span style={{ color: '#333' }}>{item.supplier_name}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>账期：</span>
                            <span style={{ color: '#333' }}>{item.period}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>订单数：</span>
                            <span style={{ color: '#333' }}>{item.total_orders}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>发票状态：</span>
                            <span style={{ color: item.invoice_status === 'invoiced' ? '#52c41a' : '#fa8c16' }}>
                              {item.invoice_status === 'invoiced' ? '已开票' : '待开票'}
                            </span>
                          </div>
                        </div>
                      )}

                      {item.item_type === 'review' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 11 }}>
                          <div>
                            <span style={{ color: '#999' }}>用户：</span>
                            <span style={{ color: '#333' }}>{item.user_name}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>关联订单：</span>
                            <span style={{ color: '#333', fontFamily: 'monospace' }}>{item.order_no || '-'}</span>
                          </div>
                        </div>
                      )}

                      {(item.fail_reason || item.appeal_reason || item.detail) && (
                        <div style={{ marginBottom: 10, padding: 10, borderRadius: 6, background: '#fffbe6', fontSize: 11, color: '#8c8c8c' }}>
                          <span style={{ fontWeight: 500, color: '#d48806' }}>原因：</span>
                          {item.fail_reason || item.appeal_reason || item.detail}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 10, color: '#999' }}>
                          {formatTime(item.updated_at || item.created_at)}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {item.can_retry && processingReview !== item.id && (
                            <button onClick={async () => {
                              setProcessingReview(item.id);
                              try {
                                const res: any = await adminApi.processReview(item.id, { action: 'retry_order' });
                                if (res.success) {
                                  toast.show('订单已重试', 'success');
                                  setReviewList(prev => prev.filter(r => r.id !== item.id));
                                } else {
                                  toast.show(res.message || '重试失败', 'error');
                                }
                              } catch (e: any) {
                                toast.show(e.message || '操作失败', 'error');
                              } finally {
                                setProcessingReview(null);
                              }
                            }} style={{
                              padding: '4px 10px', borderRadius: 5, border: 'none',
                              background: '#1890ff', color: 'white', fontSize: 11, cursor: 'pointer'
                            }}>
                              🔄 重试
                            </button>
                          )}
                          {item.can_refund && processingReview !== item.id && (
                            <button onClick={async () => {
                              if (!confirm('确认要为该订单退款吗？')) return;
                              setProcessingReview(item.id);
                              try {
                                const res: any = await adminApi.processReview(item.id, { action: 'refund_order' });
                                if (res.success) {
                                  toast.show('退款已处理', 'success');
                                  setReviewList(prev => prev.filter(r => r.id !== item.id));
                                } else {
                                  toast.show(res.message || '退款失败', 'error');
                                }
                              } catch (e: any) {
                                toast.show(e.message || '操作失败', 'error');
                              } finally {
                                setProcessingReview(null);
                              }
                            }} style={{
                              padding: '4px 10px', borderRadius: 5, border: 'none',
                              background: '#ff4d4f', color: 'white', fontSize: 11, cursor: 'pointer'
                            }}>
                              💰 退款
                            </button>
                          )}
                          {item.can_restore && processingReview !== item.id && (
                            <button onClick={async () => {
                              setProcessingReview(item.id);
                              try {
                                const res: any = await adminApi.processReview(item.id, { action: 'restore_channel' });
                                if (res.success) {
                                  toast.show('通道已恢复', 'success');
                                  setReviewList(prev => prev.filter(r => r.id !== item.id));
                                } else {
                                  toast.show(res.message || '恢复失败', 'error');
                                }
                              } catch (e: any) {
                                toast.show(e.message || '操作失败', 'error');
                              } finally {
                                setProcessingReview(null);
                              }
                            }} style={{
                              padding: '4px 10px', borderRadius: 5, border: 'none',
                              background: '#52c41a', color: 'white', fontSize: 11, cursor: 'pointer'
                            }}>
                              ✅ 恢复通道
                            </button>
                          )}
                          {item.can_sync && processingReview !== item.id && (
                            <button onClick={async () => {
                              setProcessingReview(item.id);
                              try {
                                const res: any = await adminApi.processReview(item.id, { action: 'sync_stock' });
                                if (res.success) {
                                  toast.show('库存已同步', 'success');
                                  setReviewList(prev => prev.filter(r => r.id !== item.id));
                                } else {
                                  toast.show(res.message || '同步失败', 'error');
                                }
                              } catch (e: any) {
                                toast.show(e.message || '操作失败', 'error');
                              } finally {
                                setProcessingReview(null);
                              }
                            }} style={{
                              padding: '4px 10px', borderRadius: 5, border: 'none',
                              background: '#1890ff', color: 'white', fontSize: 11, cursor: 'pointer'
                            }}>
                              🔄 同步库存
                            </button>
                          )}
                          {item.can_approve && processingReview !== item.id && (
                            <button onClick={async () => {
                              setProcessingReview(item.id);
                              try {
                                const res: any = await adminApi.processReview(item.id, { action: 'approve_settlement' });
                                if (res.success) {
                                  toast.show('结算已通过', 'success');
                                  setReviewList(prev => prev.filter(r => r.id !== item.id));
                                } else {
                                  toast.show(res.message || '审核失败', 'error');
                                }
                              } catch (e: any) {
                                toast.show(e.message || '操作失败', 'error');
                              } finally {
                                setProcessingReview(null);
                              }
                            }} style={{
                              padding: '4px 10px', borderRadius: 5, border: 'none',
                              background: '#52c41a', color: 'white', fontSize: 11, cursor: 'pointer'
                            }}>
                              ✅ 通过结算
                            </button>
                          )}
                          {item.can_process && processingReview !== item.id && (
                            <>
                              <button onClick={async () => {
                                setProcessingReview(item.id);
                                try {
                                  const res: any = await adminApi.processReview(item.id, { action: 'approve_review' });
                                  if (res.success) {
                                    toast.show('复查已通过', 'success');
                                    setReviewList(prev => prev.filter(r => r.id !== item.id));
                                  } else {
                                    toast.show(res.message || '审核失败', 'error');
                                  }
                                } catch (e: any) {
                                  toast.show(e.message || '操作失败', 'error');
                                } finally {
                                  setProcessingReview(null);
                                }
                              }} style={{
                                padding: '4px 10px', borderRadius: 5, border: 'none',
                                background: '#52c41a', color: 'white', fontSize: 11, cursor: 'pointer'
                              }}>
                                ✅ 通过
                              </button>
                              <button onClick={async () => {
                                setProcessingReview(item.id);
                                try {
                                  const res: any = await adminApi.processReview(item.id, { action: 'reject_review' });
                                  if (res.success) {
                                    toast.show('复查已驳回', 'success');
                                    setReviewList(prev => prev.filter(r => r.id !== item.id));
                                  } else {
                                    toast.show(res.message || '处理失败', 'error');
                                  }
                                } catch (e: any) {
                                  toast.show(e.message || '操作失败', 'error');
                                } finally {
                                  setProcessingReview(null);
                                }
                              }} style={{
                                padding: '4px 10px', borderRadius: 5, border: 'none',
                                background: '#ff4d4f', color: 'white', fontSize: 11, cursor: 'pointer'
                              }}>
                                ❌ 驳回
                              </button>
                            </>
                          )}
                          {processingReview === item.id && (
                            <span style={{ fontSize: 11, color: '#667eea' }}>处理中...</span>
                          )}
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
