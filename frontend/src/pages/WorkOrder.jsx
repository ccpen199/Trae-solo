import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Tabs, Descriptions, Timeline, Rate } from 'antd';
import { PlusOutlined, SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import { workOrderAPI } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const WorkOrder = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [evaluateVisible, setEvaluateVisible] = useState(false);
  const [evaluateForm] = Form.useForm();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await workOrderAPI.getWorkOrders();
      console.log('工单API返回:', res);
      const orders = res.data || res.list || res.orders || [];
      setOrders(orders);
    } catch (err) {
      console.error('加载工单失败:', err);
      message.error(err.response?.data?.error || '加载工单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await workOrderAPI.getWorkOrderDetail(id);
      setCurrentOrder(res.data || res);
      setDetailVisible(true);
    } catch (err) {
      console.error('获取工单详情失败:', err);
      message.error(err.response?.data?.error || '获取工单详情失败');
    }
  };

  const handleEvaluate = async (values) => {
    try {
      await workOrderAPI.evaluateWorkOrder(currentOrder.id, values);
      message.success('评价成功');
      setEvaluateVisible(false);
      evaluateForm.resetFields();
      loadOrders();
      handleViewDetail(currentOrder.id);
    } catch (err) {
      message.error('评价失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', text: '待处理' },
      assigned: { color: 'processing', text: '已派单' },
      in_progress: { color: 'blue', text: '处理中' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      install: { color: 'blue', text: '报装' },
      repair: { color: 'orange', text: '报修' },
      maintain: { color: 'purple', text: '维护' },
      inspection: { color: 'cyan', text: '安检' },
      other: { color: 'default', text: '其他' },
    };
    const info = typeMap[type] || { color: 'default', text: type };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const map = {
      low: { color: 'green', text: '低' },
      medium: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' },
      urgent: { color: 'red', text: '紧急' },
    };
    const info = map[priority] || { color: 'default', text: priority };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'order_no',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v) => getTypeTag(v),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (v) => getPriorityTag(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => getStatusTag(v),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'completed' && !record.rating && (
            <Button type="link" onClick={() => { setCurrentOrder(record); setEvaluateVisible(true); }}>
              评价
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: 'all',
      label: '全部工单',
      children: (
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'pending',
      label: '待处理',
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter(o => o.status === 'pending' || o.status === 'assigned')}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'in_progress',
      label: '处理中',
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter(o => o.status === 'in_progress')}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'completed',
      label: '已完成',
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter(o => o.status === 'completed')}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>报装报修</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/work-order/create')}>
            新建工单
          </Button>
        </div>
      </Card>

      <Card bordered={false}>
        <Tabs items={items} />
      </Card>

      <Modal
        title="工单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentOrder && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="工单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="类型">{getTypeTag(currentOrder.type)}</Descriptions.Item>
              <Descriptions.Item label="优先级">{getPriorityTag(currentOrder.priority)}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentOrder.title}</Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>{currentOrder.description}</Descriptions.Item>
              <Descriptions.Item label="位置">
                <Space>
                  <EnvironmentOutlined />
                  {currentOrder.location || '未定位'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="预约时间">
                {currentOrder.appointment_time ? dayjs(currentOrder.appointment_time).format('YYYY-MM-DD HH:mm') : '未预约'}
              </Descriptions.Item>
              <Descriptions.Item label="自动派发对象">
                {currentOrder.assignee_name ? (
                  <Tag color="blue">{currentOrder.assignee_name}</Tag>
                ) : (
                  <Tag color="default">系统自动派单中...</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="SLA响应时限">
                <Space>
                  <ClockCircleOutlined />
                  {currentOrder.sla_deadline ? (
                    <>
                      {dayjs(currentOrder.sla_deadline).format('YYYY-MM-DD HH:mm')}
                      {dayjs().isAfter(currentOrder.sla_deadline) ? (
                        <Tag color="red">已超时</Tag>
                      ) : (
                        <Tag color="green">
                          剩余 {Math.max(0, Math.ceil(dayjs(currentOrder.sla_deadline).diff(dayjs(), 'hour')))} 小时
                        </Tag>
                      )}
                    </>
                  ) : (
                    <span>根据优先级自动计算</span>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {currentOrder.contact_phone || '未填写'}
              </Descriptions.Item>
              {currentOrder.rating && (
                <>
                  <Descriptions.Item label="服务评分">
                    <Rate disabled value={currentOrder.rating} />
                  </Descriptions.Item>
                  <Descriptions.Item label="评价内容">
                    {currentOrder.evaluation}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Card title="处理进度" size="small" bordered={false} style={{ background: '#fafafa' }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>工单创建</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                    ),
                  },
                  ...(currentOrder.logs || []).map(log => ({
                    color: log.status === 'completed' ? 'green' : 'blue',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>{log.action}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: 12 }}>{log.remark}</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                          {log.operator_name} · {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                        </p>
                      </div>
                    ),
                  })),
                ]}
              />
            </Card>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              {currentOrder.status === 'completed' && !currentOrder.rating && (
                <Button type="primary" onClick={() => { setDetailVisible(false); setEvaluateVisible(true); }}>
                  服务评价
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="服务评价"
        open={evaluateVisible}
        onCancel={() => setEvaluateVisible(false)}
        footer={null}
      >
        <Form form={evaluateForm} layout="vertical" onFinish={handleEvaluate}>
          <Form.Item
            name="rating"
            label="服务评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="evaluation"
            label="评价内容"
          >
            <TextArea rows={4} placeholder="请分享您的服务体验..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              提交评价
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrder;
