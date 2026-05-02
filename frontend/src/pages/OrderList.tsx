import React, { useState } from 'react';
import { Table, Card, Tag, Button, Space, Select, Modal, Form, Input, message, Descriptions, Divider } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { orderApi } from '../services/api';
import { Order, OrderStatus } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    role: undefined as string | undefined,
    page: 1,
    pageSize: 10,
  });
  const [actionModal, setActionModal] = useState<{ visible: boolean; type: string; order: Order | null }>({
    visible: false,
    type: '',
    order: null,
  });
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params: any = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.role) params.role = filters.role;
      const response = await orderApi.getList(params);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, action, data }: { id: string; action: string; data?: any }) => {
      let response;
      switch (action) {
        case 'pay':
          response = await orderApi.pay(id);
          break;
        case 'deliver':
          response = await orderApi.deliver(id, data.deliveryInfo);
          break;
        case 'confirm':
          response = await orderApi.confirm(id);
          break;
        case 'cancel':
          response = await orderApi.cancel(id, data?.cancelReason);
          break;
        default:
          throw new Error('未知操作');
      }
      return response.data;
    },
    onSuccess: () => {
      message.success('操作成功');
      setActionModal({ visible: false, type: '', order: null });
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '操作失败');
    },
  });

  const handleAction = (action: string, order: Order) => {
    if (action === 'pay') {
      Modal.confirm({
        title: '确认支付',
        content: `确定要支付 ¥${order.price} 吗？`,
        onOk: () => updateMutation.mutate({ id: order.id, action: 'pay' }),
      });
    } else if (action === 'confirm') {
      Modal.confirm({
        title: '确认收货',
        content: '确认收到账号并登录无误后，请点击确认。确认后款项将转给卖家。',
        onOk: () => updateMutation.mutate({ id: order.id, action: 'confirm' }),
      });
    } else {
      setActionModal({ visible: true, type: action, order });
    }
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (actionModal.order) {
        updateMutation.mutate({
          id: actionModal.order.id,
          action: actionModal.type,
          data: values,
        });
      }
    });
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (orderNo: string, record: Order) => (
        <a onClick={() => navigate(`/orders/${record.id}`)}>{orderNo}</a>
      ),
    },
    {
      title: '账号名称',
      dataIndex: ['account', 'title'],
      key: 'accountTitle',
      ellipsis: true,
    },
    {
      title: '游戏',
      dataIndex: ['account', 'gameName'],
      key: 'gameName',
      width: 100,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => <strong style={{ color: '#ff4d4f' }}>¥{price}</strong>,
    },
    {
      title: '买家',
      dataIndex: ['buyer', 'username'],
      key: 'buyer',
      width: 100,
    },
    {
      title: '卖家',
      dataIndex: ['seller', 'username'],
      key: 'seller',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => {
        const colorMap: Record<OrderStatus, string> = {
          PENDING_PAYMENT: 'orange',
          PENDING_DELIVERY: 'blue',
          PENDING_CONFIRM: 'cyan',
          COMPLETED: 'success',
          CANCELED: 'default',
          EXCEPTION: 'red',
        };
        const statusText: Record<OrderStatus, string> = {
          PENDING_PAYMENT: '待支付',
          PENDING_DELIVERY: '待发货',
          PENDING_CONFIRM: '待确认',
          COMPLETED: '已完成',
          CANCELED: '已取消',
          EXCEPTION: '异常',
        };
        return <Tag color={colorMap[status]}>{statusText[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Order) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'PENDING_PAYMENT' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleAction('pay', record)}
            >
              支付
            </Button>
          )}
          {record.status === 'PENDING_DELIVERY' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleAction('deliver', record)}
            >
              发货
            </Button>
          )}
          {record.status === 'PENDING_CONFIRM' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAction('confirm', record)}
            >
              确认收货
            </Button>
          )}
          {['PENDING_PAYMENT', 'PENDING_DELIVERY', 'PENDING_CONFIRM'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleAction('cancel', record)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <Select
            placeholder="选择订单角色"
            allowClear
            style={{ width: 150 }}
            onChange={(val) => setFilters((prev) => ({ ...prev, role: val, page: 1 }))}
          >
            <Option value="buyer">我是买家</Option>
            <Option value="seller">我是卖家</Option>
          </Select>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: 150 }}
            onChange={(val) => setFilters((prev) => ({ ...prev, status: val, page: 1 }))}
          >
            <Option value="PENDING_PAYMENT">待支付</Option>
            <Option value="PENDING_DELIVERY">待发货</Option>
            <Option value="PENDING_CONFIRM">待确认</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="CANCELED">已取消</Option>
            <Option value="EXCEPTION">异常</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total: data?.pagination?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={(pagination) => setFilters((prev) => ({ ...prev, page: pagination.current, pageSize: pagination.pageSize }))}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={actionModal.type === 'deliver' ? '发货' : '取消订单'}
        open={actionModal.visible}
        onOk={handleSubmit}
        onCancel={() => setActionModal({ visible: false, type: '', order: null })}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          {actionModal.type === 'deliver' && (
            <Form.Item
              name="deliveryInfo"
              label="发货信息"
              rules={[{ required: true, message: '请输入发货信息' }]}
            >
              <TextArea
                rows={4}
                placeholder="请输入账号密码等发货信息，买家确认收货后这些信息将被隐藏"
              />
            </Form.Item>
          )}
          {actionModal.type === 'cancel' && (
            <Form.Item name="cancelReason" label="取消原因">
              <TextArea
                rows={4}
                placeholder="请输入取消原因（可选）"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await orderApi.getById(id!);
      return response.data.data as Order;
    },
    enabled: !!id,
  });

  const raiseExceptionMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await orderApi.raiseException(id!, values);
      return response.data;
    },
    onSuccess: () => {
      message.success('异常已提交，请等待处理');
      setExceptionModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '提交失败');
    },
  });

  const getStatusInfo = (status: OrderStatus) => {
    const map: Record<OrderStatus, { color: string; text: string }> = {
      PENDING_PAYMENT: { color: 'orange', text: '待支付' },
      PENDING_DELIVERY: { color: 'blue', text: '待发货' },
      PENDING_CONFIRM: { color: 'cyan', text: '待确认' },
      COMPLETED: { color: 'success', text: '已完成' },
      CANCELED: { color: 'default', text: '已取消' },
      EXCEPTION: { color: 'red', text: '异常' },
    };
    return map[status];
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>订单不存在</div>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(data.status);

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/orders')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0 }}>订单号: {data.orderNo}</h3>
            <Tag color={statusInfo.color} style={{ marginTop: 8, fontSize: 14, padding: '4px 12px' }}>
              {statusInfo.text}
            </Tag>
          </div>
          <Space>
            {['PENDING_PAYMENT', 'PENDING_DELIVERY', 'PENDING_CONFIRM'].includes(data.status) && (
              <Button onClick={() => setExceptionModalVisible(true)}>
                提交异常
              </Button>
            )}
          </Space>
        </div>

        <Descriptions bordered column={2}>
          <Descriptions.Item label="账号名称">{data.account?.title}</Descriptions.Item>
          <Descriptions.Item label="游戏">{data.account?.gameName}</Descriptions.Item>
          <Descriptions.Item label="价格">
            <strong style={{ color: '#ff4d4f', fontSize: 18 }}>¥{data.price}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="支付方式">{data.paymentMethod || '未支付'}</Descriptions.Item>
          <Descriptions.Item label="买家">{data.buyer?.username}</Descriptions.Item>
          <Descriptions.Item label="卖家">{data.seller?.username}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="支付时间">
            {data.paidAt ? dayjs(data.paidAt).format('YYYY-MM-DD HH:mm') : '未支付'}
          </Descriptions.Item>
          <Descriptions.Item label="发货时间">
            {data.deliveredAt ? dayjs(data.deliveredAt).format('YYYY-MM-DD HH:mm') : '未发货'}
          </Descriptions.Item>
          <Descriptions.Item label="确认时间">
            {data.confirmedAt ? dayjs(data.confirmedAt).format('YYYY-MM-DD HH:mm') : '未确认'}
          </Descriptions.Item>
        </Descriptions>

        {data.deliveryInfo && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 12 }}>发货信息</h4>
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                {data.deliveryInfo}
              </div>
            </div>
          </>
        )}

        {data.cancelReason && (
          <>
            <Divider />
            <div>
              <h4 style={{ marginBottom: 12 }}>取消原因</h4>
              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
                {data.cancelReason}
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        title="提交异常"
        open={exceptionModalVisible}
        onOk={() => form.validateFields().then((values) => raiseExceptionMutation.mutate(values))}
        onCancel={() => setExceptionModalVisible(false)}
        confirmLoading={raiseExceptionMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select>
              <Select.Option value="PAYMENT_ISSUE">支付问题</Select.Option>
              <Select.Option value="DELIVERY_ISSUE">发货问题</Select.Option>
              <Select.Option value="ACCOUNT_ISSUE">账号问题</Select.Option>
              <Select.Option value="COMPLAINT">投诉</Select.Option>
              <Select.Option value="REFUND_REQUEST">退款申请</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="简要描述问题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="详细描述"
          >
            <TextArea rows={4} placeholder="详细描述您遇到的问题" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select defaultValue="MEDIUM">
              <Select.Option value="LOW">低</Select.Option>
              <Select.Option value="MEDIUM">中</Select.Option>
              <Select.Option value="HIGH">高</Select.Option>
              <Select.Option value="URGENT">紧急</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export { OrderList, OrderDetail };
