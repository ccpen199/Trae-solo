import React, { useState, useEffect } from 'react';
import { ingredientsAPI } from '../api.js';

function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    price_per_unit: '',
    loss_rate: '',
    calories_per_unit: '',
    protein_per_unit: '',
    fat_per_unit: '',
    carbs_per_unit: '',
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      const data = await ingredientsAPI.getAll();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await ingredientsAPI.create({
        ...formData,
        price_per_unit: parseFloat(formData.price_per_unit) || 0,
        loss_rate: parseFloat(formData.loss_rate) || 0,
        calories_per_unit: parseFloat(formData.calories_per_unit) || 0,
        protein_per_unit: parseFloat(formData.protein_per_unit) || 0,
        fat_per_unit: parseFloat(formData.fat_per_unit) || 0,
        carbs_per_unit: parseFloat(formData.carbs_per_unit) || 0,
      });
      setShowModal(false);
      setFormData({
        name: '',
        unit: '',
        price_per_unit: '',
        loss_rate: '',
        calories_per_unit: '',
        protein_per_unit: '',
        fat_per_unit: '',
        carbs_per_unit: '',
      });
      loadIngredients();
    } catch (error) {
      console.error('Failed to create ingredient:', error);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>原料库</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增原料
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>原料名称</th>
              <th>单位</th>
              <th>单价</th>
              <th>损耗率</th>
              <th>热量</th>
              <th>蛋白质</th>
              <th>脂肪</th>
              <th>碳水</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ing => (
              <tr key={ing.id}>
                <td>{ing.name}</td>
                <td>{ing.unit}</td>
                <td>¥{ing.price_per_unit}</td>
                <td>{(ing.loss_rate * 100).toFixed(0)}%</td>
                <td>{ing.calories_per_unit} kcal</td>
                <td>{ing.protein_per_unit}g</td>
                <td>{ing.fat_per_unit}g</td>
                <td>{ing.carbs_per_unit}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增原料</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>原料名称 *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>单位 *</label>
                  <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} placeholder="如: kg, 个, ml" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>单价 (¥) *</label>
                  <input type="number" name="price_per_unit" value={formData.price_per_unit} onChange={handleInputChange} step="0.01" required />
                </div>
                <div className="form-group">
                  <label>损耗率 (%)</label>
                  <input type="number" name="loss_rate" value={formData.loss_rate} onChange={handleInputChange} step="0.01" placeholder="如: 10" />
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '15px' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>营养成分（每单位）</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>热量 (kcal)</label>
                    <input type="number" name="calories_per_unit" value={formData.calories_per_unit} onChange={handleInputChange} step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>蛋白质 (g)</label>
                    <input type="number" name="protein_per_unit" value={formData.protein_per_unit} onChange={handleInputChange} step="0.1" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>脂肪 (g)</label>
                    <input type="number" name="fat_per_unit" value={formData.fat_per_unit} onChange={handleInputChange} step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>碳水化合物 (g)</label>
                    <input type="number" name="carbs_per_unit" value={formData.carbs_per_unit} onChange={handleInputChange} step="0.1" />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ingredients;
