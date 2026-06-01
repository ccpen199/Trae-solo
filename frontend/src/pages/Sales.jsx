import React, { useState, useEffect } from 'react';
import { sales, recipes, liquors } from '../api.js';
import Modal from '../components/Modal.jsx';

function Sales() {
  const [salesList, setSalesList] = useState([]);
  const [recipeList, setRecipeList] = useState([]);
  const [liquorList, setLiquorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saleType, setSaleType] = useState('recipe');
  const [formData, setFormData] = useState({
    recipe_id: '', liquor_id: '', quantity: 1,
    is_complimentary: false, complimentary_reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesRes, recipesRes, liquorsRes] = await Promise.all([
        sales.getAll(),
        recipes.getAll({ status: 'approved' }),
        liquors.getAll(),
      ]);
      setSalesList(salesRes.data);
      setRecipeList(recipesRes.data);
      setLiquorList(liquorsRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedItem = saleType === 'recipe'
        ? recipeList.find(r => r.id == formData.recipe_id)
        : liquorList.find(l => l.id == formData.liquor_id);

      if (!selectedItem) {
        alert('请选择商品');
        return;
      }

      await sales.create({
        ...formData,
        sale_type: saleType,
        unit_price: selectedItem.sale_price,
        created_by: 1,
        approver_id: formData.is_complimentary ? 1 : null
      });
      setShowModal(false);
      loadData();
      setFormData({
        recipe_id: '', liquor_id: '', quantity: 1,
        is_complimentary: false, complimentary_reason: ''
      });
    } catch (err) {
      alert('销售失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const getSelectedItem = () => {
    if (saleType === 'recipe' && formData.recipe_id) {
      return recipeList.find(r => r.id == formData.recipe_id);
    }
    if (saleType === 'liquor' && formData.liquor_id) {
      return liquorList.find(l => l.id == formData.liquor_id);
    }
    return null;
  };

  const selectedItem = getSelectedItem();
  const unitPrice = selectedItem?.sale_price || 0;
  const totalAmount = formData.is_complimentary ? 0 : unitPrice * formData.quantity;

  const today = new Date().toISOString().split('T')[0];
  const todaySales = salesList.filter(s => s.created_at?.startsWith(today));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const todayCount = todaySales.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div>
      <div className="page-header">
        <h2>销售出杯</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增销售
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">今日出杯</div>
          <div className="value">{todayCount}</div>
          <div className="change positive">杯</div>
        </div>
        <div className="stat-card">
          <div className="label">今日营收</div>
          <div className="value">¥{todayRevenue.toFixed(2)}</div>
          <div className="change positive">元</div>
        </div>
        <div className="stat-card">
          <div className="label">累计订单</div>
          <div className="value">{salesList.length}</div>
          <div className="change positive">笔</div>
        </div>
        <div className="stat-card">
          <div className="label">客单价</div>
          <div className="value">
            ¥{todayCount > 0 ? (todayRevenue / todayCount).toFixed(2) : '0.00'}
          </div>
          <div className="change positive">元/杯</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>销售记录</h3>
        </div>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>商品</th>
                  <th>类型</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>金额</th>
                  <th>成本</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {salesList.slice(0, 50).map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.created_at).toLocaleString('zh-CN')}</td>
                    <td className="font-bold">{sale.recipe_name || sale.liquor_name}</td>
                    <td>
                      <span className={`badge ${sale.sale_type === 'recipe' ? 'badge-info' : 'badge-success'}`}>
                        {sale.sale_type === 'recipe' ? '调酒' : '整瓶'}
                      </span>
                    </td>
                    <td>×{sale.quantity}</td>
                    <td>¥{sale.unit_price.toFixed(2)}</td>
                    <td className="font-bold" style={{ color: sale.is_complimentary ? 'var(--warning)' : 'var(--success)' }}>
                      {sale.is_complimentary ? '赠饮' : `¥${sale.total_amount.toFixed(2)}`}
                    </td>
                    <td>¥{sale.cost_amount?.toFixed(2) || '0.00'}</td>
                    <td>{sale.complimentary_reason || '-'}</td>
                  </tr>
                ))}
                {salesList.length === 0 && (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <div className="empty-state-icon">💰</div>
                        <div>暂无销售记录</div>
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
        title="新增销售"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSubmit}>确认销售</button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="tabs" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`tab ${saleType === 'recipe' ? 'active' : ''}`}
              onClick={() => { setSaleType('recipe'); setFormData({ ...formData, recipe_id: '', liquor_id: '' }); }}
            >
              调酒销售
            </button>
            <button
              type="button"
              className={`tab ${saleType === 'liquor' ? 'active' : ''}`}
              onClick={() => { setSaleType('liquor'); setFormData({ ...formData, recipe_id: '', liquor_id: '' }); }}
            >
              整瓶销售
            </button>
          </div>

          <div className="form-group">
            <label>选择{saleType === 'recipe' ? '配方' : '酒水'} *</label>
            <select
              className="form-control"
              value={saleType === 'recipe' ? formData.recipe_id : formData.liquor_id}
              onChange={(e) => setFormData({
                ...formData,
                [saleType === 'recipe' ? 'recipe_id' : 'liquor_id']: e.target.value
              })}
              required
            >
              <option value="">请选择</option>
              {saleType === 'recipe' ? (
                recipeList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} - ¥{r.sale_price}
                  </option>
                ))
              ) : (
                liquorList.filter(l => l.total_bottles > 0).map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} (库存: {l.total_bottles}瓶) - ¥{l.sale_price}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label>销售数量</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={formData.is_complimentary}
                onChange={(e) => setFormData({ ...formData, is_complimentary: e.target.checked })}
              />
              赠饮（免单）
            </label>
          </div>

          {formData.is_complimentary && (
            <div className="form-group">
              <label>赠饮原因 *</label>
              <input
                type="text"
                className="form-control"
                placeholder="如: 客户招待、活动赠送等"
                value={formData.complimentary_reason}
                onChange={(e) => setFormData({ ...formData, complimentary_reason: e.target.value })}
                required
              />
            </div>
          )}

          <div style={{
            padding: '16px',
            background: 'var(--primary)',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>单价:</span>
              <span>¥{unitPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>数量:</span>
              <span>×{formData.quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px' }}>
              <span>应收金额:</span>
              <span style={{ color: formData.is_complimentary ? 'var(--warning)' : 'var(--gold)' }}>
                {formData.is_complimentary ? '赠饮 ¥0.00' : `¥${totalAmount.toFixed(2)}`}
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Sales;
