import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Tabs, Descriptions, Timeline, Drawer } from 'antd';
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { adminAPI, workOrderAPI } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const AdminWorkOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [assignForm] = Form.useForm();
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });

  useEffect(() => {
    loadOrders();
    loadWorkers();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllWorkOrders(filters);
      setOrders(res.data || []);
    } catch (err) {
      message.error('加载工单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const res = await adminAPI.getGridWorkers();
      setWorkers(res.data || []);
    } catch (err) {
      message.error('加载工作人员失败');
    }
  };

  const handleAssign = async (values) => {
    try {
      await adminAPI.assignWorkOrder(currentOrder.id, values);
      message.success('派单成功');
      setAssignVisible(false);
      assignForm.resetFields();
      loadOrders();
    } catch (err) {
      message.error(err.response?.data?.error || '派单失败');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await workOrderAPI.getWorkOrderDetail(id);
      setCurrentOrder(res.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('获取工单详情失败');
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
      fixed: 'left',
      width: 140,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
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
      title: '处理人',
      dataIndex: 'assignee_name',
      render: (v) => v || <Tag color="default">未分配</Tag>,
    },
    {
      title: 'SLA状态',
      dataIndex: 'sla_status',
      render: (v) => {
        if (v === 'breached') return <Tag color="red">已超时</Tag>;
        if (v === 'warning') return <Tag color="orange">即将超时</Tag>;
        return <Tag color="green">正常</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => { setCurrentOrder(record); setAssignVisible(true); }}
            >
              派单
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>工单管理</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          管理所有工单，进行派单、监控处理进度
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待处理</Option>
              <Option value="assigned">已派单</Option>
              <Option value="in_progress">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
            >
              <Option value="all">全部类型</Option>
              <Option value="install">报装</Option>
              <Option value="repair">报修</Option>
              <Option value="maintain">维护</Option>
              <Option value="inspection">安检</Option>
            </Select>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadOrders}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Drawer
        title="工单详情"
        placement="right"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentOrder && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="工单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="类型">{getTypeTag(currentOrder.type)}</Descriptions.Item>
              <Descriptions.Item label="优先级">{getPriorityTag(currentOrder.priority)}</Descriptions.Item>
              <Descriptions.Item label="用户">{currentOrder.user_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentOrder.title}</Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>{currentOrder.description}</Descriptions.Item>
              <Descriptions.Item label="位置">{currentOrder.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentOrder.assignee_name || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {currentOrder.rating && (
                <>
                  <Descriptions.Item label="服务评分">
                    {currentOrder.rating} 星
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
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                          {dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}
                        </p>
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

            {currentOrder.status === 'pending' && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button
                  type="primary"
                  onClick={() => { setDetailVisible(false); setAssignVisible(true); }}
                >
                  立即派单
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="工单派单"
        open={assignVisible}
        onCancel={() => setAssignVisible(false)}
        footer={null}
        width={500}
      >
        {currentOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="工单号">{currentOrder.order_no}</Descriptions.Item>
                <Descriptions.Item label="标题">{currentOrder.title}</Descriptions.Item>
                <Descriptions.Item label="类型">{getTypeTag(currentOrder.type)}</Descriptions.Item>
                <Descriptions.Item label="优先级">{getPriorityTag(currentOrder.priority)}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
              <Form.Item
                name="assignee_id"
                label="指派处理人"
                rules={[{ required: true, message: '请选择处理人' }]}
              >
                <Select placeholder="请选择网格员/维修人员">
                  {workers.map(w => (
                    <Option key={w.id} value={w.id}>
                      <Space>
                        <UserOutlined />
                        {w.real_name || w.username}
                        <Tag color="blue">{w.organization_name}</Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="remark"
                label="派单备注"
              >
                <TextArea rows={3} placeholder="请输入派单备注（可选）" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ float: 'right' }}>
                  <Button onClick={() => setAssignVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">确认派单</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminWorkOrders;
