import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Typography } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { orderApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  pending_upload: 'default',
  pending_edit: 'processing',
  pending_template: 'warning',
  pending_export: 'orange',
  published: 'success',
  cancelled: 'default',
  rejected: 'error'
};

const STATUS_NAMES = {
  pending_upload: '待上传',
  pending_edit: '待编辑',
  pending_template: '待套模板',
  pending_export: '待导出',
  published: '已发布',
  cancelled: '已取消',
  rejected: '已驳回'
};

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        orderApi.getStatistics(),
        orderApi.list()
      ]);
      
      setStatistics(statsResponse.data);
      setRecentOrders(ordersResponse.data.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '画布名称',
      dataIndex: 'canvas_name',
      key: 'canvas_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_NAMES[status]}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ];

  const getStatusCount = (status) => {
    return statistics?.byStatus?.[status] || 0;
  };

  const totalOrders = Object.values(statistics?.byStatus || {}).reduce((a, b) => a + b, 0);
  const completedOrders = getStatusCount('published');
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        仪表盘 - 欢迎回来，{user?.nickname || user?.username}
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="card-hover">
            <Statistic
              title="总订单数"
              value={totalOrders}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="card-hover">
            <Statistic
              title="待处理"
              value={getStatusCount('pending_edit') + getStatusCount('pending_template') + getStatusCount('pending_export')}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="card-hover">
            <Statistic
              title="进行中"
              value={getStatusCount('pending_edit') + getStatusCount('pending_template') + getStatusCount('pending_export')}
              prefix={<EditOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable className="card-hover">
            <Statistic
              title="已完成"
              value={completedOrders}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最近订单"
            className="card-hover"
            extra={<a href="#/orders">查看全部</a>}
          >
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="完成进度" className="card-hover">
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={completionRate}
                format={(percent) => `${percent}%`}
                prefix={<RiseOutlined />}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  已完成 {completedOrders} / {totalOrders} 个订单
                </Text>
              </div>
            </div>
            
            <div>
              <Text strong style={{ marginBottom: 16, display: 'block' }}>状态分布</Text>
              {Object.entries(STATUS_NAMES).map(([code, name]) => {
                const count = getStatusCount(code);
                const percent = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                return (
                  <div key={code} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color={STATUS_COLORS[code]}>{name}</Tag>
                      <Text type="secondary">{count} 个 ({percent}%)</Text>
                    </div>
                    <Progress
                      percent={percent}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
