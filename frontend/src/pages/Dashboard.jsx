import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Space, Typography } from 'antd';
import { KeyOutlined, AlertOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { rotationApi, credentialApi, incidentApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

function Dashboard({ user }) {
  const [stats, setStats] = useState({});
  const [recentCredentials, setRecentCredentials] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, credRes, incidentRes, rotateRes] = await Promise.all([
        rotationApi.getStats(),
        credentialApi.list(),
        incidentApi.list({ limit: 5 }),
        rotationApi.getReminders({ status: 'unresolved', limit: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentCredentials(credRes.data.credentials.slice(0, 5));
      setRecentIncidents(incidentRes.data.incidents);
      setReminders(rotateRes.data.reminders);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  const statCards = [
    { label: '凭据总数', value: stats.total_credentials || 0, icon: <KeyOutlined />, color: '#1890ff' },
    { label: '待处理提醒', value: stats.pending_reminders || 0, icon: <AlertOutlined />, color: '#faad14' },
    { label: '本周查看', value: stats.recent_views || 0, icon: <EyeOutlined />, color: '#52c41a' },
    { label: '已冻结凭据', value: stats.frozen_credentials || 0, icon: <LockOutlined />, color: '#ff4d4f' },
  ];

  const credColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', render: t => <Tag color="blue">{t}</Tag> },
    { title: '项目', dataIndex: 'project_name', key: 'project' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created', render: d => dayjs(d).format('MM-DD HH:mm') },
  ];

  const incidentColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'incident_type', key: 'type', render: t => <Tag color="red">{t}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => (
      <Tag color={s === 'open' ? 'orange' : s === 'resolved' ? 'green' : 'blue'}>{s}</Tag>
    )},
    { title: '影响凭据', dataIndex: 'affected_credentials', key: 'affected' },
  ];

  return (
    <div>
      <Title level={3}>欢迎回来，{user?.username}</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col span={6} key={i}>
            <Card>
              <Space size={16}>
                <div style={{ fontSize: 32, color: card.color }}>{card.icon}</div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 'bold' }}>{card.value}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>{card.label}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="最近凭据" extra={<a href="#/credentials">查看全部</a>}>
            <Table
              columns={credColumns}
              dataSource={recentCredentials}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="安全事件" extra={<a href="#/incidents">查看全部</a>}>
            <Table
              columns={incidentColumns}
              dataSource={recentIncidents}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {reminders.length > 0 && (
        <Card title="轮换提醒" style={{ marginTop: 16 }} extra={<a href="#/rotation">查看全部</a>}>
          {reminders.map(r => (
            <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Space>
                <Tag color={r.severity === 'critical' ? 'red' : r.severity === 'high' ? 'orange' : 'warning'}>
                  {r.severity}
                </Tag>
                <span>{r.message}</span>
                <span style={{ color: '#999' }}>- {r.credential_title}</span>
              </Space>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
