import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Table, Tag, Typography, 
  Spin, message, Space, Avatar
} from 'antd';
import { 
  UserOutlined, ShopOutlined, CameraOutlined, 
  ShoppingOutlined, DollarOutlined, ClockCircleOutlined,
  MessageOutlined, TrophyOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { adminAPI } from '../../api/index.js';

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    stats: {},
    recent_orders: [],
    top_merchants: []
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.dashboard();
      setData(response.data);
    } catch (error) {
      message.error('获取数据看板失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const orderColumns = [
    {
      title: '订单编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Text strong>#100{id}</Text>
    },
    {
      title: '服务名称',
      dataIndex: 'service_name',
      key: 'service_name',
      ellipsis: true
    },
    {
      title: '商家',
      dataIndex: 'company_name',
      key: 'company_name',
      ellipsis: true
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong style={{ color: '#ff4d6d' }}>¥{amount?.toLocaleString()}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          0: <Tag color="default">待付款</Tag>,
          1: <Tag color="processing">已付款</Tag>,
          2: <Tag color="success">已完成</Tag>,
          3: <Tag color="error">已取消</Tag>
        };
        return statusMap[status] || <Tag>未知</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    }
  ];

  const merchantColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => {
        const colors = ['#ff4d6d', '#fa8c16', '#faad14'];
        return (
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            background: index < 3 ? colors[index] : '#d9d9d9',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            margin: '0 auto'
          }}>
            {index + 1}
          </div>
        );
      }
    },
    {
      title: '商家',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (name, record) => (
        <Space>
          <Avatar size={40} src={record.logo} icon={<ShopOutlined />} />
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '类目',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        const categoryMap = {
          photography: '婚纱摄影',
          emcee: '司仪主持',
          hotel: '婚宴酒店',
          wedding_dress: '婚纱礼服'
        };
        return <Tag color="blue">{categoryMap[category] || category}</Tag>;
      }
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => <Text strong style={{ color: '#fa8c16' }}>{rating}</Text>
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      render: (count) => <Text strong>{count || 0}</Text>
    }
  ];

  const statsCards = [
    {
      title: '总用户数',
      value: data.stats.total_users || 0,
      icon: <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      color: '#e6f7ff',
      borderColor: '#91d5ff'
    },
    {
      title: '入驻商家',
      value: data.stats.total_merchants || 0,
      icon: <ShopOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    {
      title: '服务数量',
      value: data.stats.total_services || 0,
      icon: <CameraOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#f9f0ff',
      borderColor: '#d3adf7'
    },
    {
      title: '总订单数',
      value: data.stats.total_orders || 0,
      icon: <ShoppingOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      color: '#fff7e6',
      borderColor: '#ffd591'
    },
    {
      title: '交易总额',
      value: `¥${(data.stats.total_amount || 0).toLocaleString()}`,
      icon: <DollarOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      color: '#fff0f6',
      borderColor: '#ffadd2'
    },
    {
      title: '待处理事项',
      value: (data.stats.pending_merchants || 0) + (data.stats.pending_reviews || 0),
      icon: <ClockCircleOutlined style={{ fontSize: 32, color: '#ff4d6d' }} />,
      color: '#fff1f0',
      borderColor: '#ffa39e',
      subText: `待审核商家 ${data.stats.pending_merchants || 0} | 待审核评论 ${data.stats.pending_reviews || 0}`
    }
  ];

  const orderChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单数', '交易额']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left'
      },
      {
        type: 'value',
        name: '交易额(万)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: [120, 190, 150, 220, 280, 350],
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: '交易额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [45, 68, 55, 82, 95, 120],
        itemStyle: { color: '#ff4d6d' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 77, 109, 0.3)' },
              { offset: 1, color: 'rgba(255, 77, 109, 0.05)' }
            ]
          }
        }
      }
    ]
  };

  const categoryChartOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '服务类目分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '婚纱摄影', itemStyle: { color: '#ff4d6d' } },
          { value: 25, name: '婚宴酒店', itemStyle: { color: '#1890ff' } },
          { value: 20, name: '婚纱礼服', itemStyle: { color: '#52c41a' } },
          { value: 12, name: '司仪主持', itemStyle: { color: '#fa8c16' } },
          { value: 8, name: '其他', itemStyle: { color: '#722ed1' } }
        ]
      }
    ]
  };

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          数据看板
        </Title>
        <Text type="secondary">平台运营数据概览，实时监控关键指标</Text>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsCards.map((card, index) => (
            <Col xs={24} sm={12} md={8} lg={4} key={index}>
              <Card
                style={{
                  background: card.color,
                  borderRadius: 12,
                  border: `1px solid ${card.borderColor}`,
                  height: '100%'
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>
                    <Statistic
                      value={card.value}
                      valueStyle={{ fontSize: 24, fontWeight: 700, color: '#333', lineHeight: 1.2 }}
                    />
                    {card.subText && (
                      <Text type="secondary" style={{ fontSize: 11 }}>{card.subText}</Text>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              title="订单趋势"
              style={{ borderRadius: 12 }}
              extra={<Tag color="blue">近6个月</Tag>}
            >
              <ReactECharts option={orderChartOption} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="服务类目分布"
              style={{ borderRadius: 12 }}
            >
              <ReactECharts option={categoryChartOption} style={{ height: 320 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={<Space><MessageOutlined style={{ color: '#1890ff' }} />最近订单</Space>}
              style={{ borderRadius: 12 }}
            >
              <Table
                columns={orderColumns}
                dataSource={data.recent_orders}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={<Space><TrophyOutlined style={{ color: '#faad14' }} />商家排行榜</Space>}
              style={{ borderRadius: 12 }}
            >
              <Table
                columns={merchantColumns}
                dataSource={data.top_merchants}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AdminDashboard;
