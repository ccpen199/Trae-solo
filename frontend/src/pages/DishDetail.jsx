import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dishesAPI, trialsAPI, ingredientsAPI, feedbackAPI, acceptanceAPI } from '../api.js';

function DishDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [dish, setDish] = useState(null);
  const [trials, setTrials] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [acceptance, setAcceptance] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [costInfo, setCostInfo] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [trialForm, setTrialForm] = useState({
    version: '1.0',
    recipe: '',
    process_steps: '',
    taste_score: '',
    feedback: '',
    created_by: '',
    recipe_items: [],
  });
  const [newIngredient, setNewIngredient] = useState({ ingredient_id: '', quantity: '' });

  useEffect(() => {
    loadDish();
    loadIngredients();
  }, [id]);

  async function loadDish() {
    try {
      const data = await dishesAPI.get(id);
      setDish(data);
      loadTrials();
      loadFeedback();
      loadAcceptance();
    } catch (error) {
      console.error('Failed to load dish:', error);
    }
  }

  async function loadTrials() {
    try {
      const data = await trialsAPI.getByDish(id);
      setTrials(data);
    } catch (error) {
      console.error('Failed to load trials:', error);
    }
  }

  async function loadIngredients() {
    try {
      const data = await ingredientsAPI.getAll();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    }
  }

  async function loadFeedback() {
    try {
      const data = await feedbackAPI.getByDish(id);
      setFeedback(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    }
  }

  async function loadAcceptance() {
    try {
      const data = await acceptanceAPI.getByDish(id);
      setAcceptance(data);
    } catch (error) {
      console.error('Failed to load acceptance:', error);
    }
  }

  async function loadCost(trialId) {
    try {
      const data = await trialsAPI.getCost(trialId);
      setCostInfo(data);
      setSelectedTrial(trialId);
    } catch (error) {
      console.error('Failed to load cost:', error);
    }
  }

  async function handleTrialSubmit(e) {
    e.preventDefault();
    try {
      await trialsAPI.create({
        dish_id: id,
        ...trialForm,
        taste_score: parseFloat(trialForm.taste_score) || 0,
      });
      setShowTrialModal(false);
      setTrialForm({
        version: (trials.length + 1) + '.0',
        recipe: '',
        process_steps: '',
        taste_score: '',
        feedback: '',
        created_by: '',
        recipe_items: [],
      });
      loadTrials();
    } catch (error) {
      console.error('Failed to create trial:', error);
    }
  }

  function addRecipeItem() {
    if (newIngredient.ingredient_id && newIngredient.quantity) {
      setTrialForm(prev => ({
        ...prev,
        recipe_items: [...prev.recipe_items, {
          ingredient_id: parseInt(newIngredient.ingredient_id),
          quantity: parseFloat(newIngredient.quantity),
        }]
      }));
      setNewIngredient({ ingredient_id: '', quantity: '' });
    }
  }

  function removeRecipeItem(index) {
    setTrialForm(prev => ({
      ...prev,
      recipe_items: prev.recipe_items.filter((_, i) => i !== index)
    }));
  }

  async function handleApprove(trialId) {
    const approvedBy = prompt('请输入审批人姓名：');
    if (approvedBy) {
      try {
        await trialsAPI.approve(trialId, approvedBy);
        loadTrials();
        loadDish();
      } catch (error) {
        console.error('Failed to approve trial:', error);
      }
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await feedbackAPI.create({
        dish_id: id,
        store_id: form.store_id.value,
        sales_volume: parseFloat(form.sales_volume.value) || 0,
        customer_feedback: form.customer_feedback.value,
        issues: form.issues.value,
        feedback_date: form.feedback_date.value,
      });
      setShowFeedbackModal(false);
      loadFeedback();
    } catch (error) {
      console.error('Failed to create feedback:', error);
    }
  }

  async function handleAcceptanceSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await acceptanceAPI.create({
        dish_id: id,
        recipe_version_verified: form.recipe_version_verified.checked,
        cost_stability_verified: form.cost_stability_verified.checked,
        taste_pass_rate: parseFloat(form.taste_pass_rate.value) || 0,
        trial_sales_result: form.trial_sales_result.value,
        shelf_status: form.shelf_status.value,
        reviewer: form.reviewer.value,
        notes: form.notes.value,
      });
      setShowAcceptanceModal(false);
      loadAcceptance();
    } catch (error) {
      console.error('Failed to create acceptance:', error);
    }
  }

  if (!dish) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button 
            className="btn btn-secondary" 
            style={{ marginRight: '15px' }}
            onClick={() => navigate('/dishes')}
          >
            ← 返回
          </button>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
            {dish.name}
          </span>
          <span className={`badge badge-${dish.status}`} style={{ marginLeft: '10px' }}>
            {dish.status === 'draft' ? '草稿' : dish.status === 'approved' ? '已审批' : '已上架'}
          </span>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</div>
        <div className={`tab ${activeTab === 'trials' ? 'active' : ''}`} onClick={() => setActiveTab('trials')}>试制记录</div>
        <div className={`tab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>门店反馈</div>
        <div className={`tab ${activeTab === 'acceptance' ? 'active' : ''}`} onClick={() => setActiveTab('acceptance')}>验收记录</div>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <div className="grid-2">
            <div>
              <p><strong>目标客群：</strong>{dish.target_audience || '-'}</p>
              <p><strong>口味方向：</strong>{dish.flavor_direction || '-'}</p>
              <p><strong>售价区间：</strong>¥{dish.price_range_min} - ¥{dish.price_range_max}</p>
            </div>
            <div>
              <p><strong>研发负责人：</strong>{dish.rnd_owner || '-'}</p>
              <p><strong>预期毛利：</strong>{dish.expected_margin ? dish.expected_margin + '%' : '-'}</p>
              <p><strong>创建时间：</strong>{dish.created_at}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trials' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ color: '#2c3e50' }}>试制版本列表</h3>
            <button className="btn btn-primary" onClick={() => setShowTrialModal(true)}>
              + 新增试制
            </button>
          </div>
          
          {trials.map(trial => (
            <div key={trial.id} className="card" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <strong>版本 {trial.version}</strong>
                  {trial.is_official && <span className="badge badge-official" style={{ marginLeft: '10px' }}>正式版</span>}
                </div>
                <div>
                  {!trial.is_official && (
                    <button className="btn btn-success" style={{ marginRight: '10px' }} onClick={() => handleApprove(trial.id)}>
                      审批发布
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => loadCost(trial.id)}>
                    计算成本
                  </button>
                </div>
              </div>
              <div className="grid-2" style={{ fontSize: '14px', color: '#666' }}>
                <div>
                  <p><strong>配方：</strong>{trial.recipe || '-'}</p>
                  <p><strong>工艺步骤：</strong>{trial.process_steps || '-'}</p>
                </div>
                <div>
                  <p><strong>试吃评分：</strong>{trial.taste_score || '-'}</p>
                  <p><strong>修改意见：</strong>{trial.feedback || '-'}</p>
                  <p><strong>创建人：</strong>{trial.created_by || '-'}</p>
                </div>
              </div>

              {selectedTrial === trial.id && costInfo && (
                <div className="cost-info">
                  <h4 style={{ marginBottom: '10px' }}>成本与营养分析</h4>
                  <table className="table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>原料</th>
                        <th>用量</th>
                        <th>单位</th>
                        <th>成本</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costInfo.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit}</td>
                          <td>¥{item.item_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grid-2" style={{ marginTop: '15px' }}>
                    <div>
                      <p><strong>总成本：</strong><span className="highlight">¥{costInfo.totalCost.toFixed(2)}</span></p>
                      <p><strong>建议售价：</strong>¥{costInfo.suggestedPrice.toFixed(2)}</p>
                      <p><strong>毛利红线：</strong>¥{costInfo.marginRedLine.toFixed(2)}</p>
                    </div>
                    <div>
                      <p><strong>热量：</strong>{costInfo.nutrition.calories.toFixed(1)} kcal</p>
                      <p><strong>蛋白质：</strong>{costInfo.nutrition.protein.toFixed(1)} g</p>
                      <p><strong>脂肪：</strong>{costInfo.nutrition.fat.toFixed(1)} g</p>
                      <p><strong>碳水：</strong>{costInfo.nutrition.carbs.toFixed(1)} g</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ color: '#2c3e50' }}>门店反馈</h3>
            <button className="btn btn-primary" onClick={() => setShowFeedbackModal(true)}>
              + 新增反馈
            </button>
          </div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>门店</th>
                  <th>销量</th>
                  <th>客户反馈</th>
                  <th>问题</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map(fb => (
                  <tr key={fb.id}>
                    <td>{fb.store_id}</td>
                    <td>{fb.sales_volume}</td>
                    <td>{fb.customer_feedback || '-'}</td>
                    <td>{fb.issues || '-'}</td>
                    <td>{fb.feedback_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'acceptance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ color: '#2c3e50' }}>验收记录</h3>
            <button className="btn btn-primary" onClick={() => setShowAcceptanceModal(true)}>
              + 新增验收
            </button>
          </div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
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
                {acceptance.map(acc => (
                  <tr key={acc.id}>
                    <td>{acc.recipe_version_verified ? '✅' : '❌'}</td>
                    <td>{acc.cost_stability_verified ? '✅' : '❌'}</td>
                    <td>{acc.taste_pass_rate}%</td>
                    <td>{acc.trial_sales_result || '-'}</td>
                    <td>{acc.shelf_status || '-'}</td>
                    <td>{acc.reviewer}</td>
                    <td>{acc.review_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTrialModal && (
        <div className="modal-overlay" onClick={() => setShowTrialModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增试制记录</h2>
            <form onSubmit={handleTrialSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>版本号</label>
                  <input
                    type="text"
                    value={trialForm.version}
                    onChange={e => setTrialForm(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>试吃评分</label>
                  <input
                    type="number"
                    step="0.1"
                    value={trialForm.taste_score}
                    onChange={e => setTrialForm(prev => ({ ...prev, taste_score: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>配方说明</label>
                <textarea
                  rows="2"
                  value={trialForm.recipe}
                  onChange={e => setTrialForm(prev => ({ ...prev, recipe: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>工艺步骤</label>
                <textarea
                  rows="2"
                  value={trialForm.process_steps}
                  onChange={e => setTrialForm(prev => ({ ...prev, process_steps: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>配方配料</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select
                    style={{ flex: 2 }}
                    value={newIngredient.ingredient_id}
                    onChange={e => setNewIngredient(prev => ({ ...prev, ingredient_id: e.target.value }))}
                  >
                    <option value="">选择原料</option>
                    {ingredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    style={{ flex: 1 }}
                    placeholder="用量"
                    value={newIngredient.quantity}
                    onChange={e => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                  <button type="button" className="btn btn-secondary" onClick={addRecipeItem}>添加</button>
                </div>
                {trialForm.recipe_items.length > 0 && (
                  <table className="table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>原料</th>
                        <th>用量</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trialForm.recipe_items.map((item, i) => (
                        <tr key={i}>
                          <td>{ingredients.find(ing => ing.id === item.ingredient_id)?.name}</td>
                          <td>{item.quantity}</td>
                          <td>
                            <button type="button" className="btn btn-danger" style={{ padding: '2px 8px' }} onClick={() => removeRecipeItem(i)}>删除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>修改意见</label>
                  <input
                    type="text"
                    value={trialForm.feedback}
                    onChange={e => setTrialForm(prev => ({ ...prev, feedback: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>创建人</label>
                  <input
                    type="text"
                    value={trialForm.created_by}
                    onChange={e => setTrialForm(prev => ({ ...prev, created_by: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTrialModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增门店反馈</h2>
            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>门店ID</label>
                  <input type="text" name="store_id" required />
                </div>
                <div className="form-group">
                  <label>销量</label>
                  <input type="number" name="sales_volume" />
                </div>
              </div>
              <div className="form-group">
                <label>客户反馈</label>
                <textarea name="customer_feedback" rows="2" />
              </div>
              <div className="form-group">
                <label>存在问题</label>
                <textarea name="issues" rows="2" />
              </div>
              <div className="form-group">
                <label>反馈日期</label>
                <input type="date" name="feedback_date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAcceptanceModal && (
        <div className="modal-overlay" onClick={() => setShowAcceptanceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>新增验收记录</h2>
            <form onSubmit={handleAcceptanceSubmit}>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="recipe_version_verified" id="dish_recipe_check" style={{ width: '16px', height: '16px', margin: 0 }} />
                <label htmlFor="dish_recipe_check" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal' }}>配方版本验证通过</label>
              </div>
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="cost_stability_verified" id="dish_cost_check" style={{ width: '16px', height: '16px', margin: 0 }} />
                <label htmlFor="dish_cost_check" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal' }}>成本稳定性验证通过</label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>试吃通过率 (%)</label>
                  <input type="number" name="taste_pass_rate" />
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowAcceptanceModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DishDetail;
