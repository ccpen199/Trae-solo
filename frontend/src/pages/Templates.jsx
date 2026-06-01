import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  App,
  Popconfirm,
  Divider,
  Card,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import { templatesAPI } from '../services/api.js';

const { TextArea } = Input;
const { Option } = Select;

export default function Templates() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [history, setHistory] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await templatesAPI.getList();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      message.error('加载模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      ...template,
      fields: JSON.stringify(template.fields, null, 2),
      signature_rules: template.signature_rules ? JSON.stringify(template.signature_rules, null, 2) : '',
      applicable_items: template.applicable_items ? JSON.stringify(template.applicable_items, null, 2) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await templatesAPI.delete(id);
      if (result.success) {
        message.success('删除成功');
        loadTemplates();
      }
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const handleViewHistory = async (template) => {
    try {
      const result = await templatesAPI.getHistory(template.id);
      if (result.success) {
        setHistory(result.data);
        setHistoryModalVisible(true);
      }
    } catch (error) {
      message.error('加载历史记录失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        fields: JSON.parse(values.fields),
        signature_rules: values.signature_rules ? JSON.parse(values.signature_rules) : null,
        applicable_items: values.applicable_items ? JSON.parse(values.applicable_items) : null,
        change_reason: editingTemplate ? values.change_reason : undefined,
        changed_by: 'admin',
        created_by: 'admin',
      };

      if (editingTemplate) {
        const result = await templatesAPI.update(editingTemplate.id, data);
        if (result.success) {
          message.success('更新成功');
        }
      } else {
        const result = await templatesAPI.create(data);
        if (result.success) {
          message.success('创建成功');
        }
      }
      setModalVisible(false);
      loadTemplates();
    } catch (error) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: '模板编码', dataIndex: 'template_code', key: 'template_code', width: 120 },
    { title: '模板名称', dataIndex: 'template_name', key: 'template_name' },
    { title: '证照类型', dataIndex: 'certificate_type', key: 'certificate_type', width: 100 },
    {
      title: '有效期',
      key: 'validity',
      width: 100,
      render: (_, record) => `${record.validity_period}${record.validity_unit === 'year' ? '年' : record.validity_unit === 'month' ? '月' : '天'}`,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewHistory(record)}>
            历史
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

  const historyColumns = [
    { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
    { title: '模板名称', dataIndex: 'template_name', key: 'template_name' },
    { title: '变更原因', dataIndex: 'change_reason', key: 'change_reason' },
    { title: '操作人', dataIndex: 'changed_by', key: 'changed_by', width: 100 },
    { title: '变更时间', dataIndex: 'changed_at', key: 'changed_at', width: 180 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>证照模板管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建模板
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={templates}
        rowKey="id"
      />

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="template_code"
                label="模板编码"
                rules={[{ required: true, message: '请输入模板编码' }]}
              >
                <Input disabled={!!editingTemplate} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="template_name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="certificate_type"
                label="证照类型"
                rules={[{ required: true, message: '请选择证照类型' }]}
              >
                <Select>
                  <Option value="identity">身份证件</Option>
                  <Option value="license">许可证</Option>
                  <Option value="certificate">资格证书</Option>
                  <Option value="permit">执照</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="validity_period"
                label="有效期"
                rules={[{ required: true, message: '请输入有效期' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="validity_unit"
                label="单位"
                initialValue="day"
              >
                <Select>
                  <Option value="day">天</Option>
                  <Option value="month">月</Option>
                  <Option value="year">年</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="fields"
            label="字段定义 (JSON)"
            rules={[{ required: true, message: '请输入字段定义' }]}
            extra='例如: [{"name": "姓名", "key": "name", "type": "string"}]'
          >
            <TextArea rows={6} placeholder='[{"name": "姓名", "key": "name", "type": "string"}, {"name": "编号", "key": "code", "type": "string"}]' />
          </Form.Item>
          <Form.Item
            name="signature_rules"
            label="签章规则 (JSON)"
            extra='可选，例如: {"algorithm": "RSA", "key_type": "2048"}'
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="applicable_items"
            label="适用事项 (JSON数组)"
            extra='可选，例如: ["企业注册", "税务登记"]'
          >
            <TextArea rows={2} />
          </Form.Item>
          {editingTemplate && (
            <Form.Item
              name="change_reason"
              label="变更原因"
              rules={[{ required: true, message: '请输入变更原因' }]}
            >
              <Input />
            </Form.Item>
          )}
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更历史"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={history}
          columns={historyColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
}
