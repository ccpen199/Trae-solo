import React, { useState, useEffect } from 'react';
import { recipes, liquors, common } from '../api.js';
import Modal from '../components/Modal.jsx';

function Recipes() {
  const [recipeList, setRecipeList] = useState([]);
  const [liquorList, setLiquorList] = useState([]);
  const [cupTypes, setCupTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '', cup_type_id: '', sale_price: 0, preparation_steps: '',
    ingredients: [{ liquor_id: '', ingredient_name: '', type: 'base', quantity_ml: 0 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipesRes, liquorsRes, cupTypesRes] = await Promise.all([
        recipes.getAll(),
        liquors.getAll(),
        common.getCupTypes(),
      ]);
      setRecipeList(recipesRes.data);
      setLiquorList(liquorsRes.data);
      setCupTypes(cupTypesRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecipe) {
        await recipes.update(editingRecipe.id, formData);
      } else {
        await recipes.create(formData);
      }
      setShowModal(false);
      loadData();
      resetForm();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleApprove = async (recipe) => {
    if (!confirm(`确定要审核通过配方「${recipe.name}」吗？`)) return;
    try {
      await recipes.approve(recipe.id, { approved_by: 1 });
      loadData();
    } catch (err) {
      alert('审核失败: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', cup_type_id: '', sale_price: 0, preparation_steps: '',
      ingredients: [{ liquor_id: '', ingredient_name: '', type: 'base', quantity_ml: 0 }]
    });
    setEditingRecipe(null);
  };

  const openEdit = async (recipe) => {
    const detail = await recipes.get(recipe.id);
    setEditingRecipe(recipe);
    setFormData({
      name: detail.data.name,
      cup_type_id: detail.data.cup_type_id || '',
      sale_price: detail.data.sale_price,
      preparation_steps: detail.data.preparation_steps || '',
      ingredients: detail.data.ingredients.map(i => ({
        liquor_id: i.liquor_id || '',
        ingredient_name: i.ingredient_name,
        type: i.type,
        quantity_ml: i.quantity_ml
      }))
    });
    setShowModal(true);
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { liquor_id: '', ingredient_name: '', type: 'base', quantity_ml: 0 }]
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    if (field === 'liquor_id' && value) {
      const liquor = liquorList.find(l => l.id == value);
      if (liquor) {
        newIngredients[index].ingredient_name = liquor.name;
      }
    }
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const filteredRecipes = recipeList.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge badge-success">已审核</span>;
      case 'draft': return <span className="badge badge-warning">草稿</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>配方管理</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 新增配方
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>全部</button>
        <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>已审核</button>
        <button className={`tab ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>待审核</button>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>配方名称</th>
                  <th>杯型</th>
                  <th>标准成本</th>
                  <th>售价</th>
                  <th>毛利率</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map((recipe) => (
                  <tr key={recipe.id}>
                    <td className="font-bold">{recipe.name}</td>
                    <td>{recipe.cup_name || '-'}</td>
                    <td>¥{recipe.standard_cost?.toFixed(2) || '0.00'}</td>
                    <td>¥{recipe.sale_price.toFixed(2)}</td>
                    <td>
                      {recipe.sale_price > 0 ? (
                        <span className={((recipe.sale_price - recipe.standard_cost) / recipe.sale_price * 100) > 60 ? 'badge badge-success' : 'badge badge-warning'}>
                          {((recipe.sale_price - recipe.standard_cost) / recipe.sale_price * 100).toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td>{getStatusBadge(recipe.status)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(recipe)}>
                          编辑
                        </button>
                        {recipe.status !== 'approved' && (
                          <button className="btn btn-sm btn-success" onClick={() => handleApprove(recipe)}>
                            审核
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecipes.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div>暂无配方数据</div>
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
        title={editingRecipe ? '编辑配方' : '新增配方'}
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
              <label>配方名称 *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>杯型</label>
              <select
                className="form-control"
                value={formData.cup_type_id}
                onChange={(e) => setFormData({ ...formData, cup_type_id: e.target.value })}
              >
                <option value="">选择杯型</option>
                {cupTypes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.volume_ml}ml)</option>
                ))}
              </select>
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
          </div>

          <div className="form-group">
            <label>配料清单</label>
            {formData.ingredients.map((ing, index) => (
              <div key={index} className="ingredient-row">
                <select
                  className="form-control"
                  value={ing.liquor_id}
                  onChange={(e) => updateIngredient(index, 'liquor_id', e.target.value)}
                >
                  <option value="">选择酒水</option>
                  {liquorList.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-control"
                  placeholder="配料名称"
                  value={ing.ingredient_name}
                  onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="用量ml"
                  value={ing.quantity_ml}
                  onChange={(e) => updateIngredient(index, 'quantity_ml', parseFloat(e.target.value))}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeIngredient(index)}
                  disabled={formData.ingredients.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={addIngredient}
              style={{ marginTop: '10px' }}
            >
              + 添加配料
            </button>
          </div>

          <div className="form-group">
            <label>制作步骤</label>
            <textarea
              className="form-control"
              placeholder="描述制作步骤..."
              value={formData.preparation_steps}
              onChange={(e) => setFormData({ ...formData, preparation_steps: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Recipes;
