import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { API, formatMoney, getPeriodText, getPeriodColor } from '../../api';
import ReactECharts from 'echarts-for-react';

function PriceStrategy() {
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [formData, setFormData] = useState({
    strategy_name: '',
    station_id: '',
    is_active: true,
    effective_date: '',
    expire_date: '',
    periods: [
      { period_type: 'peak', start_time: '08:00', end_time: '12:00', electricity_price: 1.5, service_price: 0.6, total_price: 2.1 },
      { period_type: 'peak', start_time: '18:00', end_time: '22:00', electricity_price: 1.5, service_price: 0.6, total_price: 2.1 },
      { period_type: 'flat', start_time: '12:00', end_time: '18:00', electricity_price: 1.0, service_price: 0.6, total_price: 1.6 },
      { period_type: 'valley', start_time: '22:00', end_time: '08:00', electricity_price: 0.5, service_price: 0.6, total_price: 1.1 }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.pricing.list();
      setStrategies(res.data || []);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = () => {
    setEditingStrategy(null);
    setFormData({
      strategy_name: '',
      station_id: '',
      is_active: true,
      effective_date: '',
      expire_date: '',
      periods: [
        { period_type: 'peak', start_time: '08:00', end_time: '12:00', electricity_price: 1.5, service_price: 0.6, total_price: 2.1 },
        { period_type: 'peak', start_time: '18:00', end_time: '22:00', electricity_price: 1.5, service_price: 0.6, total_price: 2.1 },
        { period_type: 'flat', start_time: '12:00', end_time: '18:00', electricity_price: 1.0, service_price: 0.6, total_price: 1.6 },
        { period_type: 'valley', start_time: '22:00', end_time: '08:00', electricity_price: 0.5, service_price: 0.6, total_price: 1.1 }
      ]
    });
    setShowModal(true);
  };

  const handleEdit = (strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      strategy_name: strategy.strategy_name || '',
      station_id: strategy.station_id || '',
      is_active: strategy.is_active !== undefined ? strategy.is_active : true,
      effective_date: strategy.effective_date || '',
      expire_date: strategy.expire_date || '',
      periods: strategy.periods ? strategy.periods.map(p => ({ ...p })) : [
        { period_type: 'peak', start_time: '08:00', end_time: '12:00', electricity_price: 1.5, service_price: 0.6, total_price: 2.1 },
        { period_type: 'peak', start_time: '18:00', end_time: '22:00', electricity_price: 1.5, service_price: 0.6, total_price: 2.1 },
        { period_type: 'flat', start_time: '12:00', end_time: '18:00', electricity_price: 1.0, service_price: 0.6, total_price: 1.6 },
        { period_type: 'valley', start_time: '22:00', end_time: '08:00', electricity_price: 0.5, service_price: 0.6, total_price: 1.1 }
      ]
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.strategy_name) {
      alert('请输入策略名称');
      return;
    }
    try {
      if (editingStrategy) {
        await API.pricing.update(editingStrategy.id, formData);
        alert('更新成功');
      } else {
        await API.pricing.create(formData);
        alert('创建成功');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败');
    }
  };

  const updatePeriod = (index, field, value) => {
    const newPeriods = [...formData.periods];
    newPeriods[index][field] = value;
    if (field === 'electricity_price' || field === 'service_price') {
      const ep = parseFloat(newPeriods[index].electricity_price) || 0;
      const sp = parseFloat(newPeriods[index].service_price) || 0;
      newPeriods[index].total_price = parseFloat((ep + sp).toFixed(2));
    }
    setFormData({ ...formData, periods: newPeriods });
  };

  const addPeriod = () => {
    setFormData({
      ...formData,
      periods: [...formData.periods, { period_type: 'flat', start_time: '00:00', end_time: '00:00', electricity_price: 1.0, service_price: 0.6, total_price: 1.6 }]
    });
  };

  const removePeriod = (index) => {
    const newPeriods = formData.periods.filter((_, i) => i !== index);
    setFormData({ ...formData, periods: newPeriods });
  };

  const getTimelineOption = (periods) => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const timeToIndex = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h + m / 60;
    };
    const data = hours.map((_, i) => {
      for (const p of periods) {
        const start = timeToIndex(p.start_time);
        const end = timeToIndex(p.end_time);
        if (start < end) {
          if (i >= start && i < end) return p.period_type;
        } else {
          if (i >= start || i < end) return p.period_type;
        }
      }
      return 'flat';
    });
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLabel: { fontSize: 10, rotate: 45 }
      },
      yAxis: {
        type: 'category',
        data: ['时段'],
        axisLabel: { show: false }
      },
      series: [{
        type: 'bar',
        data: data.map(d => ({
          value: [d, '时段'],
          itemStyle: { color: getPeriodColor(d) }
        })),
        barWidth: '100%'
      }]
    };
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="tabs">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>运营概览</NavLink>
        <NavLink to="/admin/device-health" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>设备健康</NavLink>
        <NavLink to="/admin/alarm-workorders" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>告警工单</NavLink>
        <NavLink to="/admin/price-strategy" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>电价策略</NavLink>
        <NavLink to="/admin/revenue-report" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>收益报表</NavLink>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>电价策略列表</h2>
          <button className="btn btn-primary btn-sm" onClick={handleAdd}>新增策略</button>
        </div>
        {strategies.length === 0 ? (
          <div className="empty">暂无电价策略</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>策略名称</th>
                <th>充电站</th>
                <th>状态</th>
                <th>生效日期</th>
                <th>到期日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map(strategy => (
                <React.Fragment key={strategy.id}>
                  <tr>
                    <td>
                      <button
                        className="btn btn-default btn-sm"
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                        onClick={() => toggleExpand(strategy.id)}
                      >
                        {expandedRows[strategy.id] ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className="font-bold">{strategy.strategy_name}</td>
                    <td>{strategy.station_name || '全部充电站'}</td>
                    <td>
                      <span className="status-badge" style={{
                        background: strategy.is_active ? '#52c41a20' : '#8c8c8c20',
                        color: strategy.is_active ? '#52c41a' : '#8c8c8c'
                      }}>
                        {strategy.is_active ? '启用' : '停用'}
                      </span>
                    </td>
                    <td>{strategy.effective_date || '-'}</td>
                    <td>{strategy.expire_date || '-'}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleEdit(strategy)}>编辑</button>
                    </td>
                  </tr>
                  {expandedRows[strategy.id] && strategy.periods && (
                    <tr>
                      <td colSpan={7} style={{ background: '#fafafa', padding: '16px' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <strong>分时电价明细</strong>
                        </div>
                        <table style={{ marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th>时段类型</th>
                              <th>开始时间</th>
                              <th>结束时间</th>
                              <th>电价</th>
                              <th>服务费</th>
                              <th>总价</th>
                            </tr>
                          </thead>
                          <tbody>
                            {strategy.periods.map((period, idx) => (
                              <tr key={idx}>
                                <td>
                                  <span className="status-badge" style={{
                                    background: getPeriodColor(period.period_type) + '20',
                                    color: getPeriodColor(period.period_type)
                                  }}>
                                    {getPeriodText(period.period_type)}
                                  </span>
                                </td>
                                <td>{period.start_time}</td>
                                <td>{period.end_time}</td>
                                <td>{formatMoney(period.electricity_price)}</td>
                                <td>{formatMoney(period.service_price)}</td>
                                <td className="font-bold">{formatMoney(period.total_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '700px', maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto' }}>
            <div className="card-header">
              <h2>{editingStrategy ? '编辑电价策略' : '新增电价策略'}</h2>
              <button className="btn btn-default btn-sm" onClick={() => setShowModal(false)}>取消</button>
            </div>
            <div className="form-group">
              <label>策略名称 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input type="text" value={formData.strategy_name} onChange={(e) => setFormData({ ...formData, strategy_name: e.target.value })} placeholder="请输入策略名称" />
            </div>
            <div className="form-group">
              <label>适用充电站</label>
              <select value={formData.station_id} onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}>
                <option value="">全部充电站</option>
                <option value="1">充电站A</option>
                <option value="2">充电站B</option>
                <option value="3">充电站C</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>状态</label>
                <select value={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                  <option value="true">启用</option>
                  <option value="false">停用</option>
                </select>
              </div>
              <div className="form-group">
                <label>生效日期</label>
                <input type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>到期日期</label>
                <input type="date" value={formData.expire_date} onChange={(e) => setFormData({ ...formData, expire_date: e.target.value })} />
              </div>
            </div>

            <div className="card" style={{ background: '#fafafa' }}>
              <div className="card-header">
                <h3>24小时时段配置</h3>
              </div>
              <ReactECharts option={getTimelineOption(formData.periods)} style={{ height: '80px' }} />
            </div>

            <div className="card" style={{ background: '#fafafa' }}>
              <div className="card-header">
                <h3>分时电价明细</h3>
                <button className="btn btn-default btn-sm" onClick={addPeriod}>添加时段</button>
              </div>
              {formData.periods.map((period, index) => (
                <div key={index} className="form-row" style={{ marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>时段类型</label>
                    <select value={period.period_type} onChange={(e) => updatePeriod(index, 'period_type', e.target.value)}>
                      <option value="peak">峰时</option>
                      <option value="flat">平时</option>
                      <option value="valley">谷时</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>开始时间</label>
                    <input type="time" value={period.start_time} onChange={(e) => updatePeriod(index, 'start_time', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>结束时间</label>
                    <input type="time" value={period.end_time} onChange={(e) => updatePeriod(index, 'end_time', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>电价 (元/kWh)</label>
                    <input type="number" step="0.01" value={period.electricity_price} onChange={(e) => updatePeriod(index, 'electricity_price', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>服务费 (元/kWh)</label>
                    <input type="number" step="0.01" value={period.service_price} onChange={(e) => updatePeriod(index, 'service_price', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>总价 (元/kWh)</label>
                    <input type="number" step="0.01" value={period.total_price} readOnly style={{ background: '#f5f5f5' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <button className="btn btn-danger btn-sm" onClick={() => removePeriod(index)}>删除</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-between">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriceStrategy;
