import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAuditPlans, getAuditChecklist, saveChecklistBatch } from '../api.js';

function Checklist() {
  const { planId } = useParams();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getAuditPlans().then(res => {
      setPlans(res.data);
      if (planId && res.data.find(p => String(p.id) === String(planId))) {
        setSelectedPlan(String(planId));
      }
    });
  }, [planId]);

  useEffect(() => {
    if (selectedPlan) {
      setLoading(true);
      getAuditChecklist(selectedPlan)
        .then(res => {
          console.log('Loaded checklist:', res.data);
          setChecklist(res.data || []);
        })
        .catch(err => {
          console.error('Load error:', err);
          setChecklist([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setChecklist([]);
    }
  }, [selectedPlan]);

  const handleScoreChange = (catIdx, itemIdx, value) => {
    const newChecklist = JSON.parse(JSON.stringify(checklist));
    const item = newChecklist[catIdx].items[itemIdx];
    const score = parseInt(value) || 0;
    item.score = Math.min(Math.max(score, 0), item.max_score);
    setChecklist(newChecklist);
  };

  const handleNotesChange = (catIdx, itemIdx, value) => {
    const newChecklist = JSON.parse(JSON.stringify(checklist));
    newChecklist[catIdx].items[itemIdx].notes = value;
    setChecklist(newChecklist);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const items = [];
      checklist.forEach(cat => {
        cat.items.forEach(item => {
          if (item.score > 0 || item.notes) {
            items.push({
              checklist_item_id: item.id,
              score: item.score || 0,
              notes: item.notes || '',
              photo_path: ''
            });
          }
        });
      });
      await saveChecklistBatch(selectedPlan, { items, filled_by: 1 });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getTotalScore = () => {
    let total = 0, max = 0;
    checklist.forEach(cat => {
      cat.items.forEach(item => {
        total += item.score || 0;
        max += item.max_score || 0;
      });
    });
    return { total, max, percent: max > 0 ? Math.round((total / max) * 100) : 0 };
  };

  const getCategoryScore = (cat) => {
    let total = 0, max = 0;
    cat.items.forEach(item => {
      total += item.score || 0;
      max += item.max_score || 0;
    });
    return { total, max, percent: max > 0 ? Math.round((total / max) * 100) : 0 };
  };

  const score = getTotalScore();

  return (
    <div>
      <h2 className="page-title">检查清单管理</h2>
      
      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>选择验厂计划</label>
            <select className="select-control" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
              <option value="">请选择验厂计划</option>
              {plans.map(p => (
                <option key={p.id} value={String(p.id)}>
                  {p.supplier_name} - {p.factory_name} ({p.audit_date})
                </option>
              ))}
            </select>
          </div>
          {selectedPlan && (
            <div className="form-group">
              <label>当前得分</label>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: score.percent >= 75 ? '#52c41a' : score.percent >= 60 ? '#faad14' : '#ff4d4f' }}>
                {score.percent}% ({score.total}/{score.max})
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPlan && loading && (
        <div className="card">
          <div className="empty-state">正在加载检查清单...</div>
        </div>
      )}

      {selectedPlan && !loading && checklist.length > 0 && (
        <>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存检查结果'}
            </button>
            {saveSuccess && <span style={{ color: '#52c41a', marginLeft: '12px' }}>✓ 保存成功</span>}
          </div>

          {checklist.map((cat, catIdx) => {
            const catScore = getCategoryScore(cat);
            return (
              <div key={cat.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>{cat.name}</h3>
                  <span className={`tag ${catScore.percent >= 75 ? 'tag-success' : catScore.percent >= 50 ? 'tag-warning' : 'tag-danger'}`}>
                    {catScore.percent}% ({catScore.total}/{catScore.max})
                  </span>
                </div>
                
                {cat.items.map((item, itemIdx) => (
                  <div key={item.id} className="checklist-item">
                    <div className="checklist-item-header">
                      <div className="checklist-item-text">
                        {item.sort_order + 1}. {item.item_text}
                      </div>
                      <div className="score-input">
                        <input
                          type="number"
                          min="0"
                          max={item.max_score}
                          value={item.score ?? ''}
                          placeholder={`0-${item.max_score}`}
                          onChange={e => handleScoreChange(catIdx, itemIdx, e.target.value)}
                        />
                        <div style={{ fontSize: '12px', color: '#8c8c8c', textAlign: 'center', marginTop: '4px' }}>
                          满分 {item.max_score}
                        </div>
                      </div>
                    </div>
                    <textarea
                      className="notes-textarea"
                      placeholder="填写检查备注..."
                      value={item.notes || ''}
                      onChange={e => handleNotesChange(catIdx, itemIdx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            );
          })}

          <div className="actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存检查结果'}
            </button>
            {saveSuccess && <span style={{ color: '#52c41a', marginLeft: '12px' }}>✓ 保存成功</span>}
          </div>
        </>
      )}

      {selectedPlan && !loading && checklist.length === 0 && (
        <div className="card">
          <div className="empty-state">检查清单为空，请重新选择验厂计划</div>
        </div>
      )}

      {!selectedPlan && (
        <div className="card">
          <div className="empty-state">请选择验厂计划开始检查</div>
        </div>
      )}
    </div>
  );
}

export default Checklist;
