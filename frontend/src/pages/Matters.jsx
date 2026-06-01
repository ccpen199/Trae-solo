import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, InputNumber, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { mattersAPI, clientsAPI, usersAPI } from '../services/api';

const { Option } = Select;

const Matters = () => {
  const [matters, setMatters] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMatter, setEditingMatter] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mattersData, clientsData, usersData] = await Promise.all([
        mattersAPI.getAll(),
        clientsAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setMatters(mattersData || []);
      setClients(clientsData || []);
      setUsers(usersData || []);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingMatter(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingMatter(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingMatter) {
        await mattersAPI.update(editingMatter.id, values);
        message.success('更新成功');
      } else {
        await mattersAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const statusColors = { active: 'green', closed: 'gray' };
  const statusLabels = { active: '进行中', closed: '已结案' };

  const columns = [
    { title: '案件编号', dataIndex: 'case_number', key: 'case_number', width: 140 },
    { title: '案件名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '客户', dataIndex: 'client_name', key: 'client_name', width: 140 },
    { title: '负责合伙人', dataIndex: 'partner_name', key: 'partner_name', width: 120 },
    { title: '计费方式', dataIndex: 'billing_method', key: 'billing_method', width: 120,
      render: (v) => v === 'hourly' ? '计时收费' : '固定收费'
    },
    { title: '预算上限', dataIndex: 'budget_limit', key: 'budget_limit', width: 120, render: (v) => v ? `¥${v.toFixed(2)}` : '不限' },
    { title: '折扣率', dataIndex: 'discount_rate', key: 'discount_rate', width: 100, render: (v) => v ? `${v}%` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">案件管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增案件
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={matters}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingMatter ? '编辑案件' : '新增案件'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="case_number" label="案件编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="案件名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="client_id" label="客户" rules={[{ required: true }]}>
            <Select>
              {clients.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="billing_method" label="计费方式" rules={[{ required: true }]}>
            <Select>
              <Option value="hourly">计时收费</Option>
              <Option value="fixed">固定收费</Option>
            </Select>
          </Form.Item>
          <Form.Item name="partner_id" label="负责合伙人">
            <Select>
              {users.filter(u => u.role === 'partner' || u.role === 'admin').map(u =>
                <Option key={u.id} value={u.id}>{u.name}</Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item name="budget_limit" label="预算上限 (元)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="discount_rate" label="折扣率 (%)">
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="non_billable_items" label="不可计费事项">
            <Input.TextArea rows={2} placeholder="用逗号分隔多个事项" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="active">进行中</Option>
              <Option value="closed">已结案</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Matters;
