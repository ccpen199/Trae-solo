import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dishesAPI } from '../api.js';

function Dishes() {
  const [dishes, setDishes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_audience: '',
    flavor_direction: '',
    price_range_min: '',
    price_range_max: '',
    rnd_owner: '',
    expected_margin: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDishes();
  }, []);

  async function loadDishes() {
    try {
      const data = await dishesAPI.getAll();
      setDishes(data);
    } catch (error) {
      console.error('Failed to load dishes:', error);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await dishesAPI.create({
        ...formData,
        price_range_min: parseFloat(formData.price_range_min) || 0,
        price_range_max: parseFloat(formData.price_range_max) || 0,
        expected_margin: parseFloat(formData.expected_margin) || 0,
      });
      setShowModal(false);
      setFormData({
        name: '',
        target_audience: '',
        flavor_direction: '',
        price_range_min: '',
        price_range_max: '',
        rnd_owner: '',
        expected_margin: '',
      });
      loadDishes();
    } catch (error) {
      console.error('Create dish error:', error);
      const errorMsg = error?.error || error?.message || JSON.stringify(error) || '创建失败';
      setError(errorMsg);
    }
  }

  async function handleDelete(id) {
    if (confirm('确定要删除这个菜品吗？')) {
      try {
        await dishesAPI.delete(id);
        loadDishes();
      } catch (error) {
        console.error('Failed to delete dish:', error);
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>菜品立项</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增菜品
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>菜品名称</th>
              <th>目标客群</th>
              <th>口味方向</th>
              <th>售价区间</th>
              <th>研发负责人</th>
              <th>预期毛利</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map(dish => (
              <tr key={dish.id}>
                <td>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); navigate(`/dishes/${dish.id}`); }}
                    style={{ color: '#3498db', textDecoration: 'none' }}
                  >
                    {dish.name}
                  </a>
                </td>
                <td>{dish.target_audience || '-'}</td>
                <td>{dish.flavor_direction || '-'}</td>
                <td>¥{dish.price_range_min} - ¥{dish.price_range_max}</td>
                <td>{dish.rnd_owner || '-'}</td>
                <td>{dish.expected_margin ? dish.expected_margin + '%' : '-'}</td>
                <td>
                  <span className={`badge badge-${dish.status}`}>
                    {dish.status === 'draft' ? '草稿' : dish.status === 'approved' ? '已审批' : '已上架'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    onClick={() => handleDelete(dish.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增菜品立项</h2>
            {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>菜品名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>目标客群</label>
                  <input
                    type="text"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    placeholder="如：年轻白领、家庭聚餐"
                  />
                </div>
                <div className="form-group">
                  <label>口味方向</label>
                  <input
                    type="text"
                    name="flavor_direction"
                    value={formData.flavor_direction}
                    onChange={handleInputChange}
                    placeholder="如：麻辣、酸甜、清淡"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>最低售价 (¥)</label>
                  <input
                    type="number"
                    name="price_range_min"
                    value={formData.price_range_min}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>最高售价 (¥)</label>
                  <input
                    type="number"
                    name="price_range_max"
                    value={formData.price_range_max}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>研发负责人</label>
                  <input
                    type="text"
                    name="rnd_owner"
                    value={formData.rnd_owner}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>预期毛利率 (%)</label>
                  <input
                    type="number"
                    name="expected_margin"
                    value={formData.expected_margin}
                    onChange={handleInputChange}
                    placeholder="如：60"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dishes;
