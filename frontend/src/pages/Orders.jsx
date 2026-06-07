import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getOrders, createOrder, updateOrder, getUsers, getDevices } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const statusMap = {
  pending: { text: '待处理', color: 'orange' },
  in_progress: { text: '处理中', color: 'blue' },
  completed: { text: '已完成', color: 'green' }
};

const typeMap = {
  install: '安装服务',
  repair: '维修服务',
  maintain: '保养维护',
  consult: '咨询服务'
};

const priorityMap = {
  low: { text: '低', color: 'default' },
  normal: { text: '中', color: 'blue' },
  high: { text: '高', color: 'red' }
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, usersRes, devicesRes] = await Promise.all([
        getOrders(),
        getUsers(),
        getDevices()
      ]);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    form.setFieldsValue({
      order_no: order.order_no,
      type: order.type,
      title: order.title,
      description: order.description,
      priority: order.priority,
      user_id: order.user_id,
      device_id: order.device_id,
      technician: order.technician,
      status: order.status
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const orderData = {
        ...values,
        scheduled_time: values.scheduled_time ? values.scheduled_time.format('YYYY-MM-DD HH:mm:ss') : null
      };
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
        message.success('工单更新成功');
      } else {
        await createOrder(orderData);
        message.success('工单创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleComplete = async (order) => {
    try {
      await updateOrder(order.id, { status: 'completed', completed_at: new Date().toISOString() });
      message.success('工单已完成');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t) => typeMap[t] || t },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '用户', dataIndex: 'user_name', key: 'user_name', width: 100 },
    { title: '设备', dataIndex: 'device_name', key: 'device_name', width: 120 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p) => <Tag color={priorityMap[p]?.color}>{priorityMap[p]?.text}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag> },
    { title: '技师', dataIndex: 'technician', key: 'technician', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status !== 'completed' && (
            <Popconfirm title="确认完成?" onConfirm={() => handleComplete(record)}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                完成
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title="服务工单"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          创建工单
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingOrder ? '编辑工单' : '创建工单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="order_no" label="工单号" rules={[{ required: true }]}>
            <Input placeholder="如: WO202401004" disabled={!!editingOrder} />
          </Form.Item>
          <Form.Item name="type" label="工单类型" rules={[{ required: true }]}>
            <Select>
              <Option value="install">安装服务</Option>
              <Option value="repair">维修服务</Option>
              <Option value="maintain">保养维护</Option>
              <Option value="consult">咨询服务</Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="工单标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="问题描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select>
              <Option value="low">低</Option>
              <Option value="normal">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>
          <Form.Item name="user_id" label="用户">
            <Select>
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="device_id" label="关联设备">
            <Select>
              <Option value="">无</Option>
              {devices.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="technician" label="指派技师">
            <Input placeholder="技师姓名" />
          </Form.Item>
          {editingOrder && (
            <Form.Item name="status" label="状态">
              <Select>
                <Option value="pending">待处理</Option>
                <Option value="in_progress">处理中</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item name="scheduled_time" label="预约时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingOrder ? '保存修改' : '创建工单'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Orders;
