import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quotes, recipes, costs } from '../api';

export default function Quotes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [recipeList, setRecipeList] = useState([]);
  const [costList, setCostList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    recipe_id: '',
    cost_calculation_id: '',
    channel: 'default',
    target_margin: 30,
    base_price: '',
    discount: 0,
    red_line_margin: 15,
    valid_from: '',
    valid_to: ''
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadList();
    loadRecipes();
    loadCosts();
    
    if (location.state?.costId && location.state?.recipeId) {
      setForm(f => ({
        ...f,
        recipe_id: location.state.recipeId,
        cost_calculation_id: location.state.costId
      }));
      setShowModal(true);
    }
  }, [location.state]);

  const loadList = async () => {
    try {
      const res = await quotes.getAll();
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecipes = async () => {
    try {
      const res = await recipes.getAll({ status: 'active' });
      setRecipeList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCosts = async () => {
    try {
      const res = await costs.getAll();
      setCostList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (form.cost_calculation_id) {
      const cost = costList.find(c => c.id === parseInt(form.cost_calculation_id));
      if (cost) {
        const unitCost = cost.total_cost;
        const calculatedBasePrice = unitCost / (1 - (form.target_margin / 100));
        const finalBasePrice = form.base_price || calculatedBasePrice;
        const finalPrice = finalBasePrice * (1 - (form.discount / 100));
        const actualMargin = ((finalPrice - unitCost) / finalPrice) * 100;
        
        setPreview({
          unit_cost: unitCost,
          base_price: finalBasePrice,
          final_price: finalPrice,
          actual_margin: actualMargin,
          needs_approval: actualMargin < form.red_line_margin
        });
      }
    }
  }, [form.cost_calculation_id, form.target_margin, form.base_price, form.discount, form.red_line_margin, costList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await quotes.create(form);
      setShowModal(false);
      loadList();
      setForm({
        recipe_id: '',
        cost_calculation_id: '',
        channel: 'default',
        target_margin: 30,
        base_price: '',
        discount: 0,
        red_line_margin: 15,
        valid_from: '',
        valid_to: ''
      });
      setPreview(null);
    } catch (err) {
      alert('创建失败');
    }
  };

  const getApprovalBadge = (status) => {
    const map = {
      approved: <span className="badge badge-success">已审批</span>,
      pending: <span className="badge badge-warning">待审批</span>,
      rejected: <span className="badge badge-danger">已拒绝</span>
    };
    return map[status] || status;
  };

  const filteredCosts = costList.filter(c => !form.recipe_id || c.recipe_id === parseInt(form.recipe_id));

  return (
    <div>
      <div className="page-header">
        <h2>报价管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建报价
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>报价单号</th>
              <th>配方</th>
              <th>渠道</th>
              <th>单位成本</th>
              <th>目标毛利</th>
              <th>实际毛利</th>
              <th>最终价格</th>
              <th>审批状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(q => (
              <tr key={q.id}>
                <td>{q.quote_no}</td>
                <td>{q.recipe_name}</td>
                <td>{q.channel}</td>
                <td>¥{q.unit_cost?.toFixed(2)}</td>
                <td>{q.target_margin}%</td>
                <td>
                  <span className={`badge ${q.actual_margin < q.red_line_margin ? 'badge-danger' : 'badge-success'}`}>
                    {q.actual_margin?.toFixed(1)}%
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>¥{q.final_price?.toFixed(2)}</td>
                <td>{getApprovalBadge(q.approval_status)}</td>
                <td>{q.created_at?.slice(0, 10)}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => navigate(`/quotes/${q.id}`)}>
                    详情
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="10" className="empty-state">暂无报价单</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>新建报价单</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>配方</label>
                  <select required value={form.recipe_id} 
                    onChange={e => setForm({...form, recipe_id: e.target.value, cost_calculation_id: ''})}>
                    <option value="">请选择</option>
                    {recipeList.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>成本计算记录</label>
                  <select required value={form.cost_calculation_id} 
                    onChange={e => setForm({...form, cost_calculation_id: e.target.value})}>
                    <option value="">请选择</option>
                    {filteredCosts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.recipe_name} - ¥{c.total_cost?.toFixed(2)} ({c.calculation_date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>销售渠道</label>
                  <select value={form.channel} 
                    onChange={e => setForm({...form, channel: e.target.value})}>
                    <option value="default">默认渠道</option>
                    <option value="retail">零售渠道</option>
                    <option value="wholesale">批发渠道</option>
                    <option value="online">线上渠道</option>
                    <option value="oem">OEM渠道</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>目标毛利率 (%)</label>
                  <input type="number" step="0.1" value={form.target_margin}
                    onChange={e => setForm({...form, target_margin: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>建议售价 (留空自动计算)</label>
                  <input type="number" step="0.01" value={form.base_price}
                    onChange={e => setForm({...form, base_price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>折扣 (%)</label>
                  <input type="number" step="0.1" value={form.discount}
                    onChange={e => setForm({...form, discount: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-group">
                <label>毛利红线 (%) - 低于此值需要审批</label>
                <input type="number" step="0.1" value={form.red_line_margin}
                  onChange={e => setForm({...form, red_line_margin: parseFloat(e.target.value) || 15})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>有效期起</label>
                  <input type="date" value={form.valid_from}
                    onChange={e => setForm({...form, valid_from: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>有效期止</label>
                  <input type="date" value={form.valid_to}
                    onChange={e => setForm({...form, valid_to: e.target.value})} />
                </div>
              </div>

              {preview && (
                <div className="card" style={{ background: '#f8f9fa', margin: '15px 0', padding: '15px' }}>
                  <h4 style={{ marginBottom: '10px' }}>价格预览</h4>
                  <div className="form-row">
                    <div>
                      <div style={{ color: '#888', fontSize: '12px' }}>单位成本</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>¥{preview.unit_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '12px' }}>建议售价</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>¥{preview.base_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '12px' }}>折后价格</div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: '#e74c3c' }}>¥{preview.final_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '12px' }}>实际毛利率</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>
                        <span className={`badge ${preview.needs_approval ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '16px' }}>
                          {preview.actual_margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {preview.needs_approval && (
                    <div style={{ marginTop: '10px', padding: '8px', background: '#fef5e7', borderRadius: '4px', color: '#d68910' }}>
                      ⚠️ 毛利率低于红线，需要审批后生效
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建报价单</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
