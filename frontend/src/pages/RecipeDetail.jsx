import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipes, materials } from '../api';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [materialList, setMaterialList] = useState([]);
  const [activeTab, setActiveTab] = useState('materials');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    material_id: '',
    quantity: '',
    unit: 'kg',
    loss_rate: 0,
    sort_order: 0
  });

  useEffect(() => {
    loadRecipe();
    loadMaterials();
  }, [id]);

  const loadRecipe = async () => {
    try {
      const res = await recipes.get(id);
      setRecipe(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaterials = async () => {
    try {
      const res = await materials.getAll({ status: 'active' });
      setMaterialList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      await recipes.addMaterial(id, materialForm);
      setShowMaterialModal(false);
      loadRecipe();
      setMaterialForm({ material_id: '', quantity: '', unit: 'kg', loss_rate: 0, sort_order: 0 });
    } catch (err) {
      alert('添加失败');
    }
  };

  const handleRemoveMaterial = async (materialId) => {
    if (confirm('确定删除该原料？')) {
      try {
        await recipes.removeMaterial(id, materialId);
        loadRecipe();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  if (!recipe) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{recipe.name}</h2>
          <small style={{ color: '#888' }}>{recipe.code} · 版本 {recipe.version}</small>
        </div>
        <button className="btn" onClick={() => navigate('/recipes')}>返回列表</button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-row">
          <div>
            <strong>分类：</strong>{recipe.category || '-'}
          </div>
          <div>
            <strong>工艺损耗率：</strong>{recipe.process_loss_rate}%
          </div>
          <div>
            <strong>类型：</strong>
            {recipe.type === 'trial' ? '研发试制' : '正式配方'}
          </div>
          <div>
            <strong>状态：</strong>
            <span className={`badge ${recipe.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {recipe.status === 'active' ? '已启用' : '草稿'}
            </span>
          </div>
        </div>
        {recipe.description && (
          <div style={{ marginTop: '10px' }}>
            <strong>描述：</strong>{recipe.description}
          </div>
        )}
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
          原料清单
        </div>
        <div className={`tab ${activeTab === 'packaging' ? 'active' : ''}`} onClick={() => setActiveTab('packaging')}>
          包装材料
        </div>
        <div className={`tab ${activeTab === 'labor' ? 'active' : ''}`} onClick={() => setActiveTab('labor')}>
          人工成本
        </div>
      </div>

      {activeTab === 'materials' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3>原料组成</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMaterialModal(true)}>
              + 添加原料
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>原料名称</th>
                <th>原料编码</th>
                <th>用量</th>
                <th>单位</th>
                <th>损耗率</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recipe.materials?.map((m, idx) => (
                <tr key={m.id}>
                  <td>{idx + 1}</td>
                  <td>{m.material_name}</td>
                  <td>{m.material_code}</td>
                  <td>{m.quantity}</td>
                  <td>{m.unit}</td>
                  <td>{m.loss_rate}%</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemoveMaterial(m.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {!recipe.materials?.length && (
                <tr><td colSpan="7" className="empty-state">暂无原料，请添加</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'packaging' && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>包装材料</h3>
          <table>
            <thead>
              <tr>
                <th>包装名称</th>
                <th>类型</th>
                <th>数量</th>
                <th>单价</th>
              </tr>
            </thead>
            <tbody>
              {recipe.packaging?.map(p => (
                <tr key={p.id}>
                  <td>{p.packaging_name}</td>
                  <td>{p.type}</td>
                  <td>{p.quantity}</td>
                  <td>¥{p.unit_price}</td>
                </tr>
              ))}
              {!recipe.packaging?.length && (
                <tr><td colSpan="4" className="empty-state">暂无包装材料</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'labor' && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>人工成本</h3>
          <table>
            <thead>
              <tr>
                <th>工序名称</th>
                <th>工时（小时）</th>
                <th>小时费率</th>
                <th>成本</th>
              </tr>
            </thead>
            <tbody>
              {recipe.labor?.map(l => (
                <tr key={l.id}>
                  <td>{l.process_name}</td>
                  <td>{l.labor_hours}</td>
                  <td>¥{l.hourly_rate}</td>
                  <td>¥{(l.labor_hours * l.hourly_rate).toFixed(2)}</td>
                </tr>
              ))}
              {!recipe.labor?.length && (
                <tr><td colSpan="4" className="empty-state">暂无人工成本数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加原料</h3>
              <button className="modal-close" onClick={() => setShowMaterialModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="form-group">
                <label>选择原料</label>
                <select required value={materialForm.material_id} 
                  onChange={e => setMaterialForm({...materialForm, material_id: e.target.value})}>
                  <option value="">请选择</option>
                  {materialList.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>用量</label>
                  <input type="number" step="0.001" required 
                    value={materialForm.quantity}
                    onChange={e => setMaterialForm({...materialForm, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>单位</label>
                  <input value={materialForm.unit}
                    onChange={e => setMaterialForm({...materialForm, unit: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>损耗率 (%)</label>
                <input type="number" step="0.1" value={materialForm.loss_rate}
                  onChange={e => setMaterialForm({...materialForm, loss_rate: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowMaterialModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
