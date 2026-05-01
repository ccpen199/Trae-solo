import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Descriptions,
  Space,
  Popconfirm,
  message,
  Statistic,
  Row,
  Col,
  Form,
  InputNumber,
  Select,
  DatePicker
} from 'antd';
import {
  ShoppingOutlined,
  EyeOutlined,
  RedoOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { orderApi } from '@/services/api';
import { getOrderStatusBadgeProps } from '@/stores/store';
import { useAuthStore } from '@/stores/authStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const { data: orders, isLoading } = useQuery(
    ['orders', pagination.current, pagination.pageSize],
    () => orderApi.listOrders({
      page: pagination.current,
      limit: pagination.pageSize
    }),
    {
      onSuccess: (data) => {
        setPagination(prev => ({ ...prev, total: data.total }));
      }
    }
  );

  const payMutation = useMutation(
    (orderId: string) => orderApi.payOrder(orderId),
    {
      onSuccess: () => {
        message.success('支付成功');
        queryClient.invalidateQueries(['orders']);
        setSelectedOrder(null);
      },
      onError: () => {
        message.error('支付失败，请重试');
      }
    }
  );

  const refundMutation = useMutation(
    ({ orderId, refundStrategy }: { orderId: string; refundStrategy: string }) =>
      orderApi.refundOrder(orderId, refundStrategy),
    {
      onSuccess: () => {
        message.success('退款成功，优惠券已退回');
        queryClient.invalidateQueries(['orders']);
        setSelectedOrder(null);
      },
      onError: () => {
        message.error('退款失败，请重试');
      }
    }
  );

  const totalAmount = orders?.data?.reduce((sum: number, o: any) => sum + o.finalAmount, 0) || 0;
  const totalDiscount = orders?.data?.reduce((sum: number, o: any) => sum + o.discountAmount, 0) || 0;

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{text}</span>
      )
    },
    {
      title: '原金额',
      dataIndex: 'originalAmount',
      key: 'originalAmount',
      render: (val: number) => `¥${val.toFixed(2)}`
    },
    {
      title: '优惠金额',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (val: number) => (
        <span style={{ color: '#ff4d4f' }}>-¥{val.toFixed(2)}</span>
      )
    },
    {
      title: '实付金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      render: (val: number) => <strong>¥{val.toFixed(2)}</strong>
    },
    {
      title: '使用优惠券',
      dataIndex: 'appliedCoupons',
      key: 'appliedCoupons',
      render: (coupons: string[]) => (
        <span>
          {coupons && coupons.length > 0 ? (
            <Tag color="blue">{coupons.length}张</Tag>
          ) : (
            <Tag>无</Tag>
          )}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const badge = getOrderStatusBadgeProps(status);
        return <Tag color={badge.color}>{badge.text}</Tag>;
      },
      filters: [
        { text: '待支付', value: 'pending' },
        { text: '已支付', value: 'paid' },
        { text: '已发货', value: 'shipped' },
        { text: '已完成', value: 'delivered' },
        { text: '已退款', value: 'refunded' },
        { text: '已取消', value: 'cancelled' }
      ],
      onFilter: (value: string, record: any) => record.status === value
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedOrder(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              type="primary"
              onClick={() => payMutation.mutate(record.id)}
            >
              支付
            </Button>
          )}
          {record.status === 'paid' && (
            <Popconfirm
              title="确认退款"
              description="退款后优惠券将按规则退回，是否继续？"
              onConfirm={() =>
                refundMutation.mutate({
                  orderId: record.id,
                  refundStrategy: 'full'
                })
              }
              okText="确认退款"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<RedoOutlined />}
              >
                退款
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={orders?.total || 0}
              prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="实付总额"
              value={totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="优惠总额"
              value={totalDiscount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待支付"
              value={orders?.data?.filter((o: any) => o.status === 'pending').length || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="订单管理">
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginBottom: 16 }}
          onFinish={(values) => console.log('Search:', values)}
        >
          <Form.Item name="orderNo">
            <InputNumber
              placeholder="订单号"
              style={{ width: 200 }}
              addonBefore={<SearchOutlined />}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态筛选" style={{ width: 150 }} allowClear>
              <Select.Option value="pending">待支付</Select.Option>
              <Select.Option value="paid">已支付</Select.Option>
              <Select.Option value="shipped">已发货</Select.Option>
              <Select.Option value="delivered">已完成</Select.Option>
              <Select.Option value="refunded">已退款</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => searchForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={orders?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        width={700}
        footer={[
          selectedOrder?.status === 'pending' && (
            <Button
              key="pay"
              type="primary"
              onClick={() => payMutation.mutate(selectedOrder.id)}
              loading={payMutation.isLoading}
            >
              立即支付
            </Button>
          ),
          selectedOrder?.status === 'paid' && (
            <Popconfirm
              title="确认退款"
              description="退款后优惠券将按规则退回，是否继续？"
              onConfirm={() =>
                refundMutation.mutate({
                  orderId: selectedOrder.id,
                  refundStrategy: 'full'
                })
              }
              okText="确认退款"
              cancelText="取消"
            >
              <Button
                key="refund"
                danger
                loading={refundMutation.isLoading}
              >
                申请退款
              </Button>
            </Popconfirm>
          ),
          <Button key="close" onClick={() => setSelectedOrder(null)}>
            关闭
          </Button>
        ]}
      >
        {selectedOrder && (
          <div>
            <Card size="small" title="订单信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="订单号">
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {selectedOrder.orderNo}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  {(() => {
                    const badge = getOrderStatusBadgeProps(selectedOrder.status);
                    return <Tag color={badge.color}>{badge.text}</Tag>;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="原金额">
                  ¥{selectedOrder.originalAmount.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="优惠金额">
                  <span style={{ color: '#ff4d4f' }}>
                    -¥{selectedOrder.discountAmount.toFixed(2)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="实付金额" span={2}>
                  <span style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                    ¥{selectedOrder.finalAmount.toFixed(2)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="使用优惠券">
                  {selectedOrder.appliedCoupons && selectedOrder.appliedCoupons.length > 0 ? (
                    <div>
                      {selectedOrder.appliedCoupons.map((id: string, index: number) => (
                        <Tag key={index} color="blue" style={{ marginRight: 4 }}>
                          {id.substring(0, 8)}...
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Tag>无</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="门店ID">
                  {selectedOrder.storeId || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="时间线">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="创建时间">
                  {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                {selectedOrder.paidAt && (
                  <Descriptions.Item label="支付时间">
                    {dayjs(selectedOrder.paidAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
                {selectedOrder.deliveredAt && (
                  <Descriptions.Item label="完成时间">
                    {dayjs(selectedOrder.deliveredAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
                {selectedOrder.refundedAt && (
                  <Descriptions.Item label="退款时间">
                    {dayjs(selectedOrder.refundedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
