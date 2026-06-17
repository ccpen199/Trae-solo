import { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { useApp } from '../App';

interface ChannelStatus {
  total: number;
  active: number;
  inactive: number;
  successRate: number;
}

interface SupplierInfo {
  name: string;
  code: string;
  success_rate: number;
  channel_count: number;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
  status: number;
  channel_count: number;
  active_channel_count: number;
  success_rate: number;
  price: number;
  stock: number;
  is_main: boolean;
  available_regions?: string[];
}

interface SyncHistory {
  before: number;
  after: number;
  variance: number;
  time: number;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  sku_type: string;
  face_value: number;
  price: number;
  cost_price: number;
  commission_rate: number;
  stock: number;
  stock_warning: number;
  image?: string;
  description?: string;
  status: number;
  sort: number;
  is_hot: number;
  recharge_type?: string;
  region_limit?: string;
  created_at: number;
  updated_at: number;
  channels: any[];
  channelCount: number;
  activeChannelCount: number;
  hasFallback: boolean;
  lastSync: number;
  sync_batch: string;
  region_limited: number;
  available_regions: string[];
  channelStatus: ChannelStatus;
  supplier_info: SupplierInfo;
  suppliers: Supplier[];
  supplier_count: number;
  stock_sync_history: SyncHistory[];
}

interface SyncFeedback {
  productId: string;
  type: 'success' | 'error';
  message: string;
  timestamp: number;
}

interface BatchSyncState {
  isRunning: boolean;
  current: number;
  total: number;
  successCount: number;
  failCount: number;
  failedProducts: Product[];
  startTime: number;
}

const PROVINCE_MAP: Record<string, string> = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江', '31': '上海', '32': '江苏',
  '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西',
  '46': '海南', '50': '重庆', '51': '四川', '52': '贵州', '53': '云南',
  '54': '西藏', '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏',
  '65': '新疆', '全国': '全国'
};

function formatTime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatRegion(code: string): string {
  if (code === '全国') return '全国';
  return PROVINCE_MAP[code] || code;
}

function getStockStatus(stock: number, warning: number): { text: string; color: string; icon: string } {
  if (stock === 0) return { text: '缺货', color: '#ef4444', icon: '🔴' };
  if (stock <= warning) return { text: '紧张', color: '#f59e0b', icon: '🟡' };
  return { text: '充足', color: '#22c55e', icon: '🟢' };
}

function getChannelStatus(active: number, total: number): { text: string; cls: string } {
  if (total === 0) return { text: '故障(0/0)', cls: 'tag-red' };
  const ratio = active / total;
  if (ratio === 1) return { text: `正常(${active}/${total})`, cls: 'tag-green' };
  if (ratio >= 0.5) return { text: `降级(${active}/${total})`, cls: 'tag-yellow' };
  return { text: `故障(${active}/${total})`, cls: 'tag-red' };
}

export default function Products() {
  const { showToast } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState({ keyword: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [syncFeedbacks, setSyncFeedbacks] = useState<SyncFeedback[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBatchSyncProgress, setShowBatchSyncProgress] = useState(false);
  const [batchSyncState, setBatchSyncState] = useState<BatchSyncState>({
    isRunning: false, current: 0, total: 0, successCount: 0, failCount: 0,
    failedProducts: [], startTime: 0
  });
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [regionProduct, setRegionProduct] = useState<Product | null>(null);

  useEffect(() => { loadData(); }, [page, filter.keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (filter.keyword) params.keyword = filter.keyword;

      let res: any;
      try {
        res = await api.get('/admin/products', { params });
      } catch {
        res = await api.get('/products', { params });
      }

      if (res.success) {
        setProducts(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch (e: any) {
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncSingleStock = async (product: Product) => {
    if (syncingIds.has(product.id)) return;

    setSyncingIds(prev => new Set(prev).add(product.id));

    try {
      const res: any = await api.post(`/products/${product.id}/sync-stock`);
      if (res.success) {
        const updated = res.data as Product;
        const before = res.data.syncResult?.before ?? product.stock;
        const after = res.data.syncResult?.after ?? updated.stock;
        const variance = res.data.syncResult?.variance ?? (after - before);

        setProducts(prev => prev.map(p => p.id === product.id ? updated : p));

        const delta = variance >= 0 ? `Δ+${variance}` : `Δ${variance}`;
        const message = `库存 ${before} → ${after}  ${delta}`;
        const feedback: SyncFeedback = {
          productId: product.id,
          type: 'success',
          message: `同步成功：${message}`,
          timestamp: Date.now()
        };
        setSyncFeedbacks(prev => [...prev, feedback]);
        showToast(`同步成功：${message}`, 'success');

        setTimeout(() => {
          setSyncFeedbacks(prev => prev.filter(f => f.productId !== product.id));
        }, 5000);
      }
    } catch (e: any) {
      const errorMsg = e.message || '供应商接口超时';
      const feedback: SyncFeedback = {
        productId: product.id,
        type: 'error',
        message: `同步失败：${errorMsg}`,
        timestamp: Date.now()
      };
      setSyncFeedbacks(prev => [...prev, feedback]);
      showToast(`同步失败：${errorMsg}`, 'error');

      setTimeout(() => {
        setSyncFeedbacks(prev => prev.filter(f => f.productId !== product.id));
      }, 5000);
    } finally {
      setSyncingIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const batchSyncAll = async () => {
    if (batchSyncState.isRunning) return;

    setShowBatchSyncProgress(true);
    const startTime = Date.now();
    
    let allProducts: Product[] = [];
    try {
      const res: any = await api.get('/admin/products', { params: { page: 1, pageSize: 1000 } });
      if (res.success) {
        allProducts = res.data.list || [];
      }
    } catch {
      try {
        const res: any = await api.get('/products', { params: { page: 1, pageSize: 1000 } });
        if (res.success) {
          allProducts = res.data.list || [];
        }
      } catch {
        allProducts = products;
      }
    }

    const totalCount = allProducts.length;
    setBatchSyncState({
      isRunning: true, current: 0, total: totalCount, successCount: 0,
      failCount: 0, failedProducts: [], startTime
    });

    let successCount = 0;
    let failCount = 0;
    const failedProducts: Product[] = [];

    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      try {
        const res: any = await api.post(`/products/${product.id}/sync-stock`);
        if (res.success) {
          setProducts(prev => prev.map(p => p.id === product.id ? res.data : p));
          successCount++;
        } else {
          failCount++;
          failedProducts.push(product);
        }
      } catch {
        failCount++;
        failedProducts.push(product);
      }

      setBatchSyncState(prev => ({
        ...prev, current: i + 1, successCount, failCount, failedProducts
      }));

      await new Promise(r => setTimeout(r, 100));
    }

    showToast(`批量同步完成：成功 ${successCount} 个，失败 ${failCount} 个`, successCount > failCount ? 'success' : 'error');
    setBatchSyncState(prev => ({ ...prev, isRunning: false }));
  };

  const exportCSV = () => {
    const headers = ['ID', '商品名称', '分类', '主供应商', '库存', '售价', '成本价', '总通道数', '可用通道数', '可售范围', '状态'];
    const rows = products.map(p => [
      p.id,
      p.name,
      p.category_name || '-',
      p.supplier_name || '-',
      p.stock,
      `¥${p.price}`,
      `¥${p.cost_price}`,
      p.channelCount,
      p.activeChannelCount,
      p.region_limited ? '部分地区' : '全国',
      p.status === 1 ? '上架' : '下架'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `商品列表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('导出成功', 'success');
  };

  const toggleHistory = (id: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSupplierModal = (product: Product) => {
    setSelectedProduct(product);
    setShowSupplierModal(true);
  };

  const openRegionModal = (product: Product) => {
    setRegionProduct(product);
    setShowRegionModal(true);
  };

  const setMainSupplier = (supplierId: string) => {
    if (!selectedProduct) return;
    showToast('已设为主供应商', 'success');
    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          supplier_id: supplierId,
          suppliers: p.suppliers.map(s => ({ ...s, is_main: s.id === supplierId }))
        };
      }
      return p;
    }));
    setShowSupplierModal(false);
  };

  const SKU_TYPE_MAP: Record<string, { text: string; cls: string }> = {
    card: { text: '卡密类', cls: 'tag-purple' },
    recharge: { text: '直充类', cls: 'tag-blue' }
  };

  const lowStockCount = useMemo(() =>
    products.filter(p => p.stock <= (p.stock_warning || 10)).length,
    [products]
  );

  const feedback = (id: string) => syncFeedbacks.find(f => f.productId === id);

  return (
    <div>
      <div className="search-bar">
        <input className="form-input" placeholder="搜索商品名称..." value={filter.keyword}
          onChange={e => { setPage(1); setFilter({ ...filter, keyword: e.target.value }); }} style={{ maxWidth: 300 }} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-default" onClick={exportCSV}>📤 导出商品列表</button>
        <button
          className={`btn ${batchSyncState.isRunning ? 'btn-default' : 'btn-warning'}`}
          onClick={batchSyncAll}
          disabled={batchSyncState.isRunning}
        >
          {batchSyncState.isRunning ? '⏳ 同步中...' : '🔄 同步全部库存'}
        </button>
        <button className="btn btn-primary" onClick={() => {
          setShowSupplierModal(true);
        }}>+ 新增商品</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: '商品总数', value: total, icon: '📦', color: '#6366f1' },
          { label: '卡密类商品', value: products.filter(p => p.sku_type === 'card').length, icon: '🎫', color: '#8b5cf6' },
          { label: '直充类商品', value: products.filter(p => p.sku_type === 'recharge').length, icon: '⚡', color: '#3b82f6' },
          { label: '库存预警', value: lowStockCount, icon: '⚠️', color: '#f59e0b' }
        ].map((c, i) => (
          <div key={i} className="stat-card">
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="icon" style={{ color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th style={{ width: 260 }}>商品信息</th>
              <th style={{ width: 150 }}>供应商</th>
              <th style={{ width: 160 }}>实时库存</th>
              <th style={{ width: 120 }}>通道状态</th>
              <th style={{ width: 120 }}>备用通道</th>
              <th style={{ width: 180 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            products.length === 0 ? <tr><td colSpan={6} className="empty"><div className="empty-icon">📦</div>暂无商品</td></tr> :
            products.map(p => {
              const skuType = SKU_TYPE_MAP[p.sku_type] || { text: p.sku_type, cls: 'tag-gray' };
              const stockStatus = getStockStatus(p.stock, p.stock_warning || 10);
              const channelStatus = getChannelStatus(p.activeChannelCount, p.channelCount);
              const isSyncing = syncingIds.has(p.id);
              const fb = feedback(p.id);
              const historyExpanded = expandedHistory.has(p.id);

              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 8,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0
                      }}>
                        {p.sku_type === 'card' ? '🎫' : '⚡'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {p.is_hot === 1 && <span className="tag tag-red" style={{ fontSize: 10 }}>HOT</span>}
                          <span>{p.name}</span>
                          <span className={`tag ${skuType.cls}`} style={{ fontSize: 10 }}>{skuType.text}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="tag tag-purple" style={{ fontSize: 10 }}>{p.category_name || '-'}</span>
                          <span style={{ cursor: 'pointer', color: p.region_limited ? '#f59e0b' : '#22c55e' }}
                            onClick={() => openRegionModal(p)} title="点击查看详情">
                            {p.region_limited ? '📍 部分地区' : '🌍 全国'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.supplier_name || '-'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                      {p.supplier_code || ''}
                    </div>
                    {p.supplier_count > 1 && (
                      <button
                        className="btn btn-link"
                        style={{ fontSize: 11, padding: 0, marginTop: 4, height: 'auto' }}
                        onClick={() => openSupplierModal(p)}
                      >
                        🏪 {p.supplier_count}家供应商
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{p.stock}</span>
                        <span style={{ fontSize: 12, color: stockStatus.color }}>
                          {stockStatus.icon} {stockStatus.text}
                        </span>
                      </div>
                      {fb && (
                        <div style={{
                          fontSize: 11,
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: fb.type === 'success' ? '#dcfce7' : '#fee2e2',
                          color: fb.type === 'success' ? '#166534' : '#991b1b'
                        }}>
                          {fb.message}
                        </div>
                      )}
                      {!fb && p.lastSync && (
                        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>批次: {p.sync_batch || '-'}</span>
                        </div>
                      )}
                      {p.stock_sync_history && p.stock_sync_history.length > 0 && (
                        <button
                          className="btn btn-link"
                          style={{ fontSize: 11, padding: 0, height: 'auto', alignSelf: 'flex-start' }}
                          onClick={() => toggleHistory(p.id)}
                        >
                          {historyExpanded ? '收起' : `最近${p.stock_sync_history.length}次同步`}
                        </button>
                      )}
                      {historyExpanded && p.stock_sync_history && (
                        <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                          {p.stock_sync_history.map((h, i) => (
                            <div key={i} style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span>{formatTime(h.time)}</span>
                              <span>
                                {h.before} → {h.after}
                                <span style={{ color: h.variance >= 0 ? '#22c55e' : '#ef4444', marginLeft: 4 }}>
                                  {h.variance >= 0 ? `+${h.variance}` : h.variance}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${channelStatus.cls}`}>{channelStatus.text}</span>
                    {p.channelStatus && p.channelStatus.successRate > 0 && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        成功率 {Math.round(p.channelStatus.successRate * 100)}%
                      </div>
                    )}
                  </td>
                  <td>
                    {p.hasFallback ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e' }}>
                          🛡️ 有
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {p.channelCount - p.activeChannelCount} 个备用
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8' }}>
                        🛡️ 无
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className={`btn btn-sm ${isSyncing ? 'btn-default' : 'btn-outline'}`}
                        onClick={() => syncSingleStock(p)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                        ) : '🔄 同步库存'}
                      </button>
                      <button className="btn btn-default btn-sm">详情</button>
                      <button className="btn btn-primary btn-sm">编辑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} pageSize={20} />

      {showBatchSyncProgress && (
        <Modal
          title="批量同步库存"
          onClose={() => !batchSyncState.isRunning && setShowBatchSyncProgress(false)}
          width={500}
          hideFooter={batchSyncState.isRunning}
          onOk={() => setShowBatchSyncProgress(false)}
          okText="关闭"
        >
          <div style={{ padding: 20 }}>
            {batchSyncState.isRunning ? (
              <>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <span>正在同步库存...</span>
                  <span style={{ fontWeight: 600 }}>
                    {batchSyncState.current} / {batchSyncState.total}
                  </span>
                </div>
                <div style={{
                  width: '100%', height: 8, background: '#e2e8f0',
                  borderRadius: 4, overflow: 'hidden', marginBottom: 12
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(batchSyncState.current / batchSyncState.total) * 100}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 16 }}>
                  <span style={{ color: '#22c55e' }}>成功: {batchSyncState.successCount}</span>
                  <span style={{ color: '#ef4444' }}>失败: {batchSyncState.failCount}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>同步完成</div>
                  <div style={{ color: '#64748b', marginBottom: 16 }}>
                    成功 {batchSyncState.successCount} 个，失败 {batchSyncState.failCount} 个，
                    耗时 {((Date.now() - batchSyncState.startTime) / 1000).toFixed(1)} 秒
                  </div>
                </div>
                {batchSyncState.failedProducts.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#ef4444' }}>
                      失败的商品（可单独重试）：
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {batchSyncState.failedProducts.map(p => (
                        <div key={p.id} style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '8px 12px',
                          background: '#fef2f2', borderRadius: 6, marginBottom: 6
                        }}>
                          <span style={{ fontSize: 13 }}>{p.name}</span>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => syncSingleStock(p)}
                          >
                            重试
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {showSupplierModal && selectedProduct && (
        <Modal
          title={`供应商对比 - ${selectedProduct.name}`}
          onClose={() => setShowSupplierModal(false)}
          onOk={() => setShowSupplierModal(false)}
          width={700}
          okText="关闭"
        >
          <div style={{ padding: 10 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>供应商</th>
                  <th>当前价格</th>
                  <th>库存</th>
                  <th>成功率</th>
                  <th>主通道</th>
                  <th>备用通道</th>
                  <th>可售范围</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {selectedProduct.suppliers.map((s, i) => (
                  <tr key={s.id} style={{ background: s.is_main ? '#f0f9ff' : undefined }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: `hsl(${i * 60}, 70%, 60%)`,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: 'white',
                          fontSize: 14, fontWeight: 600
                        }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {s.name}
                            {s.is_main && <span className="tag tag-green" style={{ fontSize: 10 }}>主供</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                            {s.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>¥{s.price}</td>
                    <td>{s.stock}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 60, height: 6, background: '#e2e8f0',
                          borderRadius: 3, overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${s.success_rate * 100}%`,
                            background: s.success_rate >= 0.9 ? '#22c55e' : s.success_rate >= 0.7 ? '#f59e0b' : '#ef4444'
                          }} />
                        </div>
                        <span style={{ fontSize: 11 }}>{Math.round(s.success_rate * 100)}%</span>
                      </div>
                    </td>
                    <td>{s.active_channel_count}</td>
                    <td>{s.channel_count - s.active_channel_count}</td>
                    <td>
                      {selectedProduct.region_limited ? (
                        <span style={{ color: '#f59e0b', fontSize: 12 }}>📍 部分地区</span>
                      ) : (
                        <span style={{ color: '#22c55e', fontSize: 12 }}>🌍 全国</span>
                      )}
                    </td>
                    <td>
                      {!s.is_main && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setMainSupplier(s.id)}
                        >
                          设为主供
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showRegionModal && regionProduct && (
        <Modal
          title={`可售范围 - ${regionProduct.name}`}
          onClose={() => setShowRegionModal(false)}
          onOk={() => setShowRegionModal(false)}
          width={500}
          okText="关闭"
        >
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12,
                background: regionProduct.region_limited ? '#fef3c7' : '#dcfce7',
                color: regionProduct.region_limited ? '#92400e' : '#166534'
              }}>
                {regionProduct.region_limited ? '📍 部分地区可售' : '🌍 全国可售'}
              </span>
            </div>
            {regionProduct.region_limited && (
              <>
                <div style={{ fontWeight: 500, marginBottom: 12 }}>可售省份：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {regionProduct.available_regions.map((r, i) => (
                    <span key={i} className="tag tag-green" style={{ fontSize: 12 }}>
                      {formatRegion(r)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function Pagination({ page, total, onChange, pageSize = 15 }: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  pageSize?: number;
}) {
  const totalPages = Math.ceil(total / pageSize);
  const pages: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div className="pagination">
      <span className="text-sm text-muted" style={{ marginRight: 12 }}>共 {total} 条</span>
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>上一页</button>
      {pages.map(p => <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>)}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>下一页</button>
    </div>
  );
}

export function Modal({ title, children, onClose, onOk, okText = '确定', cancelText = '取消', width, hideFooter, okType = 'primary' }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onOk?: () => void;
  okText?: string;
  cancelText?: string;
  width?: number | string;
  hideFooter?: boolean;
  okType?: 'primary' | 'danger' | string;
}) {
  const okClassName = okType === 'danger' ? 'btn btn-danger' : 'btn btn-primary';

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" style={width ? { maxWidth: width } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {!hideFooter && (
          <div className="modal-footer">
            <button className="btn btn-default" onClick={onClose}>{cancelText}</button>
            {onOk && <button className={okClassName} onClick={onOk}>{okText}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
