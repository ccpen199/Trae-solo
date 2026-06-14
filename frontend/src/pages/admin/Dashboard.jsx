import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

function AdminDashboard({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    userStats: {},
    taskStats: {},
    orderStats: {},
    settlementStats: {},
    pendingCounts: {},
    heatmap: [],
    regionDemand: [],
    categoryDemand: [],
    topEmployers: [],
    recentTasks: [],
    recentOrders: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, heatmap, region, daily] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/stats/heatmap'),
        api.get('/admin/stats/region-demand'),
        api.get('/admin/stats/daily?days=7')
      ]);

      setData({
        ...dashboard.data,
        heatmap: heatmap.data?.data || [],
        regionDemand: region.data?.regionDemand || [],
        categoryDemand: region.data?.categoryDemand || [],
        dailyStats: daily.data
      });
    } catch (error) {
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '注册用户', value: data.userStats?.total_users || 0, icon: '👥', color: '#667eea', link: '/admin/users' },
    { label: '企业雇主', value: data.userStats?.employer_count || 0, icon: '🏢', color: '#764ba2', link: '/admin/employers' },
    { label: '任务总数', value: data.taskStats?.total_tasks || 0, icon: '📋', color: '#f093fb', link: '/admin/tasks' },
    { label: '完成订单', value: data.orderStats?.completed_orders || 0, icon: '✅', color: '#4facfe' },
    { label: '平台营收', value: `¥${data.settlementStats?.total_platform_fee?.toFixed(2) || '0.00'}`, icon: '💰', color: '#43e97b' },
    { label: '待审核任务', value: data.pendingCounts?.reviews || 0, icon: '⏳', color: '#fa709a', link: '/admin/task-review' },
    { label: '待实名认证', value: data.pendingCounts?.verifications || 0, icon: '🆔', color: '#fee140', link: '/admin/verifications' },
    { label: '待处理申诉', value: data.pendingCounts?.appeals || 0, icon: '⚖️', color: '#30cfd0', link: '/admin/appeals' }
  ];

  const todayStats = [
    { label: '今日新增用户', value: data.dailyStats?.dailyUsers?.[0]?.new_workers || 0 },
    { label: '今日发布任务', value: data.dailyStats?.dailyTasks?.[0]?.new_tasks || 0 },
    { label: '今日完成订单', value: data.dailyStats?.dailyOrders?.[0]?.new_orders || 0 },
    { label: '用户认证率', value: data.userStats?.total_users ? `${Math.round((data.userStats.verified_users / data.userStats.total_users) * 100)}%` : '0%' }
  ];

  const creditRatingColors = {
    'A': '#43e97b',
    'B': '#4facfe',
    'C': '#f093fb',
    'D': '#fa709a',
    'E': '#94a3b8'
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>管理看板</h1>
      
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {statCards.map((stat, index) => (
          <div key={index} className="card" style={{ cursor: stat.link ? 'pointer' : 'default' }}
               onClick={() => {
                 if (stat.link) {
                   window.location.href = stat.link;
                 }
               }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                background: `${stat.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {stat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
              {stat.link && <div style={{ fontSize: '20px', color: '#cbd5e1' }}>→</div>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {todayStats.map((stat, index) => (
          <div key={index} className="card" style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}>
            <div style={{ fontSize: '13px', color: '#667eea', marginBottom: '8px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>用户类型分布</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: '在校学生', value: data.userStats?.student_count || 0, color: '#667eea' },
              { label: '居家宝妈', value: data.userStats?.homemaker_count || 0, color: '#f093fb' },
              { label: '兼职上班族', value: data.userStats?.parttime_count || 0, color: '#4facfe' }
            ].map((item, index) => {
              const total = (data.userStats?.student_count || 0) + (data.userStats?.homemaker_count || 0) + (data.userStats?.parttime_count || 0);
              const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    border: `8px solid ${item.color}`,
                    borderTopColor: '#e2e8f0',
                    transform: 'rotate(-90deg)',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: item.color
                  }}>
                    <span style={{ transform: 'rotate(90deg)' }}>{percent}%</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.value}人</div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>任务类型分布</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: '线上任务', value: data.taskStats?.online_tasks || 0, color: '#43e97b' },
              { label: '线下任务', value: data.taskStats?.offline_tasks || 0, color: '#fa709a' },
              { label: '混合任务', value: data.taskStats?.hybrid_tasks || 0, color: '#fee140' }
            ].map((item, index) => {
              const total = (data.taskStats?.online_tasks || 0) + (data.taskStats?.offline_tasks || 0) + (data.taskStats?.hybrid_tasks || 0);
              const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%',
                    border: `8px solid ${item.color}`,
                    borderTopColor: '#e2e8f0',
                    transform: 'rotate(-90deg)',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: item.color
                  }}>
                    <span style={{ transform: 'rotate(90deg)' }}>{percent}%</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.value}个</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', margin: 0 }}>雇主信用看板</h3>
          <Link to="/admin/employers" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '13px' }}>查看全部</Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['A', 'B', 'C', 'D', 'E'].map(rating => (
            <div key={rating} className="card" style={{ 
              flex: 1, 
              minWidth: '100px',
              background: `${creditRatingColors[rating]}15`,
              border: `1px solid ${creditRatingColors[rating]}40`,
              textAlign: 'center',
              padding: '16px 12px'
            }}>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 700, 
                color: creditRatingColors[rating],
                marginBottom: '4px'
              }}>
                {rating}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>信用等级</div>
            </div>
          ))}
          <div className="card" style={{ 
            flex: 2, 
            minWidth: '200px',
            background: '#f8fafc',
            padding: '16px'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>任务生命周期状态</div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {[
                { label: '待审核', value: data.taskStats?.pending_tasks || 0, color: '#f59e0b' },
                { label: '进行中', value: data.orderStats?.in_progress_orders || 0, color: '#3b82f6' },
                { label: '抽检中', value: data.orderStats?.reviewing_orders || 0, color: '#8b5cf6' },
                { label: '已完成', value: data.taskStats?.completed_tasks || 0, color: '#10b981' }
              ].map((item, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>履约热力图 TOP 10</span>
            <Link to="/admin/stats" style={{ fontSize: '13px', color: '#667eea' }}>查看详情 →</Link>
          </div>
          {data.heatmap && data.heatmap.length > 0 ? (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>用户</th>
                    <th>地区</th>
                    <th>完成数</th>
                    <th>收入</th>
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.slice(0, 10).map((worker, idx) => (
                    <tr key={worker.id}>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx < 3 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#e2e8f0',
                          color: idx < 3 ? 'white' : '#64748b',
                          textAlign: 'center',
                          lineHeight: '24px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{worker.real_name || worker.username}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{worker.location || '-'}</td>
                      <td style={{ fontWeight: 600, color: '#43e97b' }}>{worker.completed_orders}</td>
                      <td style={{ fontWeight: 600, color: '#667eea' }}>¥{worker.total_earned?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>暂无数据</div>
          )}
        </div>
        
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>区域供需统计</span>
            <Link to="/admin/stats" style={{ fontSize: '13px', color: '#667eea' }}>查看详情 →</Link>
          </div>
          {data.regionDemand && data.regionDemand.length > 0 ? (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>区域</th>
                    <th>类型</th>
                    <th>任务数</th>
                    <th>需求缺口</th>
                  </tr>
                </thead>
                <tbody>
                  {data.regionDemand.slice(0, 10).map((region, idx) => {
                    const gap = (region.total_positions || 0) - (region.accepted_count || 0);
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{region.region}</td>
                        <td>
                          <span className={`task-type task-type-${region.task_type}`}>
                            {region.task_type === 'online' ? '线上' : region.task_type === 'offline' ? '线下' : '混合'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{region.task_count}</td>
                        <td>
                          <span style={{ 
                            color: gap > 0 ? '#f59e0b' : '#10b981',
                            fontWeight: 600
                          }}>
                            {gap > 0 ? `缺${gap}人` : '已饱和'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>暂无数据</div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>最近发布的任务</span>
            <Link to="/admin/tasks" style={{ fontSize: '13px', color: '#667eea' }}>全部任务 →</Link>
          </div>
          {data.dailyStats?.dailyTasks && data.dailyStats.dailyTasks.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>新增任务</th>
                  <th>总预算</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyStats.dailyTasks.slice(0, 7).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{item.date}</td>
                    <td style={{ fontWeight: 600, color: '#667eea' }}>{item.new_tasks}</td>
                    <td style={{ fontWeight: 600, color: '#43e97b' }}>¥{item.total_budget?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>暂无数据</div>
          )}
        </div>
        
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>异常申诉待处理</span>
            <Link to="/admin/appeals" style={{ fontSize: '13px', color: '#667eea' }}>处理申诉 →</Link>
          </div>
          {data.pendingCounts?.appeals > 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px',
                fontWeight: 700,
                color: '#fa709a',
                marginBottom: '8px'
              }}>
                {data.pendingCounts.appeals}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                条申诉等待处理
              </div>
              <Link to="/admin/appeals" className="btn btn-primary" style={{ padding: '10px 32px' }}>
                立即处理
              </Link>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <div style={{ color: '#10b981', fontWeight: 500 }}>暂无待处理申诉</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>所有申诉已处理完毕</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
