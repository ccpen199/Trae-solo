import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';
import { Modal, Pagination } from './Products';

export default function CardPool() {
  const { showToast } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    supplierId: '', batchNo: '',
    cardsText: '卡号1,密码1\n卡号2,密码2'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadMetadata(); }, []);
  useEffect(() => { if (selectedProduct) loadCards(); }, [selectedProduct, statusFilter, page]);

  const loadMetadata = async () => {
    try {
      const [prodRes, supRes] = await Promise.all([
        api.get('/products', { params: { pageSize: 200 } }),
        api.get('/admin/suppliers')
      ] as any);
      if (prodRes.success) setProducts(prodRes.data.list || []);
      if (supRes.success) setSuppliers(supRes.data || []);
    } catch {}
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/card-pool/inventory', {
        params: { productId: selectedProduct, status: statusFilter || undefined, page, pageSize: 20 }
      });
      if (res.success) { setCards(res.data.list || []); setInventory(res.data.inventory || null); }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doAdd = async () => {
    if (!selectedProduct || !addForm.supplierId || !addForm.cardsText) return showToast('请填写完整', 'error');
    const lines = addForm.cardsText.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
    const cards = lines.map(l => {
      const parts = l.split(/[,，\t|]/);
      return { cardNumber: parts[0]?.trim(), cardPassword: parts[1]?.trim() };
    }).filter(c => c.cardNumber && c.cardPassword);

    if (cards.length === 0) return showToast('请按格式填写卡密数据', 'error');

    try {
      const res: any = await api.post('/admin/card-pool/add', {
        productId: selectedProduct,
        supplierId: addForm.supplierId,
        batchNo: addForm.batchNo || undefined,
        cards
      });
      if (res.success) {
        showToast(`成功导入 ${res.data.success} 张，失败 ${res.data.failed} 张`, 'success');
        setShowAddModal(false); loadCards(); setAddForm({ supplierId: '', batchNo: '', cardsText: '卡号1,密码1\n卡号2,密码2' });
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const expireCards = async () => {
    if (!confirm('确定清理所有过期卡密？')) return;
    try {
      const res: any = await api.post('/admin/cards/expire');
      if (res.success) { showToast(`已处理 ${res.data.expiredCount} 张过期卡密`, 'success'); loadCards(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const STATUS_TAG: Record<string, { text: string; cls: string }> = {
    available: { text: '可用', cls: 'tag-green' },
    used: { text: '已使用', cls: 'tag-blue' },
    expired: { text: '已过期', cls: 'tag-red' }
  };

  return (
    <div>
      <div className="search-bar">
        <select className="form-select" value={selectedProduct} onChange={e => { setPage(1); setSelectedProduct(e.target.value); }}
          style={{ maxWidth: 320 }}>
          <option value="">请选择商品（卡密类）</option>
          {products.filter(p => p.sku_type === 'card').map(p => (
            <option key={p.id} value={p.id}>{p.name} (库存: {p.stock})</option>
          ))}
        </select>
        <select className="form-select" value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">全部状态</option>
          <option value="available">可用</option>
          <option value="used">已使用</option>
          <option value="expired">已过期</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-danger" onClick={expireCards}>🗑️ 清理过期</button>
        <button className="btn btn-primary" onClick={() => {
          const product = products.find(p => p.id === selectedProduct);
          setAddForm({ ...addForm, supplierId: product?.supplier_id || suppliers[0]?.id || '' });
          setShowAddModal(true);
        }} disabled={!selectedProduct}>➕ 导入卡密</button>
      </div>

      {selectedProduct && inventory && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: '卡密总数', value: inventory.total || 0, icon: '🎫', color: '#6366f1' },
            { label: '可用数量', value: inventory.available || 0, icon: '✅', color: '#10b981' },
            { label: '已使用', value: (inventory.total || 0) - (inventory.available || 0), icon: '📦', color: '#3b82f6' },
            { label: '可用率', value: `${inventory.total ? Math.round(inventory.available / inventory.total * 100) : 0}%`, icon: '📊', color: '#f59e0b' }
          ].map((c, i) => (
            <div key={i} className="stat-card">
              <div className="label">{c.label}</div>
              <div className="value">{c.value}</div>
              <div className="icon" style={{ color: c.color }}>{c.icon}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>批次号</th>
              <th>供应商</th>
              <th>卡号前缀</th>
              <th>密码前缀</th>
              <th>状态</th>
              <th>关联订单</th>
              <th>过期时间</th>
              <th>创建时间</th>
              <th>使用时间</th>
            </tr>
          </thead>
          <tbody>
            {!selectedProduct ? <tr><td colSpan={9} className="empty"><div className="empty-icon">🎫</div>请先选择卡密类商品</td></tr> :
            loading ? <tr><td colSpan={9} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            cards.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">📭</div>暂无卡密</td></tr> :
            cards.map(c => {
              const st = STATUS_TAG[c.status] || { text: c.status, cls: 'tag-gray' };
              return (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.batch_no}</td>
                  <td>{suppliers.find(s => s.id === c.supplier_id)?.name || '-'}</td>
                  <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 500 }}>{c.card_number}***</td>
                  <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 500 }}>{c.card_password?.slice(0, 4)}***</td>
                  <td><span className={`tag ${st.cls}`}>{st.text}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.order_id ? c.order_id.slice(0, 8) + '...' : '-'}</td>
                  <td style={{ fontSize: 12 }}>
                    {c.expire_time ? new Date(c.expire_time * 1000).toLocaleDateString() : '长期有效'}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date((c.created_at || 0) * 1000).toLocaleDateString()}</td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{c.used_at ? new Date(c.used_at * 1000).toLocaleDateString() : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedProduct && <Pagination page={page} total={inventory?.total || cards.length} onChange={setPage} pageSize={20} />}

      {showAddModal && (
        <Modal title={`导入卡密 - ${products.find(p => p.id === selectedProduct)?.name}`} width="640px" onClose={() => setShowAddModal(false)} onOk={doAdd}>
          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">供应商 *</label>
              <select className="form-select" value={addForm.supplierId} onChange={e => setAddForm({ ...addForm, supplierId: e.target.value })}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">批次号（选填）</label>
              <input className="form-input" placeholder="留空自动生成" value={addForm.batchNo}
                onChange={e => setAddForm({ ...addForm, batchNo: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">
              卡密数据 *（格式：每行一张卡，卡号和密码用 逗号/Tab/竖线 分隔）
            </label>
            <textarea className="form-input" rows={10} value={addForm.cardsText}
              onChange={e => setAddForm({ ...addForm, cardsText: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }} />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              💡 AES-256加密存储，动态解密；示例格式：
              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, margin: '0 4px' }}>MTK1234567,ABCD1234</code>
              （当前 {addForm.cardsText.split(/[\n\r]+/).filter(l => l.trim()).length} 行）
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
