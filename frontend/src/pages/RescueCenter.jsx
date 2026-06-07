import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const RescueCenter = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [rescues, setRescues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [recommendedTechs, setRecommendedTechs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showNewForm, setShowNewForm] = useState(false);
  const [newRescue, setNewRescue] = useState({
    driver_id: 1,
    gps_lat: '39.9042',
    gps_lng: '116.4074',
    vehicle_info: '',
    fault_description: '',
    urgency_level: 'normal',
  });

  const [selectedRescue, setSelectedRescue] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [rescueParts, setRescueParts] = useState([]);
  const [rescueTechDetail, setRescueTechDetail] = useState(null);

  useEffect(() => {
    loadRescues();
    loadTechnicians();
    if (searchParams.get('new') === '1') {
      setShowNewForm(true);
    }
  }, [searchParams]);

  const loadRescues = async () => {
    setLoading(true);
    try {
      const data = await api.get('/rescue');
      setRescues(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('加载救援列表失败');
    }
    setLoading(false);
  };

  const loadTechnicians = async () => {
    try {
      const data = await api.get('/technicians');
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const getRecommendations = async (rescue) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/rescue/dispatch/recommend?lat=${rescue.gps_lat}&lng=${rescue.gps_lng}&radius=100&vehicle_info=${encodeURIComponent(rescue.vehicle_info || '')}&fault_description=${encodeURIComponent(rescue.fault_description || '')}`);
      setRecommendedTechs(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecommendedTechs([]);
    }
    setLoading(false);
  };

  const handleCreateRescue = async () => {
    if (!newRescue.vehicle_info.trim()) {
      setError('请填写车辆信息');
      return;
    }
    if (newRescue.fault_description.trim() === '') {
      setError('请填写故障描述');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/rescue', {
        ...newRescue,
        gps_lat: parseFloat(newRescue.gps_lat),
        gps_lng: parseFloat(newRescue.gps_lng),
      });
      setSuccessMsg('救援请求创建成功！');
      setShowNewForm(false);
      setNewRescue({
        driver_id: 1,
        gps_lat: '39.9042',
        gps_lng: '116.4074',
        vehicle_info: '',
        fault_description: '',
        urgency_level: 'normal',
      });
      loadRescues();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('创建失败，请重试');
    }
    setLoading(false);
  };

  const handleDispatch = async (rescueId, technicianId) => {
    setLoading(true);
    setError('');
    try {
      await api.put(`/rescue/${rescueId}/dispatch`, { technician_id: technicianId });
      setSuccessMsg('派单成功！');
      loadRescues();
      setShowDetail(false);
      setSelectedRescue(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('派单失败');
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (rescueId, action) => {
    setLoading(true);
    try {
      await api.put(`/rescue/${rescueId}/${action}`);
      setSuccessMsg('状态更新成功！');
      loadRescues();
      if (selectedRescue && selectedRescue.id === rescueId) {
        const updated = rescues.find(r => r.id === rescueId);
        if (updated) {
          viewDetail(updated);
        }
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('操作失败');
    }
    setLoading(false);
  };

  const loadRescueParts = async (vehicleInfo) => {
    try {
      const keyword = vehicleInfo.split(' ')[0] || '';
      const data = await api.get(`/parts?search=${encodeURIComponent(keyword)}`);
      setRescueParts(Array.isArray(data) ? data : []);
    } catch (err) {
      setRescueParts([]);
    }
  };

  const loadTechDetail = async (techId) => {
    try {
      const data = await api.get('/technicians');
      const tech = data.find(t => t.id === techId);
      setRescueTechDetail(tech || null);
    } catch (err) {
      setRescueTechDetail(null);
    }
  };

  const viewDetail = async (rescue) => {
    setSelectedRescue(rescue);
    setShowDetail(true);
    setSelectedTech(null);
    setRescueParts([]);
    setRescueTechDetail(null);
    if (rescue.status === 'pending') {
      await getRecommendations(rescue);
      await loadRescueParts(rescue.vehicle_info || '');
    }
    if (rescue.assigned_technician_id) {
      await loadTechDetail(rescue.assigned_technician_id);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404', label: '待派单' },
      dispatched: { bg: '#cce5ff', color: '#004085', label: '已派遣' },
      in_progress: { bg: '#f8d7da', color: '#721c24', label: '救援中' },
      completed: { bg: '#d4edda', color: '#155724', label: '已完成' },
      cancelled: { bg: '#e2e3e5', color: '#383d41', label: '已取消' },
    };
    const s = styles[status] || styles.pending;
    return <span style={{ padding: '4px 12px', backgroundColor: s.bg, color: s.color, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{s.label}</span>;
  };

  const getUrgencyBadge = (level) => {
    const styles = {
      low: { bg: '#d1ecf1', color: '#0c5460', label: '低' },
      normal: { bg: '#d4edda', color: '#155724', label: '普通' },
      high: { bg: '#fff3cd', color: '#856404', label: '高' },
      critical: { bg: '#f8d7da', color: '#721c24', label: '紧急' },
    };
    const s = styles[level] || styles.normal;
    return <span style={{ padding: '4px 10px', backgroundColor: s.bg, color: s.color, borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{s.label}</span>;
  };

  const tabs = [
    { key: 'all', label: '全部救援' },
    { key: 'pending', label: '待派单' },
    { key: 'dispatched', label: '已派遣' },
    { key: 'in_progress', label: '救援中' },
    { key: 'completed', label: '已完成' },
  ];

  const filteredRescues = activeTab === 'all'
    ? rescues
    : rescues.filter(r => r.status === activeTab);

  const renderTimeline = (rescue) => {
    const steps = [];
    steps.push({ label: '创建请求', time: rescue.created_at, done: true, icon: '📋' });
    if (rescue.status === 'dispatched' || rescue.status === 'in_progress' || rescue.status === 'completed') {
      steps.push({ label: '派单', time: rescue.updated_at, done: true, icon: '🤝', person: rescue.technician_name });
    } else if (rescue.status === 'pending') {
      steps.push({ label: '待派单', time: null, done: false, icon: '⏳' });
    }
    if (rescue.status === 'in_progress' || rescue.status === 'completed') {
      steps.push({ label: '开始救援', time: rescue.updated_at, done: true, icon: '🔧' });
    } else if (rescue.status === 'dispatched') {
      steps.push({ label: '等待出发', time: null, done: false, icon: '⏳' });
    }
    if (rescue.status === 'completed') {
      steps.push({ label: '救援完成', time: rescue.completed_at, done: true, icon: '✅' });
    } else if (rescue.status === 'in_progress') {
      steps.push({ label: '进行中', time: null, done: false, icon: '⏳' });
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: step.done ? '#4e73df' : '#e5e7eb',
                color: step.done ? 'white' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold', flexShrink: 0
              }}>
                {step.icon}
              </span>
              {idx < steps.length - 1 && (
                <div style={{ width: '2px', height: '20px', backgroundColor: step.done ? '#4e73df' : '#e5e7eb' }} />
              )}
            </div>
            <div style={{ paddingBottom: '12px' }}>
              <div style={{ fontWeight: '600', color: step.done ? '#5a5c69' : '#9ca3af', fontSize: '14px' }}>
                {step.label}
                {step.person && <span style={{ color: '#4e73df', marginLeft: '8px' }}>→ {step.person}</span>}
              </div>
              {step.time && (
                <div style={{ fontSize: '12px', color: '#858796', marginTop: '2px' }}>
                  {new Date(step.time).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#5a5c69' }}>
            🚨 紧急救援调度中心
          </h1>
          <p style={{ margin: 0, color: '#858796', fontSize: '14px' }}>
            共 {rescues.length} 条救援记录 · 待处理 {rescues.filter(r => r.status === 'pending').length} 条
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          style={{
            padding: '12px 28px',
            backgroundColor: '#e74a3b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(231,74,59,0.3)',
          }}
        >
          发起新救援
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 20px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 20px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px' }}>
          ✅ {successMsg}
        </div>
      )}

      {showNewForm && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px', border: '2px solid #e74a3b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#e74a3b' }}>📋 新建救援请求</h2>
            <button onClick={() => setShowNewForm(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>车辆信息 *</label>
              <input
                type="text"
                placeholder="如：东风天龙 京A12345"
                value={newRescue.vehicle_info}
                onChange={(e) => setNewRescue({ ...newRescue, vehicle_info: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>紧急程度</label>
              <select
                value={newRescue.urgency_level}
                onChange={(e) => setNewRescue({ ...newRescue, urgency_level: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              >
                <option value="low">低 - 不影响行驶</option>
                <option value="normal">普通 - 需要维修</option>
                <option value="high">高 - 影响行驶</option>
                <option value="critical">紧急 - 无法行驶</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>GPS纬度</label>
              <input
                type="text"
                value={newRescue.gps_lat}
                onChange={(e) => setNewRescue({ ...newRescue, gps_lat: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>GPS经度</label>
              <input
                type="text"
                value={newRescue.gps_lng}
                onChange={(e) => setNewRescue({ ...newRescue, gps_lng: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>故障描述 *</label>
            <textarea
              placeholder="详细描述故障情况..."
              value={newRescue.fault_description}
              onChange={(e) => setNewRescue({ ...newRescue, fault_description: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleCreateRescue}
              disabled={loading}
              style={{
                padding: '12px 32px',
                backgroundColor: '#e74a3b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '提交中...' : '提交救援请求'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              style={{
                padding: '12px 32px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e3e6f0' }}>
        {tabs.map((tab) => {
          const count = tab.key === 'all' ? rescues.length : rescues.filter(r => r.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === tab.key ? '#4e73df' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#5a5c69',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : (count > 0 ? '#fee2e2' : '#e3e6f0'),
                color: activeTab === tab.key ? 'white' : (count > 0 && tab.key === 'pending' ? '#dc2626' : '#6b7280'),
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {filteredRescues.length === 0 && activeTab !== 'all' && (
          <div style={{ padding: '16px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '14px', borderBottom: '1px solid #dbeafe', textAlign: 'center' }}>
            当前「{tabs.find(t => t.key === activeTab)?.label}」筛选下没有记录。{activeTab === 'pending' && '点击上方「发起新救援」创建新请求。'}
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fc' }}>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>救援ID</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>车辆信息</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>故障描述</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>紧急程度</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>状态</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>责任人</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>创建时间</th>
              <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRescues.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#858796' }}>
                  {activeTab === 'all' ? '救援服务已连接，等待新的救援请求进入调度队列' : `暂无「${tabs.find(t => t.key === activeTab)?.label}」状态的救援记录`}
                </td>
              </tr>
            ) : (
              filteredRescues.map((rescue) => (
                <tr key={rescue.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                  <td style={{ padding: '14px', fontWeight: '600', color: '#5a5c69' }}>#{rescue.id}</td>
                  <td style={{ padding: '14px', color: '#5a5c69' }}>{rescue.vehicle_info || '-'}</td>
                  <td style={{ padding: '14px', color: '#5a5c69', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rescue.fault_description || '-'}</td>
                  <td style={{ padding: '14px' }}>{getUrgencyBadge(rescue.urgency_level)}</td>
                  <td style={{ padding: '14px' }}>{getStatusBadge(rescue.status)}</td>
                  <td style={{ padding: '14px', color: '#5a5c69', fontSize: '13px' }}>
                    {rescue.technician_name || <span style={{ color: '#dc2626' }}>未派单</span>}
                  </td>
                  <td style={{ padding: '14px', fontSize: '13px', color: '#858796' }}>
                    {rescue.created_at ? new Date(rescue.created_at).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <button
                      onClick={() => viewDetail(rescue)}
                      style={{ padding: '6px 16px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetail && selectedRescue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>
                救援详情 #{selectedRescue.id}
                <span style={{ marginLeft: '12px' }}>{getStatusBadge(selectedRescue.status)}</span>
                <span style={{ marginLeft: '8px' }}>{getUrgencyBadge(selectedRescue.urgency_level)}</span>
              </h2>
              <button onClick={() => { setShowDetail(false); setSelectedRescue(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#5a5c69' }}>📋 基本信息</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#5a5c69' }}>
                  <div><strong>车辆信息：</strong>{selectedRescue.vehicle_info || '-'}</div>
                  <div><strong>司机：</strong>{selectedRescue.driver_name || '-'}</div>
                  <div><strong>GPS坐标：</strong>{selectedRescue.gps_lat}, {selectedRescue.gps_lng}</div>
                  <div><strong>紧急程度：</strong>{getUrgencyBadge(selectedRescue.urgency_level)}</div>
                  <div><strong>当前状态：</strong>{getStatusBadge(selectedRescue.status)}</div>
                  <div><strong>创建时间：</strong>{selectedRescue.created_at ? new Date(selectedRescue.created_at).toLocaleString('zh-CN') : '-'}</div>
                </div>
              </div>
              <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#5a5c69' }}>📝 故障描述</h4>
                <p style={{ margin: 0, color: '#5a5c69', fontSize: '14px', lineHeight: '1.7' }}>{selectedRescue.fault_description || '-'}</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#5a5c69' }}>⏱️ 状态流转时间线</h4>
              {renderTimeline(selectedRescue)}
            </div>

            {selectedRescue.assigned_technician_id && rescueTechDetail && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>👨‍🔧 派单技师详情</h3>
                <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#858796', marginBottom: '4px' }}>技师姓名</div>
                      <div style={{ fontWeight: '600', color: '#1d4ed8', fontSize: '15px' }}>{rescueTechDetail.name || selectedRescue.technician_name || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#858796', marginBottom: '4px' }}>认证等级</div>
                      <div style={{ fontWeight: '600', color: '#5a5c69' }}>
                        {rescueTechDetail.certification_level === 'senior' ? '高级技师' : rescueTechDetail.certification_level === 'intermediate' ? '中级技师' : '初级技师'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#858796', marginBottom: '4px' }}>信用分数</div>
                      <div style={{ fontWeight: '700', color: rescueTechDetail.credit_score >= 80 ? '#16a34a' : '#d97706', fontSize: '18px' }}>{rescueTechDetail.credit_score}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#858796', marginBottom: '4px' }}>技能标签</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(() => {
                          try {
                            return JSON.parse(rescueTechDetail.skill_tags || '[]').map((s, i) => (
                              <span key={i} style={{ padding: '3px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{s}</span>
                            ));
                          } catch { return <span>-</span>; }
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#858796', marginBottom: '4px' }}>车型专精</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(() => {
                          try {
                            return JSON.parse(rescueTechDetail.vehicle_specialties || '[]').map((v, i) => (
                              <span key={i} style={{ padding: '3px 10px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{v}</span>
                            ));
                          } catch { return <span>-</span>; }
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#858796', marginBottom: '4px' }}>在线状态</div>
                      <span style={{ padding: '4px 12px', backgroundColor: rescueTechDetail.availability_status === 'online' ? '#dcfce7' : '#fee2e2', color: rescueTechDetail.availability_status === 'online' ? '#166534' : '#dc2626', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        {rescueTechDetail.availability_status === 'online' ? '🟢 在线' : '🔴 离线'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRescue.status === 'pending' && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>🤝 智能推荐技师（按综合评分排序）</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#858796' }}>加载推荐中...</div>
                ) : recommendedTechs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#858796' }}>暂无推荐技师</div>
                ) : (
                  <div style={{ border: '1px solid #e3e6f0', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fc' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>选择</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>技师</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>距离</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>技能标签</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>车型认证</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>信用分</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>配件可用</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#858796' }}>综合分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendedTechs.map((tech, idx) => {
                          const techFull = technicians.find(t => t.id === tech.technician_id);
                          let skills = [];
                          let vehicles = [];
                          try { skills = JSON.parse(techFull?.skill_tags || '[]'); } catch {}
                          try { vehicles = JSON.parse(techFull?.vehicle_specialties || '[]'); } catch {}
                          return (
                            <tr key={tech.technician_id} style={{
                              borderBottom: '1px solid #e3e6f0',
                              backgroundColor: selectedTech === tech.technician_id ? '#eff6ff' : (idx === 0 ? '#f0fdf4' : 'white')
                            }}>
                              <td style={{ padding: '12px' }}>
                                <input
                                  type="radio"
                                  name="tech"
                                  checked={selectedTech === tech.technician_id}
                                  onChange={() => setSelectedTech(tech.technician_id)}
                                />
                              </td>
                              <td style={{ padding: '12px', fontWeight: '500', color: '#5a5c69' }}>
                                {tech.name}
                                <div style={{ fontSize: '11px', color: '#858796' }}>
                                  {tech.certification_level === 'senior' ? '高级' : tech.certification_level === 'intermediate' ? '中级' : '初级'}技师
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#5a5c69' }}>
                                <span style={{ fontWeight: tech.distance <= 20 ? '700' : '400', color: tech.distance <= 20 ? '#16a34a' : '#5a5c69' }}>
                                  {tech.distance?.toFixed(1)} km
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {skills.map((s, i) => (
                                    <span key={i} style={{
                                      padding: '2px 8px',
                                      backgroundColor: tech.skill_match ? '#dcfce7' : '#e5e7eb',
                                      color: tech.skill_match ? '#166534' : '#6b7280',
                                      borderRadius: '10px', fontSize: '11px', fontWeight: '600'
                                    }}>{s}</span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {vehicles.length > 0 ? vehicles.map((v, i) => (
                                    <span key={i} style={{
                                      padding: '2px 8px',
                                      backgroundColor: tech.vehicle_match ? '#fef3c7' : '#e5e7eb',
                                      color: tech.vehicle_match ? '#b45309' : '#6b7280',
                                      borderRadius: '10px', fontSize: '11px', fontWeight: '600'
                                    }}>{v}</span>
                                  )) : <span style={{ color: '#9ca3af', fontSize: '12px' }}>无</span>}
                                </div>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '600', color: tech.credit_score >= 80 ? '#16a34a' : tech.credit_score >= 60 ? '#d97706' : '#dc2626' }}>
                                {tech.credit_score}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ padding: '4px 10px', backgroundColor: tech.available_parts_count > 0 ? '#dcfce7' : '#fee2e2', color: tech.available_parts_count > 0 ? '#166534' : '#dc2626', borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                                  {tech.available_parts_count} 种
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontWeight: '700', color: '#4e73df', fontSize: '16px' }}>
                                {Math.round(tech.score)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {rescueParts.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0', color: '#5a5c69' }}>📦 车型适配配件库存</h4>
                    <div style={{ border: '1px solid #e3e6f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fc' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#858796' }}>配件编号</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#858796' }}>配件名称</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#858796' }}>分类</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#858796' }}>适配车型</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#858796' }}>库存</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#858796' }}>单价</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rescueParts.slice(0, 8).map((part) => {
                            let compat = [];
                            try { compat = JSON.parse(part.compatible_vehicles || '[]'); } catch {}
                            const stockStyle = part.stock_quantity >= 50
                              ? { bg: '#dcfce7', color: '#166534', label: '充足' }
                              : part.stock_quantity >= 10
                                ? { bg: '#fef3c7', color: '#b45309', label: '紧张' }
                                : { bg: '#fee2e2', color: '#dc2626', label: '不足' };
                            return (
                              <tr key={part.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                                <td style={{ padding: '10px', fontSize: '13px', fontFamily: 'monospace', color: '#5a5c69' }}>{part.part_number}</td>
                                <td style={{ padding: '10px', fontSize: '13px', color: '#5a5c69', fontWeight: '500' }}>{part.name}</td>
                                <td style={{ padding: '10px', fontSize: '12px' }}>
                                  <span style={{ padding: '2px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '10px', fontSize: '11px' }}>{part.category}</span>
                                </td>
                                <td style={{ padding: '10px', fontSize: '12px', color: '#5a5c69' }}>{compat.join(', ')}</td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ padding: '3px 10px', backgroundColor: stockStyle.bg, color: stockStyle.color, borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                                    {part.stock_quantity} ({stockStyle.label})
                                  </span>
                                </td>
                                <td style={{ padding: '10px', fontSize: '13px', color: '#5a5c69', fontWeight: '600' }}>¥{part.price}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => selectedTech && handleDispatch(selectedRescue.id, selectedTech)}
                    disabled={!selectedTech || loading}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: selectedTech ? '#1cc88a' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: selectedTech && !loading ? 'pointer' : 'not-allowed',
                      fontSize: '15px',
                      fontWeight: '600',
                    }}
                  >
                    确认派单 → 技师
                  </button>
                  {!selectedTech && recommendedTechs.length > 0 && (
                    <span style={{ fontSize: '13px', color: '#858796', alignSelf: 'center' }}>请先选择一位技师</span>
                  )}
                </div>
              </div>
            )}

            {selectedRescue.status === 'dispatched' && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>🔧 已派遣技师</h3>
                <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#5a5c69' }}>
                      派单责任人：{selectedRescue.technician_name || '已分配'}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#858796' }}>
                      派单时间：{selectedRescue.updated_at ? new Date(selectedRescue.updated_at).toLocaleString('zh-CN') : '-'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleStatusUpdate(selectedRescue.id, 'start')}
                      style={{ padding: '10px 24px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      开始救援
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedRescue.status === 'in_progress' && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>🛠️ 救援进行中</h3>
                <div style={{ backgroundColor: '#fffbeb', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#5a5c69' }}>
                      技师 {selectedRescue.technician_name || ''} 正在现场处理中...
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#858796' }}>
                      开始时间：{selectedRescue.updated_at ? new Date(selectedRescue.updated_at).toLocaleString('zh-CN') : '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusUpdate(selectedRescue.id, 'complete')}
                    style={{ padding: '10px 24px', backgroundColor: '#1cc88a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    完成救援
                  </button>
                </div>
              </div>
            )}

            {selectedRescue.status === 'completed' && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>✅ 救援完成</h3>
                <div style={{ backgroundColor: '#dcfce7', padding: '20px', borderRadius: '10px' }}>
                  <p style={{ margin: 0, fontWeight: '600', color: '#166534' }}>救援任务已圆满完成！</p>
                  <p style={{ margin: '8px 0 0 0', color: '#166534', fontSize: '14px' }}>
                    完成时间：{selectedRescue.completed_at ? new Date(selectedRescue.completed_at).toLocaleString('zh-CN') : '-'}
                  </p>
                  {selectedRescue.technician_name && (
                    <p style={{ margin: '4px 0 0 0', color: '#166534', fontSize: '14px' }}>
                      救援技师：{selectedRescue.technician_name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div style={{ paddingTop: '20px', borderTop: '1px solid #e3e6f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>📦 配件库存联动</h3>
              {rescueParts.length > 0 ? (
                <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '10px' }}>
                  <p style={{ margin: '0 0 12px 0', color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>
                    ✅ 系统已根据车型「{selectedRescue.vehicle_info?.split(' ')[0] || ''}」匹配到 {rescueParts.length} 种适配配件
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {rescueParts.filter(p => p.stock_quantity > 0).slice(0, 6).map(p => (
                      <span key={p.id} style={{ padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '12px' }}>
                        {p.name} (库存 {p.stock_quantity})
                      </span>
                    ))}
                    {rescueParts.filter(p => p.stock_quantity <= 0).length > 0 && (
                      <span style={{ padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '12px' }}>
                        {rescueParts.filter(p => p.stock_quantity <= 0).length} 种配件库存不足
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '10px' }}>
                  <p style={{ margin: 0, color: '#5a5c69', fontSize: '14px' }}>
                    配件库存信息加载中，或该车型暂无匹配配件记录。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescueCenter;
