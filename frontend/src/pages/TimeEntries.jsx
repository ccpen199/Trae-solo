import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, DatePicker, InputNumber, Switch, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { timeEntriesAPI, mattersAPI, usersAPI, ratesAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const TimeEntries = () => {
  const [entries, setEntries] = useState([]);
  const [matters, setMatters] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, mattersData, usersData] = await Promise.all([
        timeEntriesAPI.getAll(),
        mattersAPI.getAll(),
        usersAPI.getAll(),
      ]);
      setEntries(entriesData || []);
      setMatters(mattersData || []);
      setUsers(usersData || []);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleMatterChange = async (matterId) => {
    const userId = form.getFieldValue('user_id');
    if (userId) {
      try {
        const rate = await ratesAPI.getByUser(userId);
        if (rate) {
          form.setFieldValue('rate_amount', rate.rate_amount);
        }
      } catch (e) {}
    }
  };

  const handleUserChange = async (userId) => {
    try {
      const rate = await ratesAPI.getByUser(userId);
      if (rate) {
        form.setFieldValue('rate_amount', rate.rate_amount);
      }
    } catch (e) {}
  };

  const handleAdd = () => {
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs(), is_billable: true });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    if (record.invoice_id) {
      message.error('已进入账单的工时不能修改');
      return;
    }
    setEditingEntry(record);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await timeEntriesAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    const data = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
    };
    try {
      if (editingEntry) {
        await timeEntriesAPI.update(editingEntry.id, data);
        message.success('更新成功');
      } else {
        await timeEntriesAPI.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.message || '保存失败');
    }
  };

  const statusColors = { pending: 'orange', approved: 'green', rejected: 'red' };
  const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已退回' };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '案件', dataIndex: 'matter_name', key: 'matter_name', width: 150, ellipsis: true },
    { title: '参与人', dataIndex: 'user_name', key: 'user_name', width: 100 },
    { title: '工作事项', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '工时(h)', dataIndex: 'hours', key: 'hours', width: 90 },
    { title: '费率', dataIndex: 'rate_amount', key: 'rate_amount', width: 90, render: v => v ? `¥${v}/h` : '-' },
    { title: '是否计费', dataIndex: 'is_billable', key: 'is_billable', width: 100,
      render: v => v ? '是' : '否'
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: status => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            disabled={record.invoice_id}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)} disabled={record.invoice_id}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small" disabled={record.invoice_id}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工时填报</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增工时
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingEntry ? '编辑工时' : '新增工时'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="matter_id" label="案件" rules={[{ required: true }]}>
            <Select onChange={handleMatterChange}>
              {matters.map(m => <Option key={m.id} value={m.id}>{m.case_number} - {m.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="user_id" label="参与人" rules={[{ required: true }]}>
            <Select onChange={handleUserChange}>
              {users.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="工作事项" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="hours" label="工时(小时)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.1} max={24} step={0.1} />
          </Form.Item>
          <Form.Item name="rate_amount" label="费率(元/小时)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="is_billable" label="是否可计费" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item name="attachments" label="附件">
            <Input placeholder="输入附件链接或说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimeEntries;
