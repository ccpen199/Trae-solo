import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { Pagination } from './Products';
import { orderApi } from '../api';

const STATUS_MAP: Record<string, { text: string; cls: string; color: string }> = {
  pending: { text: '待支付', cls: 'tag-gray', color: '#64748b' },
  paid: { text: '待充值', cls: 'tag-blue', color: '#3b82f6' },
  recharging: { text: '充值中', cls: 'tag-blue', color: '#3b82f6' },
  completed: { text: '已成功', cls: 'tag-green', color: '#10b981' },
  failed: { text: '已失败', cls: 'tag-red', color: '#ef4444' },
  refunded: { text: '已退款', cls: 'tag-orange', color: '#f59e0b' }
};

const STATUS_TABS = [
  { key: 'all', label: '全部', icon: '📋', color: '#6366f1' },
  { key: 'pending', label: '待支付', icon: '⏳', color: '#64748b' },
  { key: 'recharging', label: '充值中', icon: '⚡', color: '#3b82f6' },
  { key: 'completed', label: '已成功', icon: '✅', color: '#10b981' },
  { key: 'failed', label: '已失败', icon: '❌', color: '#ef4444' },
  { key: 'refunded', label: '已退款', icon: '💰', color: '#f59e0b' }
];

const TIME_RANGES = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: '7days', label: '近7天' },
  { key: '30days', label: '近30天' },
  { key: 'custom', label: '自定义' }
];

function getOperatorTag(account: string): { text: string; cls: string } | null {
  if (!account) return null;
  const phone = account.replace(/\D/g, '');
  if (phone.length !== 11) return null;
  
  const prefix = phone.slice(0, 3);
  const mobilePrefixes = ['134', '135', '136', '137', '138', '139', '150', '151', '152', '157', '158', '159', '182', '183', '184', '187', '188', '178', '147', '172'];
  const unicomPrefixes = ['130', '131', '132', '155', '156', '185', '186', '176', '145', '175', '166'];
  const telecomPrefixes = ['133', '153', '180', '181', '189', '177', '173', '199', '191', '190'];
  
  if (mobilePrefixes.includes(prefix)) return { text: '移动', cls: 'tag-green' };
  if (unicomPrefixes.includes(prefix)) return { text: '联通', cls: 'tag-red' };
  if (telecomPrefixes.includes(prefix)) return { text: '电信', cls: 'tag-blue' };
  return null;
}

function maskPhone(phone: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return phone;
}

function formatTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
}

function getTimeRange(range: string): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = today.toISOString().split('T')[0];
  
  switch (range) {
    case 'today':
      return { start: end, end };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { start: yStr, end: yStr };
    }
    case '7days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: s.toISOString().split('T')[0], end };
    }
    case '30days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { start: s.toISOString().split('T')[0], end };
    }
    default:
      return { start: '', end: '' };
  }
}

function extractErrorCode(failReason: string): string {
  if (!failReason) return '';
  const match = failReason.match(/[A-Z0-9_-]+/g);
  if (match) {
    for (const m of match) {
      if (m.length >= 4 && m.length <= 15) {
        return m;
      }
    }
  }
  const parts = failReason.split(':');
  return parts[0]?.replace(/[^A-Z0-9]/g, '').toUpperCase().slice(0, 8) || '';
}

export default function Orders() {
  const navigate = useNavigate();
  const { showToast } = useApp();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    keyword: '',
    status: 'all',
    timeRange: '30days',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statsCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: total,
      pending: 0,
      recharging: 0,
      completed: 0,
      failed: 0,
      refunded: 0
    };
    orders.forEach(o => {
      if (o.status === 'pending') counts.pending++;
      else if (o.status === 'recharging' || o.status === 'paid') counts.recharging++;
      else if (o.status === 'completed') counts.completed++;
      else if (o.status === 'failed') counts.failed++;
      else if (o.status === 'refunded') counts.refunded++;
    });
    return counts;
  }, [orders, total]);

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const timeRange = getTimeRange(filter.timeRange);
      const params: any = {
        page,
        pageSize: 20,
        status: filter.status,
        keyword: filter.keyword || undefined,
        startDate: filter.timeRange === 'custom' ? filter.startDate : timeRange.start,
        endDate: filter.timeRange === 'custom' ? filter.endDate : timeRange.end
      };
      
      const res: any = await orderApi.getOrders(params);
      if (res.success) {
        setOrders(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch (e: any) {
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportStatus('正在生成订单导出文件...');
    try {
      showToast('正在生成导出文件...', 'info');
      const timeRange = getTimeRange(filter.timeRange);
      const params = {
        status: filter.status,
        keyword: filter.keyword || undefined,
        startDate: filter.timeRange === 'custom' ? filter.startDate : timeRange.start,
        endDate: filter.timeRange === 'custom' ? filter.endDate : timeRange.end
      };
      await orderApi.exportOrders(params);
      setExportStatus(`导出完成：订单CSV文件已生成 ${new Date().toLocaleTimeString('zh-CN')}`);
      showToast('导出文件已下载', 'success');
    } catch (e: any) {
      setExportStatus(`导出失败：${e.message || '请稍后重试'}`);
      showToast(e.message || '导出失败', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRetry = async (orderId: string) => {
    if (actionLoading) return;
    if (!confirm('确定要重试该订单吗？')) return;
    
    setActionLoading(orderId);
    try {
      const res: any = await orderApi.retryOrder(orderId);
      if (res.success) {
        showToast('重试已启动，正在处理中...', 'success');
        setTimeout(loadData, 2000);
      }
    } catch (e: any) {
      showToast(e.message || '重试失败', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (orderId: string) => {
    if (actionLoading) return;
    if (!confirm('确定要给该订单退款吗？退款将原路返回用户余额。')) return;
    
    setActionLoading(orderId);
    try {
      const res: any = await orderApi.refundOrder(orderId);
      if (res.success) {
        showToast(`退款成功：¥${res.data.refundedAmount.toFixed(2)}`, 'success');
        loadData();
      }
    } catch (e: any) {
      showToast(e.message || '退款失败', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusTabChange = (status: string) => {
    setPage(1);
    setFilter({ ...filter, status });
  };

  const handleTimeRangeChange = (range: string) => {
    setPage(1);
    setFilter({ ...filter, timeRange: range, startDate: '', endDate: '' });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="search-bar" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="form-input"
              placeholder="🔍 搜索订单号/手机号/商品名"
              value={filter.keyword}
              onChange={e => { setPage(1); setFilter({ ...filter, keyword: e.target.value }); }}
              style={{ width: 280 }}
            />
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
              {TIME_RANGES.map(tr => (
                <button
                  key={tr.key}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    background: filter.timeRange === tr.key ? '#6366f1' : '#fff',
                    color: filter.timeRange === tr.key ? '#fff' : '#64748b',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderRight: tr.key !== 'custom' ? '1px solid #e2e8f0' : 'none'
                  }}
                  onClick={() => handleTimeRangeChange(tr.key)}
                >
                  {tr.label}
                </button>
              ))}
            </div>
            {filter.timeRange === 'custom' && (
              <>
                <input
                  type="date"
                  className="form-input"
                  value={filter.startDate}
                  onChange={e => { setPage(1); setFilter({ ...filter, startDate: e.target.value }); }}
                  style={{ width: 130 }}
                />
                <span style={{ color: '#94a3b8' }}>至</span>
                <input
                  type="date"
                  className="form-input"
                  value={filter.endDate}
                  onChange={e => { setPage(1); setFilter({ ...filter, endDate: e.target.value }); }}
                  style={{ width: 130 }}
                />
              </>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <button
            className={`btn ${exporting ? 'btn-default' : 'btn-primary'}`}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '正在生成...' : '导出'}
          </button>
        </div>
        {exportStatus && (
          <div className="card" style={{ marginBottom: 12, padding: '10px 14px', color: exportStatus.startsWith('导出失败') ? '#991b1b' : '#166534', background: exportStatus.startsWith('导出失败') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${exportStatus.startsWith('导出失败') ? '#fecaca' : '#bbf7d0'}` }}>
            {exportStatus}
          </div>
        )}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', margin: 0 }}>
          {STATUS_TABS.map(tab => {
            const count = statsCounts[tab.key] || 0;
            const isActive = filter.status === tab.key;
            return (
              <div
                key={tab.key}
                className="stat-card"
                style={{
                  cursor: 'pointer',
                  border: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  boxShadow: isActive ? `0 0 0 3px ${tab.color}20` : 'none',
                  margin: 0
                }}
                onClick={() => handleStatusTabChange(tab.key)}
              >
                <div className="label">{tab.icon} {tab.label}</div>
                <div className="value" style={{ color: tab.color }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>订单信息</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="empty"><div className="empty-icon">📋</div>暂无订单</td></tr>
            ) : orders.map(o => {
              const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-gray', color: '#64748b' };
              const operator = getOperatorTag(o.recharge_account || o.user_phone || '');
              let errorCode = extractErrorCode(o.fail_reason || '');
              if (!errorCode && o.diagnostic_result) {
                try {
                  const diag = typeof o.diagnostic_result === 'string' ? JSON.parse(o.diagnostic_result) : o.diagnostic_result;
                  errorCode = extractErrorCode(diag.errorCode || diag.rootCause || diag.userMessage || '');
                } catch {}
              }
              if (!errorCode && o.status === 'failed') {
                errorCode = 'UNKNOWN';
              }
              const isLoading = actionLoading === o.id;
              
              return (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      {o.order_no}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.product_name}
                      </span>
                      {operator && <span className={`tag ${operator.cls}`} style={{ fontSize: 10, padding: '1px 6px' }}>{operator.text}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                      {maskPhone(o.recharge_account || o.user_phone || '')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>
                      原价 ¥{Number(o.original_amount || o.final_amount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>
                      实付 ¥{Number(o.final_amount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: '#10b981' }}>
                      返佣 ¥{Number(o.commission_amount || 0).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className={`tag ${s.cls}`}>{s.text}</span>
                    </div>
                    {o.status === 'failed' && errorCode && (
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                        ERR-{errorCode.slice(0, 8)}
                      </div>
                    )}
                    {o.supplier_name && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{o.supplier_name}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      创建：{formatTime(o.created_at)}
                    </div>
                    {(o.finish_time || o.updated_at) && (
                      <div style={{ fontSize: 12, color: s.color }}>
                        {o.status === 'completed' ? '完成' : o.status === 'failed' ? '失败' : o.status === 'refunded' ? '退款' : '更新'}：
                        {formatTime(o.finish_time || o.updated_at)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-default btn-sm"
                        onClick={() => navigate(`/orders/${o.id}`)}
                      >
                        详情
                      </button>
                      {o.status === 'failed' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleRetry(o.id)}
                            disabled={isLoading}
                          >
                            {isLoading && actionLoading === o.id ? '⏳' : '🔄'} 重试
                          </button>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleRefund(o.id)}
                            disabled={isLoading}
                          >
                            {isLoading && actionLoading === o.id ? '⏳' : '💰'} 退款
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} pageSize={20} />
    </div>
  );
}
