import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Pricing() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.getPricingRules();
      setRules(res.data.data);
    } catch (err) {
      console.error('Failed to load pricing rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id, isActive) => {
    const rule = rules.find(r => r.id === id);
    try {
      await api.updatePricingRule(id, { ...rule, is_active: isActive ? 1 : 0 });
      loadRules();
    } catch (err) {
      alert('操作失败：' + err.message);
    }
  };

  const getRuleTypeName = (type) => {
    const names = {
      parking_discount: '停车优惠',
      charging_discount: '充电优惠',
      overtime_fee: '超时费用',
      member_benefit: '会员权益'
    };
    return names[type] || type;
  };

  return (
    <div>
      <div className="page-header">
        <h1>计费规则</h1>
      </div>

      <div className="card">
        <div className="card-title">规则说明</div>
        <div className="form-row">
          <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '8px' }}>
            <h4>停车计费</h4>
            <p>• 普通车位：5元/小时</p>
            <p>• 充电车位：8元/小时</p>
            <p>• 充电满30分钟免停车费</p>
          </div>
          <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
            <h4>充电计费</h4>
            <p>• 基础电价：1.5元/度</p>
            <p>• 黄金会员：9折优惠</p>
            <p>• 铂金会员：8折优惠</p>
          </div>
          <div style={{ padding: '16px', background: '#fffbe6', borderRadius: '8px' }}>
            <h4>超时占位费</h4>
            <p>• 停车超过2小时：20元/小时</p>
            <p>• 充电完成后30分钟内离场免费</p>
            <p>• 超时最高封顶：100元</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">规则配置</div>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>规则名称</th>
                  <th>类型</th>
                  <th>优惠/费用</th>
                  <th>条件</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{getRuleTypeName(r.rule_type)}</td>
                    <td>{r.value}{r.rule_type.includes('discount') ? '%' : '元'}</td>
                    <td>{r.conditions || '-'}</td>
                    <td>
                      <span className={`status-badge ${r.is_active ? 'status-available' : 'status-idle'}`}>
                        {r.is_active ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td>
                      {r.is_active ? (
                        <button className="btn btn-small btn-warning" onClick={() => toggleRule(r.id, false)}>
                          禁用
                        </button>
                      ) : (
                        <button className="btn btn-small btn-success" onClick={() => toggleRule(r.id, true)}>
                          启用
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Pricing;
