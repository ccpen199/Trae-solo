import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';

export default function Products() {
  const { showToast } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filter, setFilter] = useState({ keyword: '', categoryId: '', status: 'all' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [page, filter]);
  useEffect(() => { loadMetadata(); }, []);

  const loadMetadata = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/categories'),
        api.get('/admin/suppliers')
      ] as any);
      if (catRes.success) setCategories(catRes.data || []);
      if (supRes.success) setSuppliers(supRes.data || []);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 15 };
      if (filter.keyword) params.keyword = filter.keyword;
      if (filter.categoryId) params.categoryId = filter.categoryId;
      const res: any = await api.get('/products', { params });
      if (res.success) {
        setProducts(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch (e: any) { showToast(e.message || '加载失败', 'error'); }
    finally { setLoading(false); }
  };

  const saveProduct = async () => {
    if (!editData.name || !editData.price) return showToast('请填写商品名称和价格', 'error');
    try {
      if (editData.id) {
        const res: any = await api.post(`/products`, { ...editData, id: undefined });
        if (res.success) { showToast('更新成功', 'success'); setShowModal(false); loadData(); }
      } else {
        const res: any = await api.post('/products', editData);
        if (res.success) { showToast('创建成功', 'success'); setShowModal(false); loadData(); }
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="search-bar">
        <input className="form-input" placeholder="搜索商品名称..." value={filter.keyword}
          onChange={e => { setPage(1); setFilter({ ...filter, keyword: e.target.value }); }} style={{ maxWidth: 300 }} />
        <select className="form-select" value={filter.categoryId}
          onChange={e => { setPage(1); setFilter({ ...filter, categoryId: e.target.value }); }}>
          <option value="">全部分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select" value={filter.status}
          onChange={e => { setPage(1); setFilter({ ...filter, status: e.target.value }); }}>
          <option value="all">全部状态</option>
          <option value="1">上架</option>
          <option value="0">下架</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => {
          setEditData({ name: '', categoryId: categories[0]?.id, supplierId: suppliers[0]?.id, skuType: 'recharge', price: 0, costPrice: 0, faceValue: 0, commissionRate: 0.05, stock: 0, isHot: 0, description: '' });
          setShowModal(true);
        }}>+ 新增商品</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>商品名称</th>
              <th>分类</th>
              <th>面值</th>
              <th>售价</th>
              <th>成本价</th>
              <th>库存</th>
              <th>佣金率</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            products.length === 0 ? <tr><td colSpan={10} className="empty"><div className="empty-icon">📦</div>暂无商品</td></tr> :
            products.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.id?.slice(0, 8)}...</td>
                <td>
                  <div style={{ fontWeight: 500 }}>
                    {p.is_hot === 1 && <span className="tag tag-red" style={{ marginRight: 6 }}>HOT</span>}
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.sku_type === 'card' ? '卡密类' : '直充类'}</div>
                </td>
                <td><span className="tag tag-purple">{p.category_name || '-'}</span></td>
                <td>{p.face_value ? `¥${p.face_value}` : '-'}</td>
                <td style={{ color: '#ef4444', fontWeight: 600 }}>¥{p.price}</td>
                <td>¥{p.cost_price}</td>
                <td>
                  {p.stock <= 10 ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>{p.stock}</span> : p.stock}
                  {p.stock <= 10 && p.stock > 0 && '⚠️'}
                  {p.stock === 0 && '❌'}
                </td>
                <td>{(p.commission_rate * 100).toFixed(1)}%</td>
                <td>{p.status === 1 ? <span className="tag tag-green">上架</span> : <span className="tag tag-gray">下架</span>}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-default btn-sm" onClick={() => { setEditData({ ...p, categoryId: p.category_id, supplierId: p.supplier_id, skuType: p.sku_type, faceValue: p.face_value, costPrice: p.cost_price, commissionRate: p.commission_rate, isHot: p.is_hot }); setShowModal(true); }}>编辑</button>
                    <button className="btn btn-warning btn-sm" onClick={() => showToast('库存同步中...', 'success')}>同步库存</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} />

      {showModal && (
        <Modal title={editData?.id ? '编辑商品' : '新增商品'} onClose={() => setShowModal(false)} onOk={saveProduct}>
          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">商品名称 *</label>
              <input className="form-input" value={editData?.name || ''}
                onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">商品分类 *</label>
              <select className="form-select" value={editData?.categoryId || ''}
                onChange={e => setEditData({ ...editData, categoryId: e.target.value })}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">供应商</label>
              <select className="form-select" value={editData?.supplierId || ''}
                onChange={e => setEditData({ ...editData, supplierId: e.target.value })}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">商品类型</label>
              <select className="form-select" value={editData?.skuType || 'recharge'}
                onChange={e => setEditData({ ...editData, skuType: e.target.value })}>
                <option value="recharge">直充类</option>
                <option value="card">卡密类</option>
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">面值</label>
              <input type="number" className="form-input" value={editData?.faceValue || 0}
                onChange={e => setEditData({ ...editData, faceValue: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">售价 *</label>
              <input type="number" step="0.01" className="form-input" value={editData?.price || 0}
                onChange={e => setEditData({ ...editData, price: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">成本价</label>
              <input type="number" step="0.01" className="form-input" value={editData?.costPrice || 0}
                onChange={e => setEditData({ ...editData, costPrice: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">佣金率</label>
              <input type="number" step="0.01" className="form-input" value={editData?.commissionRate || 0}
                onChange={e => setEditData({ ...editData, commissionRate: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">库存</label>
              <input type="number" className="form-input" value={editData?.stock || 0}
                onChange={e => setEditData({ ...editData, stock: Number(e.target.value) })} />
            </div>
            <div className="form-row">
              <label className="form-label">热门推荐</label>
              <select className="form-select" value={editData?.isHot || 0}
                onChange={e => setEditData({ ...editData, isHot: Number(e.target.value) })}>
                <option value={0}>否</option>
                <option value={1}>是</option>
              </select>
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
