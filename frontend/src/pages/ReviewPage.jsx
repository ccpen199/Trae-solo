import React, { useEffect, useState } from 'react';
import {
  Table, Tag, Button, Space, Card, Modal, Form, Input,
  Select, Typography, Timeline, Descriptions, Row, Col,
  message, Empty
} from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
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

const REVIEW_ACTIONS = {
  approved: { label: '通过', color: 'success', icon: <CheckOutlined /> },
  rejected: { label: '驳回', color: 'error', icon: <CloseOutlined /> },
  supplement: { label: '补充资料', color: 'warning' },
  reassign: { label: '转派', color: 'default' }
};

function ReviewPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    setLoading(true);
    try {
      const response = await orderApi.list({ status: 'pending_template' });
      setOrders(response.data);
    } catch (error) {
      console.error('加载待审核订单失败:', error);
      message.error('加载待审核列表失败');
    } finally {
      setLoading(false);
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

  const handleOpenReview = async (order, action) => {
    setSelectedOrder(order);
    setReviewAction(action);
    form.setFieldsValue({
      comment: '',
      reason: action === 'rejected' ? '不符合要求' : '',
      assignee: null
    });
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    if (!selectedOrder) return;

    try {
      await orderApi.reviewTemplate(selectedOrder.id, {
        action: reviewAction,
        comment: values.comment,
        reason: values.reason,
        assigneeId: values.assignee
      });
      message.success(`操作成功：${REVIEW_ACTIONS[reviewAction]?.label}`);
      setReviewModalVisible(false);
      loadPendingReviews();
    } catch (error) {
      console.error('审核操作失败:', error);
      message.error(error.response?.data?.error || '审核操作失败');
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
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
            icon={<CheckOutlined />}
            onClick={() => handleOpenReview(record, 'approved')}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleOpenReview(record, 'rejected')}
          >
            驳回
          </Button>
          <Button
            size="small"
            onClick={() => handleOpenReview(record, 'supplement')}
          >
            补充资料
          </Button>
          <Button
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleOpenReview(record, 'reassign')}
          >
            转派
          </Button>
        </Space>
      )
    }
  ];

  const order = orderDetail?.order;
  const orderTemplates = orderDetail?.orderTemplates || [];
  const timeline = orderDetail?.timeline || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>模板审核</Title>
        <Button onClick={loadPendingReviews}>刷新</Button>
      </div>

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
            showTotal: (total) => `共 ${total} 条待审核记录`
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: <Empty description="暂无待审核的订单" />
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
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              handleOpenReview(selectedOrder, 'approved');
            }}
          >
            通过
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              handleOpenReview(selectedOrder, 'rejected');
            }}
          >
            驳回
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
                  <Descriptions.Item label="创建人">{order.creator_name}</Descriptions.Item>
                  <Descriptions.Item label="负责人">{order.assignee_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {order.created_at ? dayjs(order.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {orderTemplates.length > 0 && (
                <Card title="模板应用记录" size="small" style={{ marginBottom: 16 }}>
                  {orderTemplates.map((ot, index) => (
                    <div key={index} style={{ marginBottom: 12, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                      <Space style={{ marginBottom: 8 }}>
                        <Text strong>模板: {ot.template_name}</Text>
                        <Tag color={ot.status === 'approved' ? 'success' : 'warning'}>
                          {ot.status === 'approved' ? '已通过' : ot.status === 'pending' ? '待审核' : '已驳回'}
                        </Tag>
                      </Space>
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary">申请人: {ot.applied_by_name}</Text>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary">
                          申请时间: {dayjs(ot.applied_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </div>
                      {ot.review_comment && (
                        <div>
                          <Text type="secondary">审核意见: {ot.review_comment}</Text>
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </Col>

            <Col xs={24} lg={10}>
              <Card title="操作时间轴" size="small">
                <Timeline
                  style={{ maxHeight: 400, overflow: 'auto' }}
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
            {reviewAction === 'approved' && <CheckOutlined style={{ color: '#52c41a' }} />}
            {reviewAction === 'rejected' && <CloseOutlined style={{ color: '#ff4d4f' }} />}
            <span>
              {reviewAction === 'approved' && '审核通过'}
              {reviewAction === 'rejected' && '驳回申请'}
              {reviewAction === 'supplement' && '要求补充资料'}
              {reviewAction === 'reassign' && '转派任务'}
            </span>
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitReview}
        >
          {reviewAction === 'rejected' && (
            <Form.Item
              name="reason"
              label="驳回原因"
              rules={[{ required: true, message: '请选择驳回原因' }]}
            >
              <Select placeholder="请选择驳回原因">
                <Select.Option value="不符合设计规范">不符合设计规范</Select.Option>
                <Select.Option value="图片质量问题">图片质量问题</Select.Option>
                <Select.Option value="缺少必要素材">缺少必要素材</Select.Option>
                <Select.Option value="文案错误">文案错误</Select.Option>
                <Select.Option value="其他问题">其他问题</Select.Option>
              </Select>
            </Form.Item>
          )}

          {reviewAction === 'reassign' && (
            <Form.Item
              name="assignee"
              label="转派给"
              rules={[{ required: true, message: '请选择转派对象' }]}
            >
              <Select placeholder="请选择负责人">
                <Select.Option value="design_op">设计运营</Select.Option>
                <Select.Option value="creator">创作者</Select.Option>
                <Select.Option value="editor">编辑</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="comment"
            label="审核意见"
            rules={[
              {
                required: reviewAction === 'rejected' || reviewAction === 'supplement',
                message: '请填写审核意见'
              }
            ]}
          >
            <TextArea
              rows={4}
              placeholder={
                reviewAction === 'approved'
                  ? '请填写通过意见（可选）'
                  : reviewAction === 'rejected'
                  ? '请详细说明驳回原因...'
                  : reviewAction === 'supplement'
                  ? '请说明需要补充哪些资料...'
                  : '请说明转派原因...'
              }
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
              <Button
                type={reviewAction === 'rejected' ? 'primary' : 'primary'}
                danger={reviewAction === 'rejected'}
                htmlType="submit"
              >
                确认{REVIEW_ACTIONS[reviewAction]?.label || '操作'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ReviewPage;
