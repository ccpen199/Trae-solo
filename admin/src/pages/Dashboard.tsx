import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Statistic } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats, getDailyStats, getRetentionStats } from '../services/api';

const COLORS = ['#667eea', '#11998e', '#f5576c', '#4facfe', '#f093fb'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [retention, setRetention] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, d, r] = await Promise.all([getDashboardStats(), getDailyStats(7), getRetentionStats()]);
      setStats(s);
      setDailyStats(d);
      setRetention(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    { label: '总用户数', value: stats.totalUsers || 0, color: '', icon: '👥' },
    { label: '今日新增', value: stats.todayNewUsers || 0, color: 'green', icon: '📈' },
    { label: '今日活跃', value: stats.todayActiveUsers || 0, color: 'orange', icon: '🔥' },
    { label: '总发放金币', value: (stats.totalCoinsEarned || 0).toLocaleString(), color: 'blue', icon: '💰' },
  ];

  const retentionData = Object.entries(retention).map(([key, v]: [string, any]) => ({
    name: key.replace('day', 'D') + '留存',
    新增: v?.newUsers || 0,
    留存: v?.retainedUsers || 0,
  }));

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 24 }}>📊 数据看板</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <div className={`stat-card ${card.color}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div className="label">{card.label}</div>
                  <div className="value">{card.value}</div>
                </div>
                <div style={{ fontSize: 40, opacity: 0.8 }}>{card.icon}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="💸 累计提现金额(元)" value={stats.totalWithdrawalAmount || 0} precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="💵 今日提现(元)" value={stats.todayWithdrawalAmount || 0} precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="🤝 累计邀请数" value={stats.totalInvitations || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title="🎯 邀请转化率" value={stats.conversionRate || '0%'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="📈 7日用户趋势" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#11998e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#11998e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="newUsers" name="新增用户" stroke="#667eea" fillOpacity={1} fill="url(#c1)" />
                <Area type="monotone" dataKey="activeUsers" name="活跃用户" stroke="#11998e" fillOpacity={1} fill="url(#c2)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🔁 留存分析" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="新增" fill="#667eea" />
                <Bar dataKey="留存" fill="#38ef7d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="💰 7日金币发放与提现" size="small">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="coinsEarned" name="发放金币" stroke="#f5576c" strokeWidth={2} />
                <Line type="monotone" dataKey="withdrawalAmount" name="提现金额(元)" stroke="#4facfe" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🏷️ 留存率分布" size="small">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={Object.entries(retention).map(([k, v]: [string, any]) => ({
                    name: k.replace('day', 'D') + '留存',
                    value: parseFloat(v?.rate || '0'),
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={(e) => `${e.name} ${e.value}%`}
                >
                  {retentionData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v + '%'} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
