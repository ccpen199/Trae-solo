import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';

export default function Products() {
  const { showToast } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [filter, setFilter] = useState({ keyword: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (filter.keyword) params.keyword = filter.keyword;
      const res: any = await api.get('/admin/products', { params });
      if (res.success) {
        setProducts(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch (e: any) { showToast(e.message || '加载失败', 'error'); }
    finally { setLoading(false); }
  };

  const syncStock = async () => {
    try {
      showToast('正在同步库存...', 'info');
      const res: any = await api.post('/admin/stock/sync');
      if (res.success) { showToast('库存同步完成', 'success'); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const SKU_TYPE_MAP: Record<string, { text: string; cls: string }> = {
    card: { text: '卡密类', cls: 'tag-purple' },
    recharge: { text: '直充类', cls: 'tag-blue' }
  };

  return (
    <div>
      <div className="search-bar">
        <input className="form-input" placeholder="搜索商品名称..." value={filter.keyword}
          onChange={e => { setPage(1); setFilter({ ...filter, keyword: e.target.value }); }} style={{ maxWidth: 300 }} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-warning" onClick={syncStock}>🔄 同步库存</button>
        <button className="btn btn-primary" onClick={() => {
          setEditData({ name: '', category_id: '', supplier_id: '', sku_type: 'recharge', face_value: 0, price: 0, cost_price: 0, commission_rate: 0.05, stock: 0, stock_warning: 10, is_hot: 0, description: '', recharge_type: 'phone' });
          setShowModal(true);
        }}>+ 新增商品</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: '商品总数', value: total, icon: '📦', color: '#6366f1' },
          { label: '卡密类商品', value: products.filter(p => p.sku_type === 'card').length, icon: '🎫', color: '#8b5cf6' },
          { label: '直充类商品', value: products.filter(p => p.sku_type === 'recharge').length, icon: '⚡', color: '#3b82f6' },
          { label: '库存预警', value: products.filter(p => p.stock <= (p.stock_warning || 10)).length, icon: '⚠️', color: '#f59e0b' }
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
              <th>ID</th>
              <th>商品名称</th>
              <th>分类</th>
              <th>供应商</th>
              <th>类型</th>
              <th>面值</th>
              <th>售价</th>
              <th>成本价</th>
              <th>库存</th>
              <th>通道数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={11} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            products.length === 0 ? <tr><td colSpan={11} className="empty"><div className="empty-icon">📦</div>暂无商品</td></tr> :
            products.map(p => {
              const skuType = SKU_TYPE_MAP[p.sku_type] || { text: p.sku_type, cls: 'tag-gray' };
              const isLowStock = p.stock <= (p.stock_warning || 10);
              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.id?.slice(0, 8)}...</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {p.is_hot === 1 && <span className="tag tag-red" style={{ marginRight: 6 }}>HOT</span>}
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.recharge_type || '-'}</div>
                  </td>
                  <td><span className="tag tag-purple">{p.category_name || '-'}</span></td>
                  <td>
                    <div style={{ fontSize: 13 }}>{p.supplier_name || '-'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.supplier_code || ''}</div>
                  </td>
                  <td><span className={`tag ${skuType.cls}`}>{skuType.text}</span></td>
                  <td>{p.face_value ? `¥${p.face_value}` : '-'}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>¥{p.price}</td>
                  <td>¥{p.cost_price}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={isLowStock ? 'text-warning text-bold' : ''}>{p.stock}</span>
                      {isLowStock && p.stock > 0 && <span>⚠️</span>}
                      {p.stock === 0 && <span>❌</span>}
                    </div>
                    {p.stock_warning !== undefined && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>预警线: {p.stock_warning}</div>
                    )}
                  </td>
                  <td>
                    <span className="tag tag-cyan">{p.channelCount || 0} 通道</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-default btn-sm" onClick={() => { setEditData({ ...p }); setShowModal(true); }}>编辑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} pageSize={20} />

      {showModal && (
        <Modal title={editData?.id ? '编辑商品' : '新增商品'} onClose={() => setShowModal(false)} onOk={() => showToast('保存成功', 'success')}>
          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">商品名称 *</label>
              <input className="form-input" value={editData?.name || ''}
                onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">商品分类</label>
              <input className="form-input" value={editData?.category_name || ''}
                onChange={e => setEditData({ ...editData, category_name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">供应商</label>
              <input className="form-input" value={editData?.supplier_name || ''}
                onChange={e => setEditData({ ...editData, supplier_name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">商品类型</label>
              <select className="form-select" value={editData?.sku_type || 'recharge'}
                onChange={e => setEditData({ ...editData, sku_type: e.target.value })}>
                <option value="recharge">直充类</option>
                <option value="card">卡密类</option>
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">面值</label>
              <input type="number" className="form-input" value={editData?.face_value || 0}
                onChange={e => setEditData({ ...editData, face_value: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">售价 *</label>
              <input type="number" step="0.01" className="form-input" value={editData?.price || 0}
                onChange={e => setEditData({ ...editData, price: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">成本价</label>
              <input type="number" step="0.01" className="form-input" value={editData?.cost_price || 0}
                onChange={e => setEditData({ ...editData, cost_price: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">佣金率</label>
              <input type="number" step="0.01" className="form-input" value={editData?.commission_rate || 0}
                onChange={e => setEditData({ ...editData, commission_rate: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">库存</label>
              <input type="number" className="form-input" value={editData?.stock || 0}
                onChange={e => setEditData({ ...editData, stock: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">库存预警线</label>
              <input type="number" className="form-input" value={editData?.stock_warning || 10}
                onChange={e => setEditData({ ...editData, stock_warning: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">热门推荐</label>
              <select className="form-select" value={editData?.is_hot || 0}
                onChange={e => setEditData({ ...editData, is_hot: Number(e.target.value) })}>
                <option value={0}>否</option>
                <option value={1}>是</option>
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">充值类型</label>
              <input className="form-input" value={editData?.recharge_type || ''}
                onChange={e => setEditData({ ...editData, recharge_type: e.target.value })} placeholder="phone / game 等" />
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">商品描述</label>
            <textarea className="form-input" rows={3} value={editData?.description || ''}
              onChange={e => setEditData({ ...editData, description: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Pagination({ page, total, onChange, pageSize = 15 }: any) {
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

export function Modal({ title, children, onClose, onOk, okText = '确定', cancelText = '取消', width }: any) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" style={width ? { maxWidth: width } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-default" onClick={onClose}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
}
