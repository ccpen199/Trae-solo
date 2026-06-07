import { useState, useEffect } from 'react';
import api from '../utils/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [creditScores, setCreditScores] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [traceability, setTraceability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showCreditForm, setShowCreditForm] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [creditAdjustment, setCreditAdjustment] = useState({
    action: 'rescue_complete',
    score_change: 5,
    description: '',
  });

  useEffect(() => {
    loadStats();
    loadCreditScores();
    loadHeatmap();
    loadTraceability();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get('/admin/stats');
      setStats(data || {});
    } catch (err) {
      console.error(err);
      setStats({});
    }
  };

  const loadCreditScores = async () => {
    try {
      const data = await api.get('/admin/credit-scores');
      setCreditScores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCreditScores([]);
    }
  };

  const loadHeatmap = async () => {
    try {
      const data = await api.get('/admin/heatmap');
      setHeatmap(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setHeatmap([]);
    }
  };

  const loadTraceability = async () => {
    try {
      const data = await api.get('/parts/traceability');
      setTraceability(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTraceability([]);
    }
  };

  const handleCreditAdjustment = async () => {
    if (!selectedTech || !creditAdjustment.description.trim()) {
      setError('请选择技师并填写调整说明');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/admin/credit-scores/${selectedTech.id}`, creditAdjustment);
      setSuccessMsg('信用分调整成功！');
      setShowCreditForm(false);
      setCreditAdjustment({ action: 'rescue_complete', score_change: 5, description: '' });
      setSelectedTech(null);
      loadCreditScores();
      loadStats();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('调整失败，请重试');
    }
    setLoading(false);
  };

  const getCreditColor = (score) => {
    if (score >= 85) return { text: '#166534', bg: '#dcfce7' };
    if (score >= 70) return { text: '#b45309', bg: '#fef3c7' };
    if (score >= 50) return { text: '#dc2626', bg: '#fee2e2' };
    return { text: '#7f1d1d', bg: '#fecaca' };
  };

  const getHeatmapColor = (count, max) => {
    const ratio = count / max;
    if (ratio >= 0.8) return 'rgba(220, 38, 38, 0.9)';
    if (ratio >= 0.5) return 'rgba(249, 115, 22, 0.8)';
    if (ratio >= 0.3) return 'rgba(245, 158, 11, 0.7)';
    if (ratio >= 0.1) return 'rgba(59, 130, 246, 0.6)';
    return 'rgba(96, 165, 250, 0.4)';
  };

  const getTraceActionLabel = (action) => {
    const labels = {
      factory_out: { label: '出厂', icon: '🏭', color: '#3b82f6' },
      warehouse_in: { label: '入库', icon: '📦', color: '#8b5cf6' },
      warehouse_out: { label: '出库', icon: '🚚', color: '#f59e0b' },
      delivered: { label: '送达', icon: '✅', color: '#10b981' },
      installed: { label: '装车', icon: '🔧', color: '#059669' },
    };
    return labels[action] || { label: action, icon: '📋', color: '#6b7280' };
  };

  const maxHeatmapCount = Math.max(...heatmap.map(h => h.request_count || 0), 1);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#5a5c69' }}>
          ⚙️ 管理后台
        </h1>
        <p style={{ margin: 0, color: '#858796', fontSize: '14px' }}>
          技师信用分 · 救援热力图 · 配件溯源
        </p>
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e3e6f0' }}>
        {[
          { key: 'overview', label: '数据概览', icon: '📊' },
          { key: 'credit', label: '技师信用', icon: '⭐' },
          { key: 'heatmap', label: '热力图', icon: '🔥' },
          { key: 'trace', label: '溯源记录', icon: '🔍' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#4e73df' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#5a5c69',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {[
              { label: '卡车司机', value: stats.users_by_role?.driver || 0, icon: '🚚', color: '#4e73df' },
              { label: '维修技师', value: stats.users_by_role?.technician || 0, icon: '🔧', color: '#1cc88a' },
              { label: '配件供应商', value: stats.users_by_role?.supplier || 0, icon: '🏪', color: '#f6c23e' },
              { label: '培训课程', value: stats.total_courses || 0, icon: '📚', color: '#e74a3b' },
              { label: '救援请求', value: stats.total_rescue_requests || 0, icon: '🚨', color: '#e74a3b' },
              { label: '配件订单', value: stats.total_orders || 0, icon: '🛒', color: '#f6c23e' },
              { label: '社区帖子', value: stats.total_enrollments || stats.users_by_role?.admin || 0, icon: '💬', color: '#36b9cc' },
              { label: '平均信用分', value: stats.avg_credit_score?.toFixed(1) || '-', icon: '⭐', color: '#f59e0b' },
            ].map((item, i) => (
              <div key={i} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${item.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#858796', fontSize: '14px', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#5a5c69', margin: '8px 0 0 0' }}>{item.value}</p>
                  </div>
                  <span style={{ fontSize: '40px' }}>{item.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#5a5c69' }}>📊 救援状态分布</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: '待派单', value: 0, total: 10, color: '#f59e0b' },
                  { label: '已派遣', value: 0, total: 10, color: '#3b82f6' },
                  { label: '救援中', value: 0, total: 10, color: '#ef4444' },
                  { label: '已完成', value: 2, total: 10, color: '#10b981' },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#5a5c69' }}>{item.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(item.value / Math.max(item.total, 1)) * 100}%`,
                        height: '100%',
                        backgroundColor: item.color,
                        borderRadius: '5px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#5a5c69' }}>👥 用户角色分布</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: '卡车司机', value: stats.users_by_role?.driver || 0, color: '#3b82f6' },
                  { label: '维修技师', value: stats.users_by_role?.technician || 0, color: '#10b981' },
                  { label: '配件供应商', value: stats.users_by_role?.supplier || 0, color: '#f59e0b' },
                  { label: '管理员', value: stats.users_by_role?.admin || 0, color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: item.color,
                    }} />
                    <span style={{ flex: 1, color: '#5a5c69', fontSize: '14px' }}>{item.label}</span>
                    <span style={{ fontWeight: '600', color: item.color, fontSize: '18px' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'credit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setShowCreditForm(true)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              ⚙️ 信用分调整
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e6f0' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#5a5c69' }}>⭐ 技师信用分排行</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fc' }}>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>排名</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>技师姓名</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>技能标签</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>认证等级</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>信用分</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {creditScores.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无技师数据</td>
                  </tr>
                ) : (
                  creditScores.map((tech, i) => {
                    const color = getCreditColor(tech.credit_score);
                    return (
                      <tr key={tech.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                        <td style={{ padding: '14px', fontWeight: '600', color: i < 3 ? '#f59e0b' : '#5a5c69', fontSize: '16px' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </td>
                        <td style={{ padding: '14px', fontWeight: '500', color: '#5a5c69' }}>{tech.name || '技师' + tech.id}</td>
                        <td style={{ padding: '14px', fontSize: '13px', color: '#6b7280' }}>
                          {Array.isArray(tech.skill_tags) ? tech.skill_tags.slice(0, 2).join(', ') : '暂无'}
                        </td>
                        <td style={{ padding: '14px', color: '#6b7280', fontSize: '13px' }}>
                          {tech.certification_level === 'senior' ? '高级' : tech.certification_level === 'intermediate' ? '中级' : '初级'}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '6px 14px',
                            backgroundColor: color.bg,
                            color: color.text,
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '16px',
                          }}>
                            {tech.credit_score}
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: tech.availability_status === 'online' ? '#dcfce7' : '#e5e7eb',
                            color: tech.availability_status === 'online' ? '#166534' : '#6b7280',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            {tech.availability_status === 'online' ? '在线' : '离线'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e6f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#5a5c69' }}>🔥 区域救援响应热力图</h2>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {heatmap.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无热力图数据</div>
              ) : (
                heatmap.map((region) => (
                  <div key={region.id} style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: getHeatmapColor(region.request_count, maxHeatmapCount),
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '700', color: 'white' }}>
                      {region.region_name || '未知区域'}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.95)' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.9 }}>救援请求</p>
                        <p style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>{region.request_count}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.9 }}>平均响应</p>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{region.avg_response_minutes}分钟</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trace' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e6f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#5a5c69' }}>🔍 配件流通溯源记录</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fc' }}>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>记录ID</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配件ID</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>动作</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>位置</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>扫码</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作人</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>时间</th>
              </tr>
            </thead>
            <tbody>
              {traceability.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无溯源记录</td>
                </tr>
              ) : (
                traceability.map((record) => {
                  const actionInfo = getTraceActionLabel(record.action);
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                      <td style={{ padding: '14px', fontWeight: '500', color: '#5a5c69' }}>#{record.id}</td>
                      <td style={{ padding: '14px', color: '#5a5c69' }}>{record.part_id}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          backgroundColor: `${actionInfo.color}15`,
                          color: actionInfo.color,
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {actionInfo.icon} {actionInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: '#6b7280', fontSize: '13px' }}>{record.location || '-'}</td>
                      <td style={{ padding: '14px', fontFamily: 'monospace', color: '#6b7280', fontSize: '12px' }}>{record.scan_code || '-'}</td>
                      <td style={{ padding: '14px', color: '#6b7280', fontSize: '13px' }}>{record.operator_id || '系统'}</td>
                      <td style={{ padding: '14px', fontSize: '12px', color: '#858796' }}>
                        {record.created_at ? new Date(record.created_at).toLocaleString('zh-CN') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreditForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>⚙️ 信用分调整</h2>
              <button onClick={() => { setShowCreditForm(false); setSelectedTech(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>选择技师</label>
                <select
                  value={selectedTech?.id || ''}
                  onChange={(e) => setSelectedTech(creditScores.find(t => t.id === parseInt(e.target.value)) || null)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="">请选择技师...</option>
                  {creditScores.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name || '技师' + tech.id} (当前信用分: {tech.credit_score})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>调整类型</label>
                <select
                  value={creditAdjustment.action}
                  onChange={(e) => setCreditAdjustment({ ...creditAdjustment, action: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="rescue_complete">完成救援任务 (+5)</option>
                  <option value="first_fix">一次修好率达标 (+3)</option>
                  <option value="repurchase">客户配件复购 (+2)</option>
                  <option value="course_complete">完成进修课程 (+2)</option>
                  <option value="complaint">客户投诉 (-5)</option>
                  <option value="miss_appointment">爽约 (-3)</option>
                  <option value="bad_quality">维修质量问题 (-10)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>调整分值</label>
                <input
                  type="number"
                  value={creditAdjustment.score_change}
                  onChange={(e) => setCreditAdjustment({ ...creditAdjustment, score_change: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>调整说明</label>
                <textarea
                  placeholder="请详细说明调整原因..."
                  value={creditAdjustment.description}
                  onChange={(e) => setCreditAdjustment({ ...creditAdjustment, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleCreditAdjustment}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '处理中...' : '确认调整'}
              </button>
              <button
                onClick={() => { setShowCreditForm(false); setSelectedTech(null); }}
                style={{
                  flex: 1,
                  padding: '12px',
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
        </div>
      )}
    </div>
  );
};

export default Admin;
