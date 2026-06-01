import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { costs, recipes } from '../api';

export default function CostCalculator() {
  const navigate = useNavigate();
  const [recipeList, setRecipeList] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecipes();
    loadHistory();
  }, []);

  const loadRecipes = async () => {
    try {
      const res = await recipes.getAll({ status: 'active' });
      setRecipeList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await costs.getAll();
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculate = async () => {
    if (!selectedRecipe) {
      alert('请选择配方');
      return;
    }
    setLoading(true);
    try {
      const res = await costs.calculate({ recipe_id: selectedRecipe });
      setResult(res.data);
      loadHistory();
    } catch (err) {
      const msg = err.response?.data?.error || '计算失败';
      const missing = err.response?.data?.missing_materials;
      if (missing && missing.length > 0) {
        alert(`${msg}：\n${missing.join('、')}`);
      } else {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = () => {
    if (result) {
      navigate('/quotes', { state: { costId: result.id, recipeId: selectedRecipe } });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>成本计算</h2>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>选择配方计算成本</h3>
        <div className="form-row">
          <div className="form-group">
            <label>配方</label>
            <select value={selectedRecipe} onChange={e => setSelectedRecipe(e.target.value)}>
              <option value="">请选择配方</option>
              {recipeList.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleCalculate}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? '计算中...' : '计算成本'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>计算结果 - {result.recipe_name} (版本 {result.recipe_version})</h3>
            <button className="btn btn-success" onClick={handleCreateQuote}>
              生成报价单
            </button>
          </div>
          
          <div className="cost-breakdown">
            <div className="cost-item">
              <div className="label">原料成本</div>
              <div className="amount">¥{result.breakdown.material_cost}</div>
            </div>
            <div className="cost-item">
              <div className="label">包装成本</div>
              <div className="amount">¥{result.breakdown.packaging_cost}</div>
            </div>
            <div className="cost-item">
              <div className="label">人工成本</div>
              <div className="amount">¥{result.breakdown.labor_cost}</div>
            </div>
            <div className="cost-item">
              <div className="label">损耗成本</div>
              <div className="amount">¥{result.breakdown.loss_cost}</div>
            </div>
            <div className="cost-item">
              <div className="label">税费</div>
              <div className="amount">¥{result.breakdown.tax_cost}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '6px' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>单位总成本</span>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#e74c3c' }}>
              ¥{result.breakdown.total_cost}
            </div>
          </div>

          <h4 style={{ margin: '20px 0 15px' }}>成本明细</h4>
          <table style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th>类型</th>
                <th>项目</th>
                <th>数量</th>
                <th>单位</th>
                <th>单价</th>
                <th>小计</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {result.details.map((d, i) => (
                <tr key={i}>
                  <td>
                    <span className={`badge ${d.item_type === 'material' ? 'badge-success' : d.item_type === 'packaging' ? 'badge-info' : d.item_type === 'labor' ? 'badge-warning' : 'badge-danger'}`}>
                      {d.item_type === 'material' ? '原料' : d.item_type === 'packaging' ? '包装' : d.item_type === 'labor' ? '人工' : d.item_type === 'loss' ? '损耗' : '税费'}
                    </span>
                  </td>
                  <td>{d.item_name}</td>
                  <td>{d.quantity}</td>
                  <td>{d.unit}</td>
                  <td>¥{d.unit_price?.toFixed(2) || '-'}</td>
                  <td>¥{d.total_price?.toFixed(2)}</td>
                  <td>{d.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '15px' }}>历史计算记录</h3>
        <table>
          <thead>
            <tr>
              <th>配方</th>
              <th>版本</th>
              <th>原料成本</th>
              <th>总成本</th>
              <th>计算日期</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td>{h.recipe_name}</td>
                <td>{h.recipe_version}</td>
                <td>¥{h.material_cost?.toFixed(2)}</td>
                <td style={{ fontWeight: 600 }}>¥{h.total_cost?.toFixed(2)}</td>
                <td>{h.calculation_date}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan="5" className="empty-state">暂无历史记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
