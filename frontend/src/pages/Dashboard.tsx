import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Button, message, Space } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { taskAPI } from '../services/api';
import { ClaimTask, TASK_STATUS_MAP, TASK_STATUS_COLOR } from '../types';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<ClaimTask[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        taskAPI.getStatistics(),
        taskAPI.getTasks({ pageSize: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.list || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'task_no',
      key: 'task_no',
      width: 120,
    },
    {
      title: '事故地点',
      dataIndex: 'accident_location',
      key: 'accident_location',
      ellipsis: true,
    },
    {
      title: '车主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={TASK_STATUS_COLOR[status]}>{TASK_STATUS_MAP[status]}</Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: ClaimTask) => (
        <Button type="link" onClick={() => navigate(`/tasks/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  const initDemoData = async () => {
    try {
      await taskAPI.initDemoData();
      message.success('演示数据初始化成功');
      loadData();
    } catch (error) {
      message.error('初始化演示数据失败');
    }
  };

  const handleRefresh = () => {
    loadData();
    message.success('数据已刷新');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>工作台</Title>
        <Space>
          <Button onClick={handleRefresh} loading={loading}>
            刷新数据
          </Button>
          <Button type="primary" onClick={initDemoData}>
            初始化演示数据
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理任务"
              value={stats?.by_status?.find((s: any) => s.status === 'pending')?.count || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中任务"
              value={
                (stats?.by_status?.find((s: any) => s.status === 'assigned')?.count || 0) +
                (stats?.by_status?.find((s: any) => s.status === 'surveying')?.count || 0) +
                (stats?.by_status?.find((s: any) => s.status === 'assessing')?.count || 0)
              }
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成任务"
              value={stats?.by_status?.find((s: any) => s.status === 'completed')?.count || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="超期任务"
              value={stats?.overdue || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="最近任务"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/new')}>
            新建任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentTasks}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
