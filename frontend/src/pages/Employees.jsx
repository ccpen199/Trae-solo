import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tabs, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Option } = Select;
const { TabPane } = Tabs;

function Employees({ storeId }) {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [leaveForm] = Form.useForm();

  useEffect(() => {
    loadEmployees();
    loadLeaves();
  }, [storeId]);

  const loadEmployees = async () => {
    const res = await api.get(`/employees?store_id=${storeId}`);
    if (res.success) {
      setEmployees(res.data);
    }
  };

  const loadLeaves = async () => {
    const res = await api.get(`/leaves?store_id=${storeId}`);
    if (res.success) {
      setLeaves(res.data);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingEmployee) {
        const res = await api.put(`/employees/${editingEmployee.id}`, { ...values, store_id: storeId });
        if (res.success) {
          message.success('更新成功');
        }
      } else {
        const res = await api.post('/employees', { ...values, store_id: storeId });
        if (res.success) {
          message.success('添加成功');
        }
      }
      setModalVisible(false);
      loadEmployees();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const res = await api.delete(`/employees/${id}`);
    if (res.success) {
      message.success('删除成功');
      loadEmployees();
    }
  };

  const handleAddLeave = () => {
    leaveForm.resetFields();
    setLeaveModalVisible(true);
  };

  const handleLeaveOk = async () => {
    try {
      const values = await leaveForm.validateFields();
      const res = await api.post('/leaves', {
        ...values,
        leave_date: values.leave_date
      });
      if (res.success) {
        message.success('请假申请提交成功');
        setLeaveModalVisible(false);
        loadLeaves();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveApprove = async (id, status) => {
    const res = await api.put(`/leaves/${id}`, { status });
    if (res.success) {
      message.success('操作成功');
      loadLeaves();
    }
  };

  const empColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '岗位', dataIndex: 'position', key: 'position' },
    { title: '技能', dataIndex: 'skills', key: 'skills', render: (v) => v?.split(',').map(s => <Tag key={s}>{s}</Tag>) },
    { title: '日最大工时', dataIndex: 'max_daily_hours', key: 'max_daily_hours' },
    { title: '周最大工时', dataIndex: 'max_weekly_hours', key: 'max_weekly_hours' },
    { title: '操作', key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  const leaveColumns = [
    { title: '员工', dataIndex: 'employee_name', key: 'employee_name' },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '请假日期', dataIndex: 'leave_date', key: 'leave_date' },
    { title: '类型', dataIndex: 'leave_type', key: 'leave_type',
      render: (v) => {
        const map = { annual: '年假', sick: '病假', personal: '事假' };
        return map[v] || v;
      }
    },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (v) => {
        const colorMap = { pending: 'orange', approved: 'green', rejected: 'red' };
        const textMap = { pending: '待审批', approved: '已批准', rejected: '已拒绝' };
        return <Tag color={colorMap[v]}>{textMap[v] || v}</Tag>;
      }
    },
    { title: '操作', key: 'action',
      render: (_, record) => record.status === 'pending' && (
        <Space>
          <Button type="primary" size="small" onClick={() => handleLeaveApprove(record.id, 'approved')}>批准</Button>
          <Button size="small" danger onClick={() => handleLeaveApprove(record.id, 'rejected')}>拒绝</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Tabs defaultActiveKey="employees">
        <TabPane tab="员工列表" key="employees">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>员工管理</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加员工</Button>
          </div>

          <Table dataSource={employees} columns={empColumns} rowKey="id" />
        </TabPane>

        <TabPane tab="请假管理" key="leaves">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>请假管理</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLeave}>申请请假</Button>
          </div>

          <Table dataSource={leaves} columns={leaveColumns} rowKey="id" />
        </TabPane>
      </Tabs>

      <Modal
        title={editingEmployee ? '编辑员工' : '添加员工'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="岗位">
            <Select>
              <Option value="店长">店长</Option>
              <Option value="店员">店员</Option>
              <Option value="兼职">兼职</Option>
            </Select>
          </Form.Item>
          <Form.Item name="skills" label="技能（逗号分隔）">
            <Input placeholder="泡茶,收银,制作" />
          </Form.Item>
          <Form.Item name="max_daily_hours" label="日最大工时">
            <Input type="number" defaultValue={8} />
          </Form.Item>
          <Form.Item name="max_weekly_hours" label="周最大工时">
            <Input type="number" defaultValue={40} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请请假"
        open={leaveModalVisible}
        onOk={handleLeaveOk}
        onCancel={() => setLeaveModalVisible(false)}
        okText="提交"
        cancelText="取消"
      >
        <Form form={leaveForm} layout="vertical">
          <Form.Item name="employee_id" label="员工" rules={[{ required: true }]}>
            <Select>
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>{emp.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="leave_date" label="请假日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="leave_type" label="请假类型" rules={[{ required: true }]}>
            <Select>
              <Option value="annual">年假</Option>
              <Option value="sick">病假</Option>
              <Option value="personal">事假</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="请假原因">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Employees;
