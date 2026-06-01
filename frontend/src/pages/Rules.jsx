import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ruleAPI, applicationAPI } from '../services/api';
import dayjs from 'dayjs';

const Rules = () => {
  const [data, setData] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadApps();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ruleAPI.list();
      setData(res.data);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const res = await applicationAPI.list();
      setApps(res.data);
    } catch (err) {
      console.error('加载应用失败');
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await ruleAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await ruleAPI.update(record.id, { ...record, is_active: !record.is_active });
      message.success('状态更新成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '更新失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await ruleAPI.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await ruleAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const ruleTypeOptions = [
    { label: '手机号', value: 'phone' },
    { label: '邮箱', value: 'email' },
    { label: '身份证号', value: 'idCard' },
    { label: '银行卡号', value: 'bankCard' },
    { label: '姓名', value: 'name' },
    { label: '自定义正则', value: 'custom' },
  ];

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
    },
    {
      title: '规则类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      width: 120,
      render: (type) => {
        const opt = ruleTypeOptions.find(o => o.value === type);
        return opt?.label || type;
      },
    },
    {
      title: '匹配模式',
      dataIndex: 'pattern',
      key: 'pattern',
      ellipsis: true,
    },
    {
      title: '替换为',
      dataIndex: 'replacement',
      key: 'replacement',
      width: 100,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={() => handleToggleActive(record)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      ),
    },
    {
      title: '创建人',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        <h2 className="page-title">脱敏规则</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建规则
        </Button>
      </div>

      <div className="card-content">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
        />
      </div>

      <Modal
        title={editingRecord ? '编辑规则' : '新建规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="app_id" label="所属应用" rules={[{ required: true }]}>
            <Select>
              {apps.map(app => (
                <Select.Option key={app.id} value={app.id}>{app.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="rule_type" label="规则类型" rules={[{ required: true }]}>
            <Select options={ruleTypeOptions} />
          </Form.Item>
          <Form.Item name="pattern" label="匹配模式" rules={[{ required: true }]}>
            <Input placeholder="自定义正则表达式" />
          </Form.Item>
          <Form.Item name="replacement" label="替换为" initialValue="***">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Rules;
