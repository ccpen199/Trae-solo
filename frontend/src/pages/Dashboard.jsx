import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    drivers: 0,
    technicians: 0,
    suppliers: 0,
    courses: 0,
  });
  const [recentRescues, setRecentRescues] = useState([]);
  const [globalKeyword, setGlobalKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [adminData, rescuesData] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/rescue'),
        ]);
        setStats({
          drivers: adminData.users_by_role?.driver || 0,
          technicians: adminData.users_by_role?.technician || 0,
          suppliers: adminData.users_by_role?.supplier || 0,
          courses: adminData.total_courses || 0,
        });
        setRecentRescues(rescuesData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setRecentRescues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      pending: { backgroundColor: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' },
      dispatched: { backgroundColor: '#cce5ff', color: '#004085', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' },
      in_progress: { backgroundColor: '#f8d7da', color: '#721c24', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' },
      completed: { backgroundColor: '#d4edda', color: '#155724', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' },
      cancelled: { backgroundColor: '#e2e3e5', color: '#383d41', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' },
    };
    const labels = {
      pending: '待派单',
      dispatched: '已派遣',
      in_progress: '救援中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return <span style={styles[status] || styles.pending}>{labels[status] || status}</span>;
  };

  const getUrgencyBadge = (level) => {
    const styles = {
      low: { backgroundColor: '#d1ecf1', color: '#0c5460', padding: '4px 8px', borderRadius: '8px', fontSize: '11px' },
      normal: { backgroundColor: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '8px', fontSize: '11px' },
      high: { backgroundColor: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '8px', fontSize: '11px' },
      critical: { backgroundColor: '#f8d7da', color: '#721c24', padding: '4px 8px', borderRadius: '8px', fontSize: '11px' },
    };
    const labels = { low: '低', normal: '普通', high: '高', critical: '紧急' };
    return <span style={styles[level] || styles.normal}>{labels[level] || level}</span>;
  };

  const statCards = [
    { title: '卡车司机', value: stats.drivers, icon: '🚚', color: '#4e73df', path: '/rescue' },
    { title: '维修技师', value: stats.technicians, icon: '🔧', color: '#1cc88a', path: '/rescue' },
    { title: '配件供应商', value: stats.suppliers, icon: '🏪', color: '#f6c23e', path: '/parts' },
    { title: '培训课程', value: stats.courses, icon: '📚', color: '#e74a3b', path: '/courses' },
  ];

  const quickActions = [
    { label: '发起紧急救援', icon: '🚨', path: '/rescue?new=1', color: '#e74a3b' },
    { label: '师徒任务管理', icon: '👨‍🏫', path: '/mentor', color: '#4e73df' },
    { label: '兄弟圈交流', icon: '👥', path: '/community', color: '#1cc88a' },
    { label: '配件查询', icon: '🔧', path: '/parts', color: '#f6c23e' },
  ];

  const submitGlobalSearch = (event) => {
    event.preventDefault();
    const keyword = globalKeyword.trim();
    navigate(keyword ? `/parts?search=${encodeURIComponent(keyword)}` : '/parts');
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '16px', color: '#858796' }}>⏳ 加载中...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#5a5c69' }}>
        欢迎回来，管理员 👋
      </h1>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <form onSubmit={submitGlobalSearch} style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
          <input
            value={globalKeyword}
            onChange={(event) => setGlobalKeyword(event.target.value)}
            placeholder="搜索配件BOM、故障代码、课程、救援工单"
            style={{ flex: 1, padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
          />
          <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            搜索筛选
          </button>
          <button type="button" onClick={() => navigate('/admin')} style={{ padding: '12px 24px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            管理后台
          </button>
        </form>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: '分类发现：配件BOM', path: '/parts' },
            { label: '分类发现：故障代码', path: '/fault-codes' },
            { label: '提交订单：配件采购', path: '/parts' },
            { label: '提交工单：救援调度', path: '/rescue' }
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                color: '#334155',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${card.color}`,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#858796', fontSize: '14px', margin: 0 }}>{card.title}</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#5a5c69', margin: '8px 0 0 0' }}>{card.value}</p>
              </div>
              <span style={{ fontSize: '48px' }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#5a5c69' }}>快捷操作</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                backgroundColor: action.color,
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: `0 2px 8px ${action.color}33`,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '20px' }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>📋 最近救援请求</h2>
          <button
            onClick={() => navigate('/rescue')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#4e73df',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            查看全部 →
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e3e6f0' }}>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>救援ID</th>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>车辆信息</th>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>GPS坐标</th>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>紧急程度</th>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>状态</th>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>创建时间</th>
                <th style={{ textAlign: 'left', padding: '14px', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentRescues.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#858796' }}>
                    暂无救援请求
                  </td>
                </tr>
              ) : (
                recentRescues.map((rescue) => (
                  <tr key={rescue.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                    <td style={{ padding: '14px', color: '#5a5c69', fontWeight: '600' }}>#{rescue.id}</td>
                    <td style={{ padding: '14px', color: '#5a5c69' }}>{rescue.vehicle_info || '-'}</td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '13px', color: '#858796' }}>
                      {rescue.gps_lat?.toFixed(4)}, {rescue.gps_lng?.toFixed(4)}
                    </td>
                    <td style={{ padding: '14px' }}>{getUrgencyBadge(rescue.urgency_level)}</td>
                    <td style={{ padding: '14px' }}>{getStatusBadge(rescue.status)}</td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#858796' }}>
                      {rescue.created_at ? new Date(rescue.created_at).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => navigate('/rescue')}
                        style={{
                          padding: '6px 16px',
                          backgroundColor: '#f3f4f6',
                          color: '#4b5563',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#5a5c69' }}>� 调度依据说明</h3>
          <ul style={{ padding: '0 0 0 20px', margin: 0, color: '#5a5c69', fontSize: '14px', lineHeight: '2' }}>
            <li><strong>GPS定位</strong>：基于Haversine公式计算技师与故障地点距离</li>
            <li><strong>技能标签</strong>：匹配技师专精技能与故障类型</li>
            <li><strong>车型专精</strong>：优先推荐对应车型认证技师</li>
            <li><strong>配件库存</strong>：联动供应商库存确认配件可用性</li>
            <li><strong>信用分数</strong>：高信用分技师优先派单</li>
          </ul>
        </div>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#5a5c69' }}>🔄 业务流程</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { step: 1, text: '司机发起救援请求（GPS+故障描述）' },
              { step: 2, text: '系统智能推荐匹配技师' },
              { step: 3, text: '派单并确认配件库存' },
              { step: 4, text: '技师现场救援与评价' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  backgroundColor: '#4e73df', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {item.step}
                </span>
                <span style={{ color: '#5a5c69', fontSize: '14px' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
