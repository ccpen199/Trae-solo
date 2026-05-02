import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Spin,
  message,
} from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

interface DashboardData {
  todayVisits: number;
  pendingVisits: number;
  inProgressVisits: number;
  totalPatients: number;
  pendingPrescriptions: number;
  pendingLabOrders: number;
  recentActivities: {
    id: string;
    action: string;
    module: string;
    description: string;
    username: string;
    createdAt: string;
  }[];
}

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/reports/dashboard');
        if (response.success && response.data) {
          setData(response.data as DashboardData);
        }
      } catch (error: any) {
        message.error('获取仪表盘数据失败');
        console.error('Fetch dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activityColumns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colorMap: Record<string, string> = {
          LOGIN: 'blue',
          LOGOUT: 'default',
          CREATE: 'green',
          UPDATE: 'orange',
          DELETE: 'red',
          SIGN: 'purple',
          ARCHIVE: 'cyan',
        };
        const labelMap: Record<string, string> = {
          LOGIN: '登录',
          LOGOUT: '登出',
          CREATE: '创建',
          UPDATE: '更新',
          DELETE: '删除',
          SIGN: '签名',
          ARCHIVE: '归档',
        };
        return <Tag color={colorMap[action] || 'default'}>{labelMap[action] || action}</Tag>;
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日就诊"
              value={data?.todayVisits || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待诊患者"
              value={data?.pendingVisits || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="诊疗中"
              value={data?.inProgressVisits || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="患者总数"
              value={data?.totalPatients || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card
            title={
              <span>
                <MedicineBoxOutlined style={{ marginRight: 8 }} />
                待处理处方
              </span>
            }
            hoverable
          >
            <Statistic
              value={data?.pendingPrescriptions || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            title={
              <span>
                <FileTextOutlined style={{ marginRight: 8 }} />
                待处理检查
              </span>
            }
            hoverable
          >
            <Statistic
              value={data?.pendingLabOrders || 0}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                最近活动
              </span>
            }
          >
            <Table
              dataSource={data?.recentActivities || []}
              columns={activityColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default DashboardPage;
