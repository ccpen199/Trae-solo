import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, TimePicker, message, Popconfirm, Transfer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

function PlanList() {
  const [plans, setPlans] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoints, setSelectedCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPlans();
    fetchBuildings();
    fetchUsers();
    fetchCheckpoints();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      message.error('获取计划列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
    } catch (error) {
      message.error('获取楼栋列表失败');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users?role=patrol');
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
    }
  };

  const fetchCheckpoints = async () => {
    try {
      const response = await api.get('/checkpoints');
      setCheckpoints(response.data);
    } catch (error) {
      message.error('获取点位列表失败');
    }
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setSelectedCheckpoints([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (plan) => {
    setEditingPlan(plan);
    try {
      const response = await api.get(`/plans/${plan.id}`);
      const planDetail = response.data;
      setSelectedCheckpoints(planDetail.checkpoints.map(cp => cp.id));
      form.setFieldsValue({
        ...planDetail,
        time_window_start: dayjs(planDetail.time_window_start, 'HH:mm'),
        time_window_end: dayjs(planDetail.time_window_end, 'HH:mm')
      });
    } catch (error) {
      message.error('获取计划详情失败');
    }
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/plans/${id}`);
      message.success('删除成功');
      fetchPlans();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        time_window_start: values.time_window_start.format('HH:mm'),
        time_window_end: values.time_window_end.format('HH:mm'),
        checkpoints: selectedCheckpoints
      };
      
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, data);
        message.success('更新成功');
      } else {
        await api.post('/plans', data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchPlans();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    { title: '计划名称', dataIndex: 'name', key: 'name' },
    { title: '所属楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', render: (f) => {
      const map = { daily: '每日', weekly: '每周', monthly: '每月' };
      return map[f] || f;
    }},
    { title: '时间窗口', key: 'window', render: (_, r) => `${r.time_window_start} - ${r.time_window_end}` },
    { title: '责任人', dataIndex: 'assigned_user_name', key: 'assigned_user_name' },
    { title: '点位数量', dataIndex: 'checkpoint_count', key: 'checkpoint_count' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 'active' ? '启用' : '禁用' },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个计划吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>巡更计划</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增计划
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingPlan ? '编辑计划' : '新增计划'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" />
          </Form.Item>
          <Form.Item
            name="building_id"
            label="所属楼栋"
            rules={[{ required: true, message: '请选择楼栋' }]}
          >
            <Select placeholder="请选择楼栋">
              {buildings.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="frequency"
            label="巡更频次"
            rules={[{ required: true, message: '请选择频次' }]}
          >
            <Select placeholder="请选择频次">
              <Select.Option value="daily">每日</Select.Option>
              <Select.Option value="weekly">每周</Select.Option>
              <Select.Option value="monthly">每月</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="时间窗口" required>
            <Form.Item
              name="time_window_start"
              noStyle
              rules={[{ required: true, message: '请选择开始时间' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '45%' }} />
            </Form.Item>
            <span style={{ display: 'inline-block', width: '10%', textAlign: 'center' }}>-</span>
            <Form.Item
              name="time_window_end"
              noStyle
              rules={[{ required: true, message: '请选择结束时间' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '45%' }} />
            </Form.Item>
          </Form.Item>
          <Form.Item
            name="assigned_user_id"
            label="责任人"
          >
            <Select placeholder="请选择责任人" allowClear>
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="选择点位">
            <Transfer
              dataSource={checkpoints.map(cp => ({ ...cp, key: cp.id, title: cp.name }))}
              targetKeys={selectedCheckpoints}
              onChange={setSelectedCheckpoints}
              render={item => `${item.qr_code} - ${item.title}`}
              listStyle={{ width: 250, height: 300 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PlanList;
