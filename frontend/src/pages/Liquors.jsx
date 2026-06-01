import React, { useState, useEffect } from 'react';
import { liquors, common } from '../api.js';
import Modal from '../components/Modal.jsx';

function Liquors() {
  const [liquorList, setLiquorList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingLiquor, setEditingLiquor] = useState(null);
  const [selectedLiquor, setSelectedLiquor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', brand_id: '', specification: '', bottle_volume_ml: 700,
    cost_price: 0, sale_price: 0, supplier_id: '', batch_number: '',
    unit: '瓶', conversion_factor: 1, min_stock: 0
  });
  const [stockForm, setStockForm] = useState({ quantity: 0, reason: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [liquorsRes, suppliersRes, brandsRes] = await Promise.all([
        liquors.getAll(),
        common.getSuppliers(),
        common.getBrands(),
      ]);
      setLiquorList(liquorsRes.data);
      setSuppliers(suppliersRes.data);
      setBrands(brandsRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLiquor) {
        await liquors.update(editingLiquor.id, formData);
      } else {
        await liquors.create(formData);
      }
      setShowModal(false);
      loadData();
      resetForm();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    if (!selectedLiquor) return;
    try {
      await liquors.adjustStock(selectedLiquor.id, stockForm);
      setShowStockModal(false);
      loadData();
      setStockForm({ quantity: 0, reason: '' });
    } catch (err) {
      alert('调整失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', brand_id: '', specification: '', bottle_volume_ml: 700,
      cost_price: 0, sale_price: 0, supplier_id: '', batch_number: '',
      unit: '瓶', conversion_factor: 1, min_stock: 0
    });
    setEditingLiquor(null);
  };

  const openEdit = (liquor) => {
    setEditingLiquor(liquor);
    setFormData({
      name: liquor.name,
      brand_id: liquor.brand_id || '',
      specification: liquor.specification,
      bottle_volume_ml: liquor.bottle_volume_ml,
      cost_price: liquor.cost_price,
      sale_price: liquor.sale_price,
      supplier_id: liquor.supplier_id || '',
      batch_number: liquor.batch_number || '',
      unit: liquor.unit,
      conversion_factor: liquor.conversion_factor,
      min_stock: liquor.min_stock
    });
    setShowModal(true);
  };

  const openStockAdjust = (liquor) => {
    setSelectedLiquor(liquor);
    setShowStockModal(true);
  };

  const filteredLiquors = liquorList.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>酒水档案</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            className="search-box"
            placeholder="搜索酒水..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + 新增酒水
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>酒水名称</th>
                  <th>规格</th>
                  <th>容量</th>
                  <th>进价</th>
                  <th>售价</th>
                  <th>整瓶库存</th>
                  <th>开瓶余量</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredLiquors.map((liquor) => (
                  <tr key={liquor.id}>
                    <td className="font-bold">{liquor.name}</td>
                    <td>{liquor.specification}</td>
                    <td>{liquor.bottle_volume_ml}ml</td>
                    <td>¥{liquor.cost_price.toFixed(2)}</td>
                    <td>¥{liquor.sale_price.toFixed(2)}</td>
                    <td>{liquor.total_bottles} {liquor.unit}</td>
                    <td>{liquor.opened_bottles.toFixed(0)}ml</td>
                    <td>
                      {liquor.total_bottles <= liquor.min_stock ? (
                        <span className="badge badge-danger">库存不足</span>
                      ) : (
                        <span className="badge badge-success">正常</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(liquor)}>
                          编辑
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={() => openStockAdjust(liquor)}>
                          调库存
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLiquors.length === 0 && (
                  <tr>
                    <td colSpan="9">
                      <div className="empty-state">
                        <div className="empty-state-icon">🍾</div>
                        <div>暂无酒水数据，点击右上角添加</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingLiquor ? '编辑酒水' : '新增酒水'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSubmit}>保存</button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>酒水名称 *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>规格 *</label>
              <input
                type="text"
                className="form-control"
                placeholder="如: 700ml/瓶"
                value={formData.specification}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>单瓶容量(ml) *</label>
              <input
                type="number"
                className="form-control"
                value={formData.bottle_volume_ml}
                onChange={(e) => setFormData({ ...formData, bottle_volume_ml: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>供应商</label>
              <select
                className="form-control"
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="">选择供应商</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>进价(元) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>售价(元) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>批次号</label>
              <input
                type="text"
                className="form-control"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>最低库存预警</label>
              <input
                type="number"
                className="form-control"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title={`调整库存 - ${selectedLiquor?.name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowStockModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleStockAdjust}>确认调整</button>
          </>
        }
      >
        <form onSubmit={handleStockAdjust}>
          <div className="form-group">
            <label>当前库存</label>
            <div style={{ padding: '10px 14px', background: 'var(--primary)', borderRadius: '8px' }}>
              {selectedLiquor?.total_bottles} 瓶 + {selectedLiquor?.opened_bottles?.toFixed(0) || 0}ml 开瓶
            </div>
          </div>
          <div className="form-group">
            <label>调整数量（正数增加，负数减少）</label>
            <input
              type="number"
              className="form-control"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>调整原因 *</label>
            <input
              type="text"
              className="form-control"
              placeholder="如: 入库补货、报损、盘点调整等"
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Liquors;
