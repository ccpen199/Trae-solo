import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminQuality() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/quality-metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (value, thresholds, reverse = false) => {
    if (reverse) {
      if (value <= thresholds[0]) return '#52c41a';
      if (value <= thresholds[1]) return '#faad14';
      return '#ff4d4f';
    } else {
      if (value >= thresholds[0]) return '#52c41a';
      if (value >= thresholds[1]) return '#faad14';
      return '#ff4d4f';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h2 style={{ marginBottom: '24px' }}>货运质量监控中心</h2>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>核心指标</h3>
        <div className="grid grid-3">
          <div style={{ textAlign: 'center', padding: '30px', borderRadius: '12px', background: '#f6ffed' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: getColorClass(metrics?.on_time_rate || 0, [95, 85]) }}>
              {metrics?.on_time_rate || 0}%
            </div>
            <div style={{ marginTop: '8px', color: '#666' }}>准时率</div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
              {metrics?.on_time_rate >= 95 ? '✅ 优秀' : metrics?.on_time_rate >= 85 ? '⚠️ 良好' : '❌ 需要改进'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '30px', borderRadius: '12px', background: '#fff7e6' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: getColorClass(metrics?.complaint_rate || 0, [2, 5], true) }}>
              {metrics?.complaint_rate || 0}%
            </div>
            <div style={{ marginTop: '8px', color: '#666' }}>投诉率</div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
              {metrics?.complaint_rate <= 2 ? '✅ 优秀' : metrics?.complaint_rate <= 5 ? '⚠️ 关注' : '❌ 需处理'}
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '30px', borderRadius: '12px', background: '#f9f0ff' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: getColorClass(metrics?.damage_rate || 0, [1, 3], true) }}>
              {metrics?.damage_rate || 0}%
            </div>
            <div style={{ marginTop: '8px', color: '#666' }}>货损率</div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
              {metrics?.damage_rate <= 1 ? '✅ 优秀' : metrics?.damage_rate <= 3 ? '⚠️ 关注' : '❌ 需改进'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>预警监控</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {metrics?.on_time_rate < 85 && (
            <div style={{ padding: '16px', background: '#fff1f0', borderRadius: '8px', borderLeft: '4px solid #ff4d4f' }}>
              <strong>⚠️ 准时率预警：</strong>
              当前准时率 {metrics?.on_time_rate}%，低于阈值85%，请关注运力调度情况。
            </div>
          )}
          {metrics?.complaint_rate > 5 && (
            <div style={{ padding: '16px', background: '#fff1f0', borderRadius: '8px', borderLeft: '4px solid #ff4d4f' }}>
              <strong>⚠️ 投诉率预警：</strong>
              当前投诉率 {metrics?.complaint_rate}%，超过阈值5%，请及时处理用户投诉。
            </div>
          )}
          {metrics?.damage_rate > 3 && (
            <div style={{ padding: '16px', background: '#fff1f0', borderRadius: '8px', borderLeft: '4px solid #ff4d4f' }}>
              <strong>⚠️ 货损率预警：</strong>
              当前货损率 {metrics?.damage_rate}%，超过阈值3%，请加强司机培训。
            </div>
          )}
          {metrics?.on_time_rate >= 85 && metrics?.complaint_rate <= 5 && metrics?.damage_rate <= 3 && (
            <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '8px', borderLeft: '4px solid #52c41a' }}>
              <strong>✅ 运行正常：</strong>
              所有指标均在正常范围内，继续保持！
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>趋势分析</h3>
        <div className="grid grid-3" style={{ gap: '12px' }}>
          <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>{metrics?.total_orders || 0}</div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>统计周期总订单</div>
          </div>
          <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{Math.round((metrics?.on_time_rate || 0) / 100 * (metrics?.total_orders || 0))}</div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>准时完成订单</div>
          </div>
          <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
              {Math.round((metrics?.complaint_rate || 0) / 100 * (metrics?.total_orders || 0))}
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>投诉订单数</div>
          </div>
        </div>
      </div>
    </div>
  );
}
