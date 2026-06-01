import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Space, Tag, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { configRules } from '../api.js';

const ConfigPage = ({ currentUser }) => {
  const [rules, setRules] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await configRules.getAll();
      setRules(data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      valid_from: record.valid_from ? new Date(record.valid_from) : null,
      valid_to: record.valid_to ? new Date(record.valid_to) : null
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        valid_from: values.valid_from ? values.valid_from.toISOString() : null,
        valid_to: values.valid_to ? values.valid_to.toISOString() : null,
        is_enabled: values.is_enabled ? 1 : 0
      };

      if (editingItem) {
        await configRules.update(editingItem.id, data);
        message.success('更新成功');
      } else {
        await configRules.create({ ...data, owner: currentUser?.username || 'system' });
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '规则类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      render: (t) => <Tag color="blue">{t}</Tag>
    },
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name'
    },
    {
      title: '规则值',
      dataIndex: 'rule_value',
      key: 'rule_value',
      ellipsis: true
    },
    {
      title: '责任人',
      dataIndex: 'owner',
      key: 'owner',
      width: 100
    },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
      width: 120
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_, r) => `${r.valid_from || '不限'} ~ ${r.valid_to || '不限'}`,
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (e) => <Tag color={e ? 'green' : 'default'}>{e ? '启用' : '停用'}</Tag>,
      width: 80
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>系统配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加规则
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑规则' : '添加规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="rule_type" label="规则类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="category">分类规则</Select.Option>
              <Select.Option value="crawl_frequency">抓取频率</Select.Option>
              <Select.Option value="price_check">价格校验</Select.Option>
              <Select.Option value="review_filter">评论过滤</Select.Option>
              <Select.Option value="permission">权限配置</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="rule_name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="rule_value" label="规则值">
            <Input.TextArea rows={3} placeholder="请输入规则值" />
          </Form.Item>
          <Form.Item name="permission" label="权限角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="business_owner">业务负责人</Select.Option>
              <Select.Option value="model_operator">模型运营</Select.Option>
              <Select.Option value="auditor">审核人员</Select.Option>
              <Select.Option value="frontline_user">一线使用者</Select.Option>
            </Select>
          </Form.Item>
          <Space>
            <Form.Item name="valid_from" label="有效期开始" style={{ marginBottom: 0 }}>
              <DatePicker showTime />
            </Form.Item>
            <Form.Item name="valid_to" label="有效期结束" style={{ marginBottom: 0 }}>
              <DatePicker showTime />
            </Form.Item>
          </Space>
          <Form.Item name="is_enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigPage;
