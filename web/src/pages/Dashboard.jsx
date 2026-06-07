import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Badge, Button, Progress, Spin, message } from 'antd';
import {
  FileTextOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  SearchOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboard, cases as casesApi } from '../api';

const statusMap = {
  submitted: { text: '已提交', color: 'blue' },
  accepted: { text: '已受理', color: 'cyan' },
  reviewing: { text: '审核中', color: 'orange' },
  supplementing: { text: '补正中', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已退回', color: 'red' },
  completed: { text: '已办结', color: 'green' },
  archived: { text: '已归档', color: 'default' },
  withdrawn: { text: '已撤回', color: 'default' },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, certificates: 0 });
  const [warnings, setWarnings] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, warningsRes, recentRes, deptRes] = await Promise.allSettled([
        dashboard.getStats(),
        dashboard.getTimeoutWarnings(),
        casesApi.getCases({ page: 1, page_size: 5 }),
        dashboard.getDepartmentStats(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        setStats(d?.data || d || {});
      }
      if (warningsRes.status === 'fulfilled') {
        const d = warningsRes.value.data;
        setWarnings(d?.data || d || []);
      }
      if (recentRes.status === 'fulfilled') {
        const d = recentRes.value.data;
        setRecentCases(d?.data?.items || d?.items || []);
      }
      if (deptRes.status === 'fulfilled') {
        const d = deptRes.value.data;
        setDeptStats(d?.data || d || []);
      }
    } catch {
      message.error('获取工作台数据失败');
    } finally {
      setLoading(false);
    }
  };

  const warningColumns = [
    { title: '办件编号', dataIndex: 'case_no', key: 'case_no', width: 160 },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name', width: 100 },
    { title: '事项名称', dataIndex: 'item_name', key: 'item_name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const st = statusMap[s] || { text: s, color: 'default' };
        return <Tag color={st.color}>{st.text}</Tag>;
      },
    },
    {
      title: '剩余时限',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (deadline) => {
        const diff = dayjs(deadline).diff(dayjs(), 'day');
        if (diff < 0) return <Tag color="red">已超期{Math.abs(diff)}天</Tag>;
        if (diff <= 3) return <Tag color="orange">剩余{diff}天</Tag>;
        return <Tag color="green">剩余{diff}天</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => navigate(`/cases/${r.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  const recentColumns = [
    { title: '办件编号', dataIndex: 'case_no', key: 'case_no', width: 160 },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name', width: 100 },
    { title: '事项名称', dataIndex: 'item_name', key: 'item_name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const st = statusMap[s] || { text: s, color: 'default' };
        return <Tag color={st.color}>{st.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const statCards = [
    { title: '办件总数', value: stats.total || 0, icon: <FileTextOutlined />, color: '#1890ff' },
    { title: '待审核', value: stats.pending || 0, icon: <AuditOutlined />, color: '#fa8c16' },
    { title: '已办结', value: stats.completed || 0, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '电子证照', value: stats.certificates || 0, icon: <SafetyCertificateOutlined />, color: '#722ed1' },
  ];

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card hoverable>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={
                  <span style={{ color: card.color, marginRight: 8, fontSize: 24 }}>
                    {card.icon}
                  </span>
                }
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card
            title={
              <span>
                <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                临期预警
              </span>
            }
            extra={<Badge count={warnings.length} />}
          >
            <Table
              columns={warningColumns}
              dataSource={warnings}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无临期办件' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="办件状态分布">
            {deptStats.length > 0 ? (
              deptStats.slice(0, 6).map((dept) => (
                <div key={dept.name || dept.department} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{dept.name || dept.department}</span>
                    <span>{dept.count || dept.total || 0}</span>
                  </div>
                  <Progress
                    percent={Math.min(((dept.count || dept.total || 0) / (stats.total || 1)) * 100, 100)}
                    showInfo={false}
                    strokeColor="#1890ff"
                    size="small"
                  />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card title="最近办件">
            <Table
              columns={recentColumns}
              dataSource={recentCases}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无办件记录' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="快捷操作">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                block
                onClick={() => navigate('/items/create')}
              >
                新办件
              </Button>
              <Button
                icon={<SearchOutlined />}
                size="large"
                block
                onClick={() => navigate('/search')}
              >
                事项检索
              </Button>
              <Button
                icon={<SafetyOutlined />}
                size="large"
                block
                onClick={() => navigate('/certificates')}
              >
                证照查询
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
