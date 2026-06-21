import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { API, formatDateTime, getStatusText, getStatusColor, getHealthLevelText, getHealthLevelColor, getChargerTypeText } from '../../api';

function DeviceHealth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthList, setHealthList] = useState([]);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ handler: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.chargers.healthList();
      const sorted = [...(res.data || [])].sort((a, b) => a.health_score - b.health_score);
      setHealthList(sorted);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStats = () => {
    const stats = { excellent: 0, good: 0, fair: 0, poor: 0 };
    healthList.forEach(h => {
      const level = h.health_level;
      if (stats[level] !== undefined) stats[level]++;
    });
    return stats;
  };

  const handleViewDetail = (charger) => {
    setSelectedCharger(charger);
    setShowModal(true);
  };

  const handleDispatch = (charger) => {
    setSelectedCharger(charger);
    setDispatchForm({ handler: '', description: '' });
    setShowDispatchModal(true);
  };

  const handleSubmitDispatch = async () => {
    if (!dispatchForm.handler) {
      alert('请填写处理人');
      return;
    }
    try {
      alert('派单成功');
      setShowDispatchModal(false);
    } catch (err) {
      console.error('派单失败:', err);
    }
  };

  const stats = getHealthStats();

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

      <div className="grid grid-cols-4 mb-16">
        <div className="stat-card green">
          <div className="label">优秀</div>
          <div className="value">{stats.excellent}<span className="unit">台</span></div>
          <div className="trend">评分 ≥ 90分</div>
        </div>
        <div className="stat-card blue">
          <div className="label">良好</div>
          <div className="value">{stats.good}<span className="unit">台</span></div>
          <div className="trend">评分 75-89分</div>
        </div>
        <div className="stat-card orange">
          <div className="label">一般</div>
          <div className="value">{stats.fair}<span className="unit">台</span></div>
          <div className="trend">评分 60-74分</div>
        </div>
        <div className="stat-card red">
          <div className="label">较差</div>
          <div className="value">{stats.poor}<span className="unit">台</span></div>
          <div className="trend">评分 &lt; 60分</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>充电桩健康度列表</h2>
          <button className="btn btn-default btn-sm" onClick={loadData}>刷新</button>
        </div>
        {healthList.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>编号</th>
                <th>类型</th>
                <th>功率</th>
                <th>健康评分</th>
                <th>健康等级</th>
                <th>温度</th>
                <th>状态</th>
                <th>故障代码</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {healthList.map(charger => (
                <tr key={charger.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{charger.charger_code}</td>
                  <td>
                    <span className={`charger-type ${charger.type}`}>{getChargerTypeText(charger.type)}</span>
                  </td>
                  <td>{charger.power} kW</td>
                  <td>
                    <div style={{ minWidth: '120px' }}>
                      <div className="flex-between mb-8">
                        <span className="font-bold">{charger.health_score}分</span>
                      </div>
                      <div className={`health-bar ${charger.health_level}`}>
                        <div className="fill" style={{ width: `${charger.health_score}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: getHealthLevelColor(charger.health_level) + '20',
                      color: getHealthLevelColor(charger.health_level)
                    }}>
                      {getHealthLevelText(charger.health_level)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: charger.temperature > 60 ? '#ff4d4f' : charger.temperature > 50 ? '#faad14' : '#52c41a' }}>
                      {charger.temperature}°C
                    </span>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: getStatusColor(charger.status) + '20',
                      color: getStatusColor(charger.status)
                    }}>
                      {getStatusText(charger.status)}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: charger.fault_code ? '#ff4d4f' : '#8c8c8c' }}>
                    {charger.fault_code || '-'}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => handleViewDetail(charger)}>查看详情</button>
                    <button className="btn btn-default btn-sm" style={{ marginLeft: '4px' }} onClick={() => handleDispatch(charger)}>派单</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedCharger && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '600px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="card-header">
              <h2>设备健康详情</h2>
              <button className="btn btn-default btn-sm" onClick={() => setShowModal(false)}>关闭</button>
            </div>
            <div className="grid grid-cols-2 gap-16">
              <div className="form-group">
                <label>充电桩编号</label>
                <div style={{ fontFamily: 'monospace' }}>{selectedCharger.charger_code}</div>
              </div>
              <div className="form-group">
                <label>所属充电站</label>
                <div>{selectedCharger.station_name}</div>
              </div>
              <div className="form-group">
                <label>类型/功率</label>
                <div>{getChargerTypeText(selectedCharger.type)} / {selectedCharger.power} kW</div>
              </div>
              <div className="form-group">
                <label>健康评分</label>
                <div>
                  <span className="font-large font-bold" style={{ color: getHealthLevelColor(selectedCharger.health_level) }}>
                    {selectedCharger.health_score}分
                  </span>
                  <span className="status-badge" style={{ marginLeft: '8px', background: getHealthLevelColor(selectedCharger.health_level) + '20', color: getHealthLevelColor(selectedCharger.health_level) }}>
                    {getHealthLevelText(selectedCharger.health_level)}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>运行温度</label>
                <div>{selectedCharger.temperature}°C</div>
              </div>
              <div className="form-group">
                <label>运行状态</label>
                <div>
                  <span className="status-badge" style={{ background: getStatusColor(selectedCharger.status) + '20', color: getStatusColor(selectedCharger.status) }}>
                    {getStatusText(selectedCharger.status)}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>故障代码</label>
                <div style={{ fontFamily: 'monospace', color: selectedCharger.fault_code ? '#ff4d4f' : '#8c8c8c' }}>
                  {selectedCharger.fault_code || '无'}
                </div>
              </div>
              <div className="form-group">
                <label>最后检测时间</label>
                <div>{formatDateTime(selectedCharger.last_check_time)}</div>
              </div>
            </div>
            <div className="form-group">
              <label>健康诊断说明</label>
              <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
                {selectedCharger.health_note || '设备运行正常'}
              </div>
            </div>
            <div className="flex-between">
              <button className="btn btn-default" onClick={() => navigate(`/chargers/${selectedCharger.id}`)}>查看设备详情</button>
              <button className="btn btn-primary" onClick={() => { setShowModal(false); handleDispatch(selectedCharger); }}>立即派单</button>
            </div>
          </div>
        </div>
      )}

      {showDispatchModal && selectedCharger && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
            <div className="card-header">
              <h2>派发工单</h2>
              <button className="btn btn-default btn-sm" onClick={() => setShowDispatchModal(false)}>取消</button>
            </div>
            <div className="alert alert-info">
              设备：{selectedCharger.charger_code} - {selectedCharger.station_name}
            </div>
            <div className="form-group">
              <label>处理人 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <select value={dispatchForm.handler} onChange={(e) => setDispatchForm({ ...dispatchForm, handler: e.target.value })}>
                <option value="">请选择处理人</option>
                <option value="张三">张三</option>
                <option value="李四">李四</option>
                <option value="王五">王五</option>
                <option value="赵六">赵六</option>
              </select>
            </div>
            <div className="form-group">
              <label>问题描述</label>
              <textarea rows="4" value={dispatchForm.description} onChange={(e) => setDispatchForm({ ...dispatchForm, description: e.target.value })} placeholder="请描述设备问题..."></textarea>
            </div>
            <div className="flex-between">
              <button className="btn btn-default" onClick={() => setShowDispatchModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmitDispatch}>确认派单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceHealth;
