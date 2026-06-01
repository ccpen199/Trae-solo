import React, { useState, useEffect } from 'react';
import { acceptanceAPI, dishesAPI } from '../api.js';

function Acceptance() {
  const [acceptances, setAcceptances] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAcceptances();
    loadDishes();
  }, []);

  async function loadAcceptances() {
    try {
      const allAcceptances = [];
      for (const dish of dishes) {
        const data = await acceptanceAPI.getByDish(dish.id);
        allAcceptances.push(...data.map(item => ({ ...item, dish_name: dish.name })));
      }
      setAcceptances(allAcceptances);
    } catch (error) {
      console.error('Failed to load acceptances:', error);
    }
  }

  async function loadDishes() {
    try {
      const data = await dishesAPI.getAll();
      setDishes(data);
    } catch (error) {
      console.error('Failed to load dishes:', error);
    }
  }

  useEffect(() => {
    if (dishes.length > 0) {
      loadAcceptances();
    }
  }, [dishes.length]);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await acceptanceAPI.create({
        dish_id: form.dish_id.value,
        recipe_version_verified: form.recipe_version_verified.checked,
        cost_stability_verified: form.cost_stability_verified.checked,
        taste_pass_rate: parseFloat(form.taste_pass_rate.value) || 0,
        trial_sales_result: form.trial_sales_result.value,
        shelf_status: form.shelf_status.value,
        reviewer: form.reviewer.value,
        notes: form.notes.value,
      });
      setShowModal(false);
      form.reset();
      loadAcceptances();
    } catch (error) {
      console.error('Failed to create acceptance:', error);
    }
  }

  function getDishName(dishId) {
    return dishes.find(d => d.id === dishId)?.name || '-';
  }

  return (
    <div>
      <div className="page-header">
        <h1>验收管理</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增验收
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>菜品</th>
              <th>配方验证</th>
              <th>成本稳定</th>
              <th>试吃通过率</th>
              <th>试销结果</th>
              <th>货架状态</th>
              <th>验收人</th>
              <th>日期</th>
            </tr>
          </thead>
          <tbody>
            {acceptances.map(acc => (
              <tr key={acc.id}>
                <td>{getDishName(acc.dish_id)}</td>
                <td>{acc.recipe_version_verified ? '✅ 通过' : '❌ 未通过'}</td>
                <td>{acc.cost_stability_verified ? '✅ 通过' : '❌ 未通过'}</td>
                <td>{acc.taste_pass_rate}%</td>
                <td>
                  {acc.trial_sales_result === 'excellent' ? '优秀' : 
                   acc.trial_sales_result === 'good' ? '良好' :
                   acc.trial_sales_result === 'average' ? '一般' :
                   acc.trial_sales_result === 'poor' ? '较差' : '-'}
                </td>
                <td>
                  {acc.shelf_status === 'on_shelf' ? '在售' :
                   acc.shelf_status === 'trial' ? '试销' :
                   acc.shelf_status === 'off_shelf' ? '下架' : '-'}
                </td>
                <td>{acc.reviewer}</td>
                <td>{acc.review_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增验收记录</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择菜品</label>
                <select name="dish_id" required>
                  <option value="">请选择</option>
                  {dishes.map(dish => (
                    <option key={dish.id} value={dish.id}>{dish.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="recipe_version_verified" id="recipe_check" style={{ width: '16px', height: '16px', margin: 0 }} />
                <label htmlFor="recipe_check" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal' }}>配方版本验证通过</label>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="cost_stability_verified" id="cost_check" style={{ width: '16px', height: '16px', margin: 0 }} />
                <label htmlFor="cost_check" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal' }}>成本稳定性验证通过</label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>试吃通过率 (%)</label>
                  <input type="number" name="taste_pass_rate" min="0" max="100" />
                </div>
                <div className="form-group">
                  <label>试销结果</label>
                  <select name="trial_sales_result">
                    <option value="">请选择</option>
                    <option value="excellent">优秀</option>
                    <option value="good">良好</option>
                    <option value="average">一般</option>
                    <option value="poor">较差</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>货架状态</label>
                  <select name="shelf_status">
                    <option value="">请选择</option>
                    <option value="on_shelf">在售</option>
                    <option value="trial">试销</option>
                    <option value="off_shelf">下架</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>验收人</label>
                  <input type="text" name="reviewer" />
                </div>
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea name="notes" rows="2" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Acceptance;
