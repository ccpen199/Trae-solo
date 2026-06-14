import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, hasRole } = useAuth();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/manager/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      setError('加载数据失败: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => {
    const actions = [
      { key: 'tm-search', name: '商标检索', desc: 'AI近似风险评估', icon: '🔍', path: '/trademarks/search', color: '#1890ff' },
      { key: 'tm-apply', name: '注册申请', desc: '在线提交商标申请', icon: '📝', path: '/trademarks/search', color: '#52c41a' },
      { key: 'tm-alerts', name: '风险预警', desc: '进度异常监控', icon: '⚠️', path: '/trademarks/alerts', color: '#faad14' },
      { key: 'pt-fees', name: '年费提醒', desc: '专利年费管理', icon: '💳', path: '/patents/fees', color: '#722ed1' },
      { key: 'cr-evidence', name: '版权存证', desc: '区块链取证', icon: '🔗', path: '/copyrights/evidence', color: '#13c2c2' },
      { key: 'cr-bulk', name: '批量登记', desc: '批量版权登记', icon: '📦', path: '/copyrights/bulk', color: '#eb2f96' }
    ];

    if (hasRole('lawfirm', 'agency')) {
      actions.push(
        { key: 'mg-clients', name: '客户管理', desc: '客户绑定与管理', icon: '👥', path: '/manager/clients', color: '#f5222d' },
        { key: 'mg-cases', name: '案件管理', desc: '案件时间轴', icon: '📋', path: '/manager/cases', color: '#fa8c16' }
      );
    }

    return actions;
  };

  const formatValue = (value) => {
    if (!value) return '¥0';
    if (value >= 10000) {
      return '¥' + (value / 10000).toFixed(1) + '万';
    }
    return '¥' + value.toLocaleString();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>加载中...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  const statCards = [
    { label: '商标总数', value: summary?.counts?.trademarks || 0, color: '#1890ff', path: '/trademarks' },
    { label: '专利总数', value: summary?.counts?.patents || 0, color: '#52c41a', path: '/patents' },
    { label: '版权总数', value: summary?.counts?.copyrights || 0, color: '#722ed1', path: '/copyrights' },
    { label: '案件总数', value: summary?.counts?.cases || 0, color: '#fa8c16', path: '/manager/cases' }
  ];

  if (hasRole('lawfirm', 'agency')) {
    statCards.push(
      { label: '客户总数', value: summary?.counts?.clients || 0, color: '#f5222d', path: '/manager/clients' },
      { label: '合同总数', value: summary?.counts?.contracts || 0, color: '#13c2c2', path: '/manager/contracts' }
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.welcome}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>欢迎回来，{user?.name}！</h1>
          <p style={{ margin: 0, color: '#8c8c8c' }}>今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div style={styles.welcomeStats}>
          <div>
            <div style={styles.welcomeValue}>{summary?.active?.trademarks || 0}</div>
            <div style={styles.welcomeLabel}>有效商标</div>
          </div>
          <div>
            <div style={styles.welcomeValue}>{summary?.active?.patents || 0}</div>
            <div style={styles.welcomeLabel}>授权专利</div>
          </div>
          <div>
            <div style={styles.welcomeValue}>{summary?.active?.cases || 0}</div>
            <div style={styles.welcomeLabel}>在办案件</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>核心业务概览</h3>
        <div style={styles.statsGrid}>
          {statCards.map((card) => (
            <Link key={card.label} to={card.path} style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: card.color + '15', color: card.color }}>
                {card.label.includes('商标') && '™️'}
                {card.label.includes('专利') && '💡'}
                {card.label.includes('版权') && '©️'}
                {card.label.includes('案件') && '📋'}
                {card.label.includes('客户') && '👥'}
                {card.label.includes('合同') && '📄'}
              </div>
              <div style={styles.statValue}>{card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {summary?.alerts && (summary.alerts.highRiskTrademarks > 0 || summary.alerts.upcomingFees > 0) && (
        <div style={{ ...styles.card, borderLeft: '4px solid #faad14' }}>
          <h3 style={styles.cardTitle}>⚠️ 待处理预警</h3>
          <div style={styles.alertGrid}>
            {summary.alerts.highRiskTrademarks > 0 && (
              <Link to="/trademarks/alerts" style={styles.alertItem}>
                <span style={styles.alertIcon}>🔴</span>
                <div>
                  <div style={{ fontWeight: '600' }}>高风险商标</div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>{summary.alerts.highRiskTrademarks} 个商标需要关注</div>
                </div>
              </Link>
            )}
            {summary.alerts.upcomingFees > 0 && (
              <Link to="/patents/fees" style={styles.alertItem}>
                <span style={styles.alertIcon}>🟡</span>
                <div>
                  <div style={{ fontWeight: '600' }}>年费即将到期</div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px' }}>{summary.alerts.upcomingFees} 项年费30日内到期</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {summary?.totalPatentValue > 0 && (
        <div style={{ ...styles.card, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
          <h3 style={{ ...styles.cardTitle, color: '#fff' }}>💰 知识产权资产估值</h3>
          <div style={{ fontSize: '36px', fontWeight: '700', margin: '12px 0' }}>
            {formatValue(summary.totalPatentValue)}
          </div>
          <div style={{ opacity: 0.85 }}>专利资产预估总价值（仅供参考）</div>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>快捷入口</h3>
        <div style={styles.quickActions}>
          {getQuickActions().map((action) => (
            <Link key={action.key} to={action.path} style={styles.quickAction}>
              <div style={{ ...styles.quickIcon, background: action.color + '15', color: action.color }}>
                {action.icon}
              </div>
              <div style={styles.quickName}>{action.name}</div>
              <div style={styles.quickDesc}>{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {summary?.recentNotifications && summary.recentNotifications.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📢 最新通知</h3>
          <div style={styles.notificationList}>
            {summary.recentNotifications.map((notif) => (
              <div key={notif.id} style={styles.notificationItem}>
                <div style={styles.notificationIcon}>
                  {notif.type === 'fee_reminder' && '💳'}
                  {notif.type === 'case_update' && '📋'}
                  {notif.type === 'trademark_alert' && '⚠️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{notif.title}</div>
                  <div style={{ color: '#8c8c8c', fontSize: '13px', marginTop: '4px' }}>{notif.message}</div>
                </div>
                <div style={{ color: '#bfbfbf', fontSize: '12px' }}>
                  {new Date(notif.created_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <Link to="/notifications" style={{ color: '#1890ff', textDecoration: 'none', fontSize: '13px' }}>
              查看全部 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  welcome: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  welcomeStats: {
    display: 'flex',
    gap: '40px'
  },
  welcomeValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1890ff'
  },
  welcomeLabel: {
    fontSize: '13px',
    color: '#8c8c8c',
    marginTop: '4px'
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#262626'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px'
  },
  statCard: {
    padding: '20px',
    borderRadius: '10px',
    background: '#fafafa',
    textDecoration: 'none',
    color: 'inherit',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 12px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#262626'
  },
  statLabel: {
    fontSize: '13px',
    color: '#8c8c8c',
    marginTop: '4px'
  },
  alertGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#fffbe6',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit'
  },
  alertIcon: {
    fontSize: '24px'
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px'
  },
  quickAction: {
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #f0f0f0',
    textDecoration: 'none',
    color: 'inherit',
    textAlign: 'center',
    transition: 'all 0.2s'
  },
  quickIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 12px'
  },
  quickName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#262626'
  },
  quickDesc: {
    fontSize: '12px',
    color: '#8c8c8c',
    marginTop: '4px'
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '8px'
  },
  notificationIcon: {
    fontSize: '24px',
    width: '40px',
    textAlign: 'center'
  }
};
