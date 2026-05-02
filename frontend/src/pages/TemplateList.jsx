import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Space, Typography, Tag, Input, Select, Row, Col,
  message, Modal, Form, InputNumber, Popconfirm
} from 'antd';
import {
  PlusOutlined, SearchOutlined, LockOutlined, UnlockOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { templateApi } from '../utils/api';
import { useAuthStore } from '../store/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function TemplateList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      const response = await templateApi.list(params);
      setTemplates(response.data);
    } catch (error) {
      console.error('加载模板列表失败:', error);
      message.error('加载模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await templateApi.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const handleCreateTemplate = async (values) => {
    try {
      await templateApi.create({
        templateName: values.templateName,
        templateCode: values.templateCode,
        description: values.description,
        canvasWidth: values.canvasWidth || 800,
        canvasHeight: values.canvasHeight || 800,
        category: values.category
      });
      
      message.success('模板创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadTemplates();
    } catch (error) {
      console.error('创建模板失败:', error);
      message.error(error.response?.data?.error || '创建模板失败');
    }
  };

  const handleLockTemplate = async (templateId, isLocked) => {
    try {
      if (isLocked) {
        await templateApi.unlock(templateId);
        message.success('模板已解锁');
      } else {
        await templateApi.lock(templateId);
        message.success('模板已锁定');
      }
      loadTemplates();
    } catch (error) {
      console.error('操作失败:', error);
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (!searchText) return true;
    const text = searchText.toLowerCase();
    return (
      template.template_name?.toLowerCase().includes(text) ||
      template.template_code?.toLowerCase().includes(text) ||
      template.description?.toLowerCase().includes(text)
    );
  });

  const canEdit = user?.role === 'design_operation' || user?.role === 'admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>模板管理</Title>
        
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建模板
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 180 }}
            placeholder="选择分类"
            value={categoryFilter}
            onChange={(value) => {
              setCategoryFilter(value);
              loadTemplates();
            }}
            allowClear
            options={[
              { value: null, label: '全部分类' },
              ...categories.map(c => ({ value: c, label: c }))
            ]}
          />
          <Input.Search
            placeholder="搜索模板名称/编码"
            allowClear
            style={{ width: 320 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
            enterButton={<SearchOutlined />}
          />
          <Button onClick={loadTemplates}>刷新</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {filteredTemplates.map(template => (
          <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
            <Card
              hoverable
              className="template-card"
              style={{
                borderColor: template.is_locked ? '#faad14' : undefined
              }}
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                >
                  预览
                </Button>,
                canEdit && (
                  <Button
                    type="text"
                    size="small"
                    icon={template.is_locked ? <UnlockOutlined /> : <LockOutlined />}
                    onClick={() => handleLockTemplate(template.id, template.is_locked)}
                  >
                    {template.is_locked ? '解锁' : '锁定'}
                  </Button>
                )
              ].filter(Boolean)}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  height: 100,
                  background: template.is_locked ? '#fff2e8' : '#f5f5f5',
                  borderRadius: 4,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <img
                    src={template.preview_image || `https://placehold.co/${template.canvas_width}x${template.canvas_height}/e8e8e8/999999?text=${encodeURIComponent(template.template_name)}`}
                    alt={template.template_name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  {template.is_locked && (
                    <Tag color="orange" style={{
                      position: 'absolute',
                      top: 8,
                      right: 8
                    }}>
                      <LockOutlined /> 已锁定
                    </Tag>
                  )}
                </div>
                
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  {template.template_name}
                </Text>
                
                {template.template_code && (
                  <Tag size="small" style={{ marginBottom: 8 }}>
                    {template.template_code}
                  </Tag>
                )}
                
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {template.canvas_width} x {template.canvas_height} px
                </Text>
                
                {template.category && (
                  <Tag size="small" style={{ marginTop: 8 }}>
                    {template.category}
                  </Tag>
                )}
                
                {template.locked_by_name && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                    锁定者: {template.locked_by_name}
                  </Text>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="新建模板"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTemplate}
          initialValues={{
            canvasWidth: 800,
            canvasHeight: 800,
            category: 'general'
          }}
        >
          <Form.Item
            name="templateName"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：电商主图模板" />
          </Form.Item>

          <Form.Item
            name="templateCode"
            label="模板编码"
          >
            <Input placeholder="例如：TM001" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="模板描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="canvasWidth"
                label="宽度 (px)"
                rules={[{ required: true, message: '请输入宽度' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="canvasHeight"
                label="高度 (px)"
                rules={[{ required: true, message: '请输入高度' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="category"
            label="分类"
          >
            <Select>
              <Select.Option value="general">通用</Select.Option>
              <Select.Option value="ecommerce">电商</Select.Option>
              <Select.Option value="banner">横幅</Select.Option>
              <Select.Option value="detail">详情页</Select.Option>
              <Select.Option value="social">社交</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TemplateList;
