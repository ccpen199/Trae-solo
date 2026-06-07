import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const AdminFinance = () => {
  const [commissionRules, setCommissionRules] = useState([]);
  const [activeTab, setActiveTab] = useState('commission');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform/commission-rules');
      setCommissionRules(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>💳 财务管理</h1>

      <div className="tabs">
        <div className={`tab-item ${activeTab === 'commission' ? 'active' : ''}`} onClick={() => setActiveTab('commission')}>提成规则</div>
        <div className={`tab-item ${activeTab === 'tax' ? 'active' : ''}`} onClick={() => setActiveTab('tax')}>税务管理</div>
      </div>

      {activeTab === 'commission' && (
        <>
          <div className="card">
            <h3 className="card-title">📊 阶梯提成规则</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>骑手等级</th>
                  <th>累计订单门槛</th>
                  <th>基础提成比例</th>
                  <th>额外奖励提成</th>
                  <th>高峰时段提成</th>
                  <th>综合收益(10元配送费)</th>
                </tr>
              </thead>
              <tbody>
                {commissionRules.map((rule) => (
                  <tr key={rule.id}>
                    <td><strong>Lv.{rule.level}</strong></td>
                    <td>≥ {rule.order_threshold} 单</td>
                    <td>{(rule.base_rate * 100).toFixed(0)}%</td>
                    <td>+{(rule.bonus_rate * 100).toFixed(0)}%</td>
                    <td>{(rule.peak_hour_rate * 100).toFixed(0)}%</td>
                    <td style={{ color: 'var(--success)' }}>
                      平时: ¥{(10 * rule.base_rate).toFixed(2)}
                      {rule.bonus_rate > 0 && <span> + 奖¥{(10 * rule.bonus_rate).toFixed(2)}</span>}
                      <br />高峰: ¥{(10 * rule.peak_hour_rate).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 className="card-title">💰 收益计算示例</h3>
            <div className="grid grid-3">
              <div style={{ padding: '20px', background: '#f6ffed', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Lv.1 新骑手</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)' }}>¥7.5</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>10元配送费 × 75%</div>
              </div>
              <div style={{ padding: '20px', background: '#e6f4ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Lv.2 骨干骑手</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>¥8.5</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>10元配送费 × 85% (含激励)</div>
              </div>
              <div style={{ padding: '20px', background: '#fff7e6', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Lv.3 核心骑手(高峰)</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)' }}>¥10.0</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>10元配送费 × 100% (高峰+激励)</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tax' && (
        <>
          <div className="card">
            <h3 className="card-title">📋 税务代扣说明</h3>
            <div className="alert alert-info">
              <strong>政策依据：</strong>根据《个人所得税法》，个人从事劳务报酬所得需缴纳个人所得税，平台作为扣缴义务人履行代扣代缴义务。
            </div>
            <div className="grid grid-2" style={{ marginTop: '20px' }}>
              <div>
                <h4 style={{ marginBottom: '12px' }}>代扣范围</h4>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                  <li>骑手所有配送收入</li>
                  <li>各类激励奖金</li>
                  <li>小费收入（按95%计税）</li>
                </ul>
              </div>
              <div>
                <h4 style={{ marginBottom: '12px' }}>税率说明</h4>
                <ul style={{ paddingLeft: '20px', lineHeight: 2 }}>
                  <li>统一按 <strong>3%</strong> 征收率预扣预缴</li>
                  <li>年末骑手可进行个税汇算清缴</li>
                  <li>平台自动生成完税凭证</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">📄 完税凭证样式</h3>
            <div style={{ padding: '24px', background: '#fafafa', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'monospace' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <strong>中华人民共和国个人所得税完税证明</strong>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 2 }}>
                <div>凭证编号：<span className="mask">TAX20240601XXXXXXXX</span></div>
                <div>纳税人：<span className="mask">张师傅 (110***********1234)</span></div>
                <div>扣缴义务人：配送协同平台</div>
                <div>税款所属期：2024年6月</div>
                <div>计税收入额：¥5,000.00</div>
                <div>税率：3%</div>
                <div>已缴税额：¥150.00</div>
                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  填发日期：2024年7月1日
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFinance;
