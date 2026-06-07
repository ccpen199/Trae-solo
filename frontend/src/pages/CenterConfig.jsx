import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function CenterConfig() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/configs');
      setData(response.data);
    } catch (error) {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      await api.post('/admin/configs', values);
      message.success('保存成功');
      setModalVisible(false);
      loadConfigs();
    } catch (error) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: '配置键', dataIndex: 'config_key', key: 'config_key' },
    { title: '配置值', dataIndex: 'config_value', key: 'config_value' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>中心配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增配置
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无配置' }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑配置' : '新增配置'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="config_key"
            label="配置键"
            rules={[{ required: true, message: '请输入配置键' }]}
          >
            <Input placeholder="例如: withdrawal.max_amount" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item
            name="config_value"
            label="配置值"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <Input placeholder="请输入配置值" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入配置描述" />
          </Form.Item>
          <Form.Item name="center_id" hidden initialValue={1}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
