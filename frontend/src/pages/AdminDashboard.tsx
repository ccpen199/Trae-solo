import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Tag, Modal, Form, Input, Select, message, Space } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../api/client';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProviders: number;
  pendingSettlement: number;
  orderTrend: Array<{ date: string; count: number }>;
  heatmapData: Record<string, number>;
}

interface PendingProvider {
  id: number;
  userId: number;
  status: string;
  createdAt: string;
  user: { name: string; phone: string };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    loadStats();
    loadPendingProviders();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      const payload = response.data || {};
      const nextStats = payload.stats ? {
        ...payload.stats,
        orderTrend: payload.orderTrend || [],
        heatmapData: payload.heatmapData || {},
      } : payload;
      setStats({
        totalOrders: Number(nextStats.totalOrders || 0),
        todayOrders: Number(nextStats.todayOrders || 0),
        totalRevenue: Number(nextStats.totalRevenue || 0),
        totalUsers: Number(nextStats.totalUsers || 0),
        totalProviders: Number(nextStats.totalProviders || 0),
        pendingSettlement: Number(nextStats.pendingSettlement || 0),
        orderTrend: Array.isArray(nextStats.orderTrend) ? nextStats.orderTrend : [],
        heatmapData: nextStats.heatmapData || {},
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadPendingProviders = async () => {
    try {
      const response = await api.get('/admin/providers/pending');
      setPendingProviders(response.data.providers || []);
    } catch (error) {
      console.error('Load pending providers error:', error);
    }
  };

  const handleReview = async (values: any) => {
    if (!selectedProvider) return;
    try {
      await api.put(`/admin/providers/${selectedProvider.id}/review`, {
        status: values.status,
        rejectionReason: values.rejectionReason,
      });
      message.success('审核完成');
      setReviewModalVisible(false);
      loadPendingProviders();
      reviewForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '审核失败');
    }
  };

  const trendChartOption = stats ? {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: stats.orderTrend.map(t => t.date) },
    yAxis: { type: 'value' as const },
    series: [{
      data: stats.orderTrend.map(t => t.count),
      type: 'line' as const,
      smooth: true,
      areaStyle: {},
    }],
  } : {};

  const statCards = stats ? [
    { title: '总订单数', value: stats.totalOrders, icon: <FileTextOutlined />, color: '#1890ff' },
    { title: '今日订单', value: stats.todayOrders, icon: <ShoppingOutlined />, color: '#52c41a' },
    { title: '总营收', value: `¥${stats.totalRevenue.toFixed(2)}`, icon: <DollarOutlined />, color: '#faad14' },
    { title: '用户数', value: stats.totalUsers, icon: <UserOutlined />, color: '#722ed1' },
    { title: '服务商数', value: stats.totalProviders, icon: <UserOutlined />, color: '#13c2c2' },
    { title: '待结算', value: `¥${stats.pendingSettlement.toFixed(2)}`, icon: <DollarOutlined />, color: '#eb2f96' },
  ] : [];

  const providerColumns = [
    { title: '姓名', dataIndex: ['user', 'name'], key: 'name' },
    { title: '手机号', dataIndex: ['user', 'phone'], key: 'phone' },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="orange">待审核</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: PendingProvider) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => {
            setSelectedProvider(record);
            reviewForm.setFieldsValue({ status: 'approved' });
            setReviewModalVisible(true);
          }}>
            通过
          </Button>
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => {
            setSelectedProvider(record);
            reviewForm.setFieldsValue({ status: 'rejected' });
            setReviewModalVisible(true);
          }}>
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>运营概览</h1>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((stat, index) => (
          <Col span={4} key={index}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontSize: 24,
                  color: stat.color,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `${stat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {stat.icon}
                </div>
                <div>
                  <Statistic title={stat.title} value={stat.value} />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="订单趋势（近7天）">
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="服务频次热力图">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {stats && Object.entries(stats.heatmapData).slice(-28).map(([date, count]) => (
                <div
                  key={date}
                  style={{
                    height: 32,
                    background: count > 0 ? `rgba(24, 144, 255, ${Math.min(count / 10, 1)})` : '#f0f0f0',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                  }}
                  title={`${date}: ${count}单`}
                >
                  {count > 0 ? count : ''}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="待审核服务商" extra={`${pendingProviders.length} 个待审核`}>
        <Table
          columns={providerColumns}
          dataSource={pendingProviders}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title="服务商审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form form={reviewForm} onFinish={handleReview} layout="vertical">
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select>
              <Select.Option value="approved">通过</Select.Option>
              <Select.Option value="rejected">拒绝</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="rejectionReason" label="拒绝原因">
            <Input.TextArea rows={4} placeholder="请输入拒绝原因（选填）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认审核
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
