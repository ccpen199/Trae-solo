import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Spin,
  Button,
  Space,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { employerApi } from '../../api';
import {
  Employer,
  Order,
  WorkerRoleMap,
  OrderStatusMap,
  OrderStatusColor,
  FrequencyMap,
} from '../../types';

export default function EmployerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await employerApi.detail(id!);
      setEmployer(result.employer);
      setOrders(result.orders || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => (
        <span style={{ color: '#1677ff', fontFamily: 'monospace' }}>
          {text.slice(0, 8)}...
        </span>
      ),
    },
    {
      title: '订单标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      width: 100,
      render: (role: string) => (
        <Tag color="blue">
          {WorkerRoleMap[role as keyof typeof WorkerRoleMap] || role}
        </Tag>
      ),
    },
    {
      title: '服务阿姨',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 100,
      render: (text: string) => text || <Tag color="default">未分配</Tag>,
    },
    {
      title: '服务频次',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 100,
      render: (freq: string) => FrequencyMap[freq] || freq,
    },
    {
      title: '预算(元)',
      dataIndex: 'budget',
      key: 'budget',
      width: 140,
      render: (_: any, record: Order) => (
        <span>
          {record.budget_min} - {record.budget_max}
        </span>
      ),
    },
    {
      title: '实际金额',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      width: 110,
      render: (amount: number) =>
        amount ? <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{amount}</span> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={OrderStatusColor[status as keyof typeof OrderStatusColor]}>
          {OrderStatusMap[status as keyof typeof OrderStatusMap]}
        </Tag>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
  ];

  const completionRate =
    employer && (employer.total_orders || 0) > 0
      ? (((employer.completed_orders || 0) / (employer.total_orders || 1)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Card
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employers')}>
                  返回列表
                </Button>
                <span style={{ fontSize: 18, fontWeight: 600 }}>
                  <UserOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                  {employer?.name} 的详细信息
                </span>
              </Space>
            </div>
          }
        />

        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="姓名">
              <Space>
                <UserOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 500 }}>{employer?.name}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              <Space>
                <PhoneOutlined style={{ color: '#52c41a' }} />
                <span>{employer?.phone}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="所在城市">
              <Tag color="blue">
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {employer?.city || '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所在区域">
              <Tag color="geekblue">{employer?.district || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="详细地址" span={2}>
              <EnvironmentOutlined style={{ color: '#999', marginRight: 4 }} />
              {employer?.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="经纬度">
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>
                ({employer?.longitude?.toFixed(4) || 0}, {employer?.latitude?.toFixed(4) || 0})
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="家庭人数">
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 500 }}>{employer?.family_members || 0} 人</span>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="订单统计" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Card className="stat-card card-hover" bodyStyle={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>总订单数</div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                      {employer?.total_orders || 0}
                    </div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>单</div>
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#f9f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingCartOutlined style={{ fontSize: 28, color: '#722ed1' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="stat-card card-hover" bodyStyle={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>已完成订单</div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                      {employer?.completed_orders || 0}
                    </div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>单</div>
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#e6fffb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#13c2c2' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="stat-card card-hover" bodyStyle={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>进行中订单</div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                      {(employer?.total_orders || 0) - (employer?.completed_orders || 0)}
                    </div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>单</div>
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#fff7e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#fa8c16' }} />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card className="stat-card card-hover" bodyStyle={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>订单完成率</div>
                    <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
                      {completionRate}%
                    </div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>完成率</div>
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#f6ffed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <ShoppingCartOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                历史订单列表 ({orders.length})
              </span>
            </div>
          }
        >
          <Table
            rowKey="id"
            columns={orderColumns}
            dataSource={orders}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            locale={{ emptyText: '暂无订单记录' }}
            scroll={{ x: 1300 }}
          />
        </Card>
      </Spin>
    </div>
  );
}
