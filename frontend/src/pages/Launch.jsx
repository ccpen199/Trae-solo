import React, { useState, useEffect } from 'react';
import { launchAPI, dishesAPI } from '../api.js';

function Launch() {
  const [plans, setPlans] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPlans();
    loadDishes();
  }, []);

  async function loadPlans() {
    try {
      const data = await launchAPI.getAll();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
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

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await launchAPI.create({
        dish_id: form.dish_id.value,
        store_scope: form.store_scope.value,
        training_materials: form.training_materials.value,
        material_prep: form.material_prep.value,
        launch_date: form.launch_date.value,
        status: form.status.value,
      });
      setShowModal(false);
      form.reset();
      loadPlans();
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  }

  function getDishName(dishId) {
    return dishes.find(d => d.id === dishId)?.name || '-';
  }

  return (
    <div>
      <div className="page-header">
        <h1>上新计划</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增计划
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>菜品</th>
              <th>门店范围</th>
              <th>上市日期</th>
              <th>培训材料</th>
              <th>物料准备</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id}>
                <td>{getDishName(plan.dish_id)}</td>
                <td>{plan.store_scope || '-'}</td>
                <td>{plan.launch_date || '-'}</td>
                <td>{plan.training_materials || '-'}</td>
                <td>{plan.material_prep || '-'}</td>
                <td>
                  <span className={`badge badge-${plan.status === 'launched' ? 'launched' : 'draft'}`}>
                    {plan.status === 'planning' ? '规划中' : plan.status === 'launched' ? '已上线' : plan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增上新计划</h2>
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
              <div className="form-group">
                <label>门店范围</label>
                <input type="text" name="store_scope" placeholder="如：全部门店、华东区域、指定门店列表" />
              </div>
              <div className="form-group">
                <label>培训材料</label>
                <textarea name="training_materials" rows="2" placeholder="培训文档、视频链接等" />
              </div>
              <div className="form-group">
                <label>物料准备</label>
                <textarea name="material_prep" rows="2" placeholder="原料备货、包装材料、设备准备等" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>上市日期</label>
                  <input type="date" name="launch_date" />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select name="status">
                    <option value="planning">规划中</option>
                    <option value="preparing">准备中</option>
                    <option value="launched">已上线</option>
                  </select>
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

export default Launch;
