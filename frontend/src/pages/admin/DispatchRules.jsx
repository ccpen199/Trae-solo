import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const DispatchRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editRule, setEditRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    weight_distance: 0.35,
    weight_route: 0.25,
    weight_fulfillment: 0.25,
    weight_supply_demand: 0.15,
    max_distance: 3000,
    min_fulfillment_rate: 80
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform/dispatch-rules');
      setRules(res.data);
      if (res.data.length > 0) {
        setEditRule(res.data[0]);
        setFormData(res.data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const totalWeight = parseFloat(formData.weight_distance) + parseFloat(formData.weight_route) +
      parseFloat(formData.weight_fulfillment) + parseFloat(formData.weight_supply_demand);

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      alert(`权重总和必须等于 1.0，当前总和: ${totalWeight.toFixed(2)}`);
      return;
    }

    try {
      const res = await api.put(`/platform/dispatch-rules/${editRule.id}`, {
        ...formData,
        weight_distance: parseFloat(formData.weight_distance),
        weight_route: parseFloat(formData.weight_route),
        weight_fulfillment: parseFloat(formData.weight_fulfillment),
        weight_supply_demand: parseFloat(formData.weight_supply_demand),
        max_distance: parseInt(formData.max_distance),
        min_fulfillment_rate: parseFloat(formData.min_fulfillment_rate)
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: '派单规则已更新' });
        loadRules();
      } else {
        setMessage({ type: 'error', text: res.data.error });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '保存失败' });
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  const totalWeight = parseFloat(formData.weight_distance) + parseFloat(formData.weight_route) +
    parseFloat(formData.weight_fulfillment) + parseFloat(formData.weight_supply_demand);

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>⚙️ 智能派单规则配置</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">因子权重配置（总和必须 = 1.0）</h3>
          <div className="form-group">
            <label className="form-label">规则名称</label>
            <input type="text" className="form-input" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">
              距离权重 ({formData.weight_distance})
              <span style={{ float: 'right', color: totalWeight !== 1.0 ? 'var(--error)' : 'var(--success)' }}>
                当前总和: {totalWeight.toFixed(2)}
              </span>
            </label>
            <input type="range" className="form-input" min="0" max="1" step="0.01"
              value={formData.weight_distance}
              onChange={(e) => setFormData({ ...formData, weight_distance: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">顺路度权重 ({formData.weight_route})</label>
            <input type="range" className="form-input" min="0" max="1" step="0.01"
              value={formData.weight_route}
              onChange={(e) => setFormData({ ...formData, weight_route: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">履约率权重 ({formData.weight_fulfillment})</label>
            <input type="range" className="form-input" min="0" max="1" step="0.01"
              value={formData.weight_fulfillment}
              onChange={(e) => setFormData({ ...formData, weight_fulfillment: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">时段供需比权重 ({formData.weight_supply_demand})</label>
            <input type="range" className="form-input" min="0" max="1" step="0.01"
              value={formData.weight_supply_demand}
              onChange={(e) => setFormData({ ...formData, weight_supply_demand: e.target.value })} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">最大配送距离(米)</label>
              <input type="number" className="form-input" value={formData.max_distance}
                onChange={(e) => setFormData({ ...formData, max_distance: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">最低履约率(%)</label>
              <input type="number" className="form-input" value={formData.min_fulfillment_rate}
                onChange={(e) => setFormData({ ...formData, min_fulfillment_rate: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={handleSave} disabled={Math.abs(totalWeight - 1.0) > 0.01}>
            保存规则
          </button>
        </div>

        <div className="card">
          <h3 className="card-title">📊 派单算法说明</h3>
          <div style={{ lineHeight: 2 }}>
            <div style={{ marginBottom: '16px' }}>
              <strong>综合得分 =</strong><br />
              距离得分 × 距离权重 +<br />
              顺路度得分 × 顺路度权重 +<br />
              履约率得分 × 履约率权重 +<br />
              供需比得分 × 供需比权重
            </div>
            <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '6px', fontSize: '13px' }}>
              <div>• <strong>距离得分</strong>：1 - 实际距离 / 最大配送距离</div>
              <div>• <strong>顺路度</strong>：与骑手当前订单路线的重合度 (0~1)</div>
              <div>• <strong>履约率得分</strong>：骑手历史履约率 / 100</div>
              <div>• <strong>供需比得分</strong>：min(1, 区域订单量/骑手数 / 2)</div>
            </div>
            <div style={{ marginTop: '16px', padding: '16px', background: '#e6f4ff', borderRadius: '6px', fontSize: '13px' }}>
              <strong>候选过滤条件：</strong><br />
              • 骑手已完成实人认证和车辆绑定<br />
              • 骑手履约率 ≥ 最低履约率阈值<br />
              • 骑手到取餐点距离 ≤ 最大配送距离
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchRules;
