import React, { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Space, Card, Modal, Form, Input,
  Select, Typography, Timeline, Descriptions, Row, Col,
  message, Empty, InputNumber, Image, List, Statistic
} from 'antd';
import {
  EyeOutlined, ExportOutlined, FileImageOutlined,
  ArrowLeftOutlined, ReloadOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { orderApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG (无损)' },
  { value: 'jpg', label: 'JPG (有损)' },
  { value: 'webp', label: 'WebP (高效)' },
  { value: 'svg', label: 'SVG (矢量)' }
];

const EXPORT_QUALITIES = [
  { value: 100, label: '最高质量 (100%)' },
  { value: 90, label: '高质量 (90%)' },
  { value: 80, label: '标准质量 (80%)' },
  { value: 60, label: '低质量 (60%)' }
];

function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [statistics, setStatistics] = useState({
    pending: 0,
    todayExported: 0,
    totalExported: 0
  });
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  useEffect(() => {
    loadPendingExports();
    loadStatistics();
  }, []);

  const loadPendingExports = async () => {
    setLoading(true);
    try {
      const response = await orderApi.list({ status: 'pending_export' });
      setOrders(response.data);
    } catch (error) {
      console.error('加载待导出订单失败:', error);
      message.error('加载待导出列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await orderApi.getStatistics();
      const stats = response.data || {};
      setStatistics({
        pending: stats.pending_export || 0,
        todayExported: 0,
        totalExported: stats.published || 0
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadOrderDetail = async (orderId) => {
    try {
      const response = await orderApi.getById(orderId);
      setOrderDetail(response.data);
    } catch (error) {
      console.error('加载订单详情失败:', error);
      message.error('加载订单详情失败');
    }
  };

  const handleViewDetail = async (order) => {
    setSelectedOrder(order);
    await loadOrderDetail(order.id);
    setDetailModalVisible(true);
  };

  const handleOpenExport = async (order) => {
    setSelectedOrder(order);
    await loadOrderDetail(order.id);
    form.setFieldsValue({
      format: 'png',
      quality: 90,
      width: order.canvas_width,
      height: order.canvas_height,
      watermark: false,
      watermarkText: ''
    });
    setExportModalVisible(true);
  };

  const handleSubmitExport = async (values) => {
    if (!selectedOrder) return;

    try {
      await orderApi.exportImage(selectedOrder.id, {
        format: values.format,
        width: values.width,
        height: values.height,
        quality: values.quality,
        watermark: values.watermark,
        watermarkText: values.watermarkText
      });
      message.success('导出成功，订单已进入发布环节');
      setExportModalVisible(false);
      loadPendingExports();
      loadStatistics();
    } catch (error) {
      console.error('导出失败:', error);
      message.error(error.response?.data?.error || '导出失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
      width: 160
    },
    {
      title: '画布名称',
      dataIndex: 'canvas_name',
      key: 'canvas_name',
      width: 150
    },
    {
      title: '画布尺寸',
      key: 'size',
      width: 120,
      render: (_, record) => (
        <Text type="secondary">
          {record.canvas_width} x {record.canvas_height}
        </Text>
      )
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      width: 100,
      render: (text) => text || <Text type="secondary">未分配</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_NAMES[status]}
        </Tag>
      )
    },
    {
      title: '预期完成时间',
      dataIndex: 'expected_completion_time',
      key: 'expected_completion_time',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => handleOpenExport(record)}
          >
            导出
          </Button>
        </Space>
      )
    }
  ];

  const order = orderDetail?.order;
  const layers = orderDetail?.layers || [];
  const exports = orderDetail?.exports || [];
  const timeline = orderDetail?.timeline || [];
  const orderTemplates = orderDetail?.orderTemplates || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>导出管理</Title>
        <Button icon={<ReloadOutlined />} onClick={() => {
          loadPendingExports();
          loadStatistics();
        }}>
          刷新
        </Button>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="待导出"
              value={statistics.pending}
              prefix={<ExportOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="今日导出"
              value={statistics.todayExported}
              prefix={<FileImageOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="累计发布"
              value={statistics.totalExported}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条待导出记录`
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: <Empty description="暂无待导出的订单" />
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>订单详情 - {order?.order_no}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<ExportOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              setExportModalVisible(true);
            }}
          >
            立即导出
          </Button>
        ]}
        width={900}
      >
        {order && (
          <Row gutter={24}>
            <Col xs={24} lg={14}>
              <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
                  <Descriptions.Item label="画布名称">{order.canvas_name}</Descriptions.Item>
                  <Descriptions.Item label="画布尺寸">
                    {order.canvas_width} x {order.canvas_height} px
                  </Descriptions.Item>
                  <Descriptions.Item label="背景颜色">{order.canvas_background}</Descriptions.Item>
                  <Descriptions.Item label="创建人">{order.creator_name}</Descriptions.Item>
                  <Descriptions.Item label="负责人">{order.assignee_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {order.created_at ? dayjs(order.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {layers.length > 0 && (
                <Card title="图层列表" size="small" style={{ marginBottom: 16 }}>
                  <List
                    dataSource={layers}
                    size="small"
                    renderItem={(layer) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text strong>{layer.layer_name}</Text>
                              <Tag size="small">{layer.layer_type}</Tag>
                              {layer.is_locked && <Tag color="orange" size="small">锁定</Tag>}
                            </Space>
                          }
                          description={
                            <Text type="secondary">
                              位置: ({layer.position_x}, {layer.position_y}) | 
                              尺寸: {layer.width} x {layer.height}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {orderTemplates.length > 0 && (
                <Card title="应用模板" size="small" style={{ marginBottom: 16 }}>
                  {orderTemplates.map((ot, index) => (
                    <div key={index} style={{ marginBottom: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                      <Space>
                        <Text strong>{ot.template_name}</Text>
                        <Tag color={ot.status === 'approved' ? 'success' : 'warning'}>
                          {ot.status === 'approved' ? '已通过' : '待审核'}
                        </Tag>
                      </Space>
                    </div>
                  ))}
                </Card>
              )}

              {exports.length > 0 && (
                <Card title="历史导出记录" size="small">
                  <List
                    dataSource={exports}
                    size="small"
                    renderItem={(exp) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <FileImageOutlined />
                              <Text>{exp.file_name}</Text>
                              <Tag>{exp.export_format.toUpperCase()}</Tag>
                            </Space>
                          }
                          description={
                            <Text type="secondary">
                              {exp.export_width} x {exp.export_height} | 
                              导出人: {exp.exported_by_name} | 
                              {dayjs(exp.exported_at).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Col>

            <Col xs={24} lg={10}>
              <Card title="操作时间轴" size="small">
                <Timeline
                  style={{ maxHeight: 500, overflow: 'auto' }}
                  items={timeline.map((item, index) => ({
                    key: index,
                    children: (
                      <div>
                        <Text strong>{item.action}</Text>
                        {item.comment && (
                          <p style={{ margin: '4px 0', color: '#666', fontSize: 12 }}>{item.comment}</p>
                        )}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.user_name || '系统'} | {dayjs(item.created_at).format('MM-DD HH:mm')}
                        </Text>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <ExportOutlined style={{ color: '#1890ff' }} />
            <span>导出配置 - {order?.order_no}</span>
          </Space>
        }
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitExport}
          initialValues={{
            format: 'png',
            quality: 90,
            watermark: false
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="format"
                label="导出格式"
                rules={[{ required: true, message: '请选择导出格式' }]}
              >
                <Select options={EXPORT_FORMATS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="quality"
                label="导出质量"
                rules={[{ required: true, message: '请选择导出质量' }]}
              >
                <Select options={EXPORT_QUALITIES} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>画布尺寸</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="width"
                label="宽度 (px)"
                rules={[
                  { required: true, message: '请输入宽度' },
                  { type: 'number', min: 1, message: '宽度必须大于0' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="height"
                label="高度 (px)"
                rules={[
                  { required: true, message: '请输入高度' },
                  { type: 'number', min: 1, message: '高度必须大于0' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>水印设置（可选）</Divider>

          <Form.Item
            name="watermark"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={false}>不添加水印</Select.Option>
              <Select.Option value={true}>添加文字水印</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="watermarkText"
            label="水印文字"
            dependencies={['watermark']}
            rules={[
              ({ getFieldValue }) => ({
                required: getFieldValue('watermark') === true,
                message: '请输入水印文字'
              })
            ]}
          >
            <Input placeholder="例如：公司名称、版权信息等" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setExportModalVisible(false)}>取消</Button>
              <Button type="primary" icon={<ExportOutlined />} htmlType="submit">
                确认导出并发布
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ExportPage;
