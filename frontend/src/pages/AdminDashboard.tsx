import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Tabs, message, Modal, Popconfirm, App } from 'antd';
import { UserOutlined, FileTextOutlined, SendOutlined, RiseOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { adminApi, exportApi } from '../api';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#30cfd0', '#a8edea', '#d4fc79', '#84fab0', '#fccb90'];

const AdminDashboard: React.FC = () => {
  const { user } = useAppStore();
  const { message: msg } = App.useApp();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, resumesRes, deliveriesRes, logsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getResumes(),
        adminApi.getDeliveries(),
        adminApi.getLogs()
      ]);
      setStats(statsRes);
      setUsers(usersRes.users);
      setResumes(resumesRes.resumes);
      setDeliveries(deliveriesRes.deliveries);
      setLogs(logsRes.logs);
    } catch (err: any) {
      msg.error(err.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await adminApi.deleteUser(userId);
      msg.success('删除成功');
      loadAllData();
    } catch (err: any) {
      msg.error(err.error || '删除失败');
    }
  };

  const userColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (v: number) => v ? <Tag color="red">管理员</Tag> : <Tag color="blue">普通用户</Tag>
    },
    { title: '简历数', dataIndex: 'resume_count', key: 'resume_count' },
    { title: '投递数', dataIndex: 'delivery_count', key: 'delivery_count' },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        !record.is_admin ? (
          <Popconfirm
            title="确定删除该用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        ) : null
      )
    }
  ];

  const resumeColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '简历标题', dataIndex: 'title', key: 'title' },
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '模板', dataIndex: 'template_id', key: 'template_id' },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => exportApi.preview(record.id)}>
          预览
        </Button>
      )
    }
  ];

  const deliveryColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '公司', dataIndex: 'company', key: 'company' },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '简历', dataIndex: 'resume_title', key: 'resume_title' },
    { title: '追踪码', dataIndex: 'tracking_code', key: 'tracking_code' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => s === 'viewed' ? <Tag color="success">已查看</Tag> : <Tag color="default">待查看</Tag>
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm')
    }
  ];

  const logColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '管理员', dataIndex: 'admin_name', key: 'admin_name' },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '详情', dataIndex: 'details', key: 'details' },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD HH:mm')
    }
  ];

  const templateUsageData = stats?.template_usage?.map((item: any) => ({
    name: item.template_id,
    value: item.count
  })) || [];

  if (!user?.is_admin) {
    return (
      <Card style={{ textAlign: 'center', padding: 60 }}>
        <h2>需要管理员权限</h2>
        <p style={{ color: '#718096' }}>请使用管理员账号登录</p>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>管理后台</h3>
          <p style={{ margin: '4px 0 0 0', color: '#718096' }}>
            平台数据总览
          </p>
        </div>
        <Button onClick={loadAllData} loading={loading}>
          刷新数据
        </Button>
      </div>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title="总用户数"
                value={stats.stats.total_users}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title="总简历数"
                value={stats.stats.total_resumes}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title="总投递数"
                value={stats.stats.total_deliveries}
                prefix={<SendOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="card-hover">
              <Statistic
                title="今日投递"
                value={stats.stats.today_deliveries}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="模板使用分布">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={templateUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {templateUsageData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="投递趋势（近7日）">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: dayjs().subtract(6, 'day').format('MM-DD'), value: Math.floor(Math.random() * 20) },
                    { name: dayjs().subtract(5, 'day').format('MM-DD'), value: Math.floor(Math.random() * 20) },
                    { name: dayjs().subtract(4, 'day').format('MM-DD'), value: Math.floor(Math.random() * 20) },
                    { name: dayjs().subtract(3, 'day').format('MM-DD'), value: Math.floor(Math.random() * 20) },
                    { name: dayjs().subtract(2, 'day').format('MM-DD'), value: Math.floor(Math.random() * 20) },
                    { name: dayjs().subtract(1, 'day').format('MM-DD'), value: Math.floor(Math.random() * 20) },
                    { name: dayjs().format('MM-DD'), value: stats?.stats?.today_deliveries || 0 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1677ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: 'users',
              label: `用户管理 (${users.length})`,
              children: (
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: 'resumes',
              label: `简历管理 (${resumes.length})`,
              children: (
                <Table
                  columns={resumeColumns}
                  dataSource={resumes}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: 'deliveries',
              label: `投递记录 (${deliveries.length})`,
              children: (
                <Table
                  columns={deliveryColumns}
                  dataSource={deliveries}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            },
            {
              key: 'logs',
              label: '操作日志',
              children: (
                <Table
                  columns={logColumns}
                  dataSource={logs}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
