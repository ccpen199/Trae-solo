import React, { useState, useEffect } from 'react';
import { dishesAPI } from '../api.js';

function Home() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await dishesAPI.getAll();
      setDishes(data);
    } catch (error) {
      console.error('Failed to load dishes:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: dishes.length,
    draft: dishes.filter(d => d.status === 'draft').length,
    approved: dishes.filter(d => d.status === 'approved').length,
    launched: dishes.filter(d => d.status === 'launched').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1>仪表盘</h1>
      </div>

      <div className="grid-3" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <h4>菜品总数</h4>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card green">
          <h4>已立项</h4>
          <div className="value">{stats.draft}</div>
        </div>
        <div className="stat-card orange">
          <h4>已上架</h4>
          <div className="value">{stats.launched}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>最近菜品</h3>
        {loading ? (
          <p>加载中...</p>
        ) : dishes.length === 0 ? (
          <p>暂无菜品，请先进行菜品立项</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>菜品名称</th>
                <th>目标客群</th>
                <th>口味方向</th>
                <th>研发负责人</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {dishes.slice(0, 5).map(dish => (
                <tr key={dish.id}>
                  <td>{dish.name}</td>
                  <td>{dish.target_audience || '-'}</td>
                  <td>{dish.flavor_direction || '-'}</td>
                  <td>{dish.rnd_owner || '-'}</td>
                  <td>
                    <span className={`badge badge-${dish.status}`}>
                      {dish.status === 'draft' ? '草稿' : dish.status === 'approved' ? '已审批' : '已上架'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>系统说明</h3>
        <ul style={{ lineHeight: '2', paddingLeft: '20px' }}>
          <li><strong>菜品立项：</strong>记录目标客群、口味方向、售价区间、研发负责人和预期毛利</li>
          <li><strong>试制记录：</strong>保存配方、工艺步骤、试吃评分和版本，正式版需要审批发布</li>
          <li><strong>成本计算：</strong>从配方、原料价格和损耗计算成本，自动给出售价建议</li>
          <li><strong>上新计划：</strong>关联门店范围、培训材料、物料准备和上市日期</li>
          <li><strong>验收管理：</strong>覆盖配方版本、成本波动、试吃退回和门店试销</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
