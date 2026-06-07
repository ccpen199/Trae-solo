import React, { useState, useEffect } from 'react';
import {
  Card, Button, Modal, Form, Select, Input, InputNumber,
  message, Tag, Space, Row, Col, List, Avatar, Empty,
  Drawer, Descriptions, Divider, Popconfirm, Tabs, Tooltip
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined,
  AppstoreOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined, FileSearchOutlined, CopyOutlined,
  EyeOutlined, CheckCircleOutlined, StarOutlined,
  TeamOutlined, BookOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const EnterpriseTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form] = Form.useForm();
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, catRes] = await Promise.all([
        api.get('/jd-templates'),
        api.get('/jobs/categories'),
      ]);
      setTemplates(templatesRes.data.templates || []);
      setCategories(catRes.data.categories || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryCode) => {
    if (categoryCode?.includes('CNC') || categoryCode?.includes('cnc')) {
      return <SettingOutlined style={{ color: '#1677ff', fontSize: 24 }} />;
    }
    if (categoryCode?.includes('MOLD') || categoryCode?.includes('mold')) {
      return <AppstoreOutlined style={{ color: '#722ed1', fontSize: 24 }} />;
    }
    if (categoryCode?.includes('PLC') || categoryCode?.includes('plc')) {
      return <ThunderboltOutlined style={{ color: '#fa8c16', fontSize: 24 }} />;
    }
    if (categoryCode?.includes('QUALITY') || categoryCode?.includes('quality')) {
      return <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
    }
    if (categoryCode?.includes('PROD') || categoryCode?.includes('prod')) {
      return <TeamOutlined style={{ color: '#13c2c2', fontSize: 24 }} />;
    }
    return <FileTextOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
  };

  const getCategoryColor = (categoryCode) => {
    if (categoryCode?.includes('CNC') || categoryCode?.includes('cnc')) return '#1677ff';
    if (categoryCode?.includes('MOLD') || categoryCode?.includes('mold')) return '#722ed1';
    if (categoryCode?.includes('PLC') || categoryCode?.includes('plc')) return '#fa8c16';
    if (categoryCode?.includes('QUALITY') || categoryCode?.includes('quality')) return '#52c41a';
    if (categoryCode?.includes('PROD') || categoryCode?.includes('prod')) return '#13c2c2';
    return '#8c8c8c';
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      ...template,
      job_category_code: template.job_category_code,
    });
    setModalVisible(true);
  };

  const handleViewDetail = (template) => {
    setSelectedTemplate(template);
    setDetailVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (values.salary_min > values.salary_max) {
        message.error('最低薪资不能高于最高薪资');
        return;
      }

      setLoading(true);
      if (editingTemplate) {
        await api.put(`/jd-templates/${editingTemplate.id}`, values);
        message.success('模板更新成功');
      } else {
        await api.post('/jd-templates', values);
        message.success('模板创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    try {
      await api.delete(`/jd-templates/${templateId}`);
      message.success('模板删除成功');
      fetchData();
    } catch (e) {
      message.error(e.response?.data?.error || '删除失败');
    }
  };

  const handleUseTemplate = (template) => {
    const templateData = {
      job_category_code: template.job_category_code,
      job_title: template.job_title,
      job_description: template.job_description,
      requirements: template.requirements,
      salary_min: template.salary_min,
      salary_max: template.salary_max,
      ability_model: template.ability_model,
    };
    
    sessionStorage.setItem('templateJobData', JSON.stringify(templateData));
    navigate('/enterprise/jobs');
    message.success('已加载模板，请填写剩余信息');
  };

  const handleDuplicate = async (template) => {
    try {
      const newTemplate = {
        template_name: `${template.template_name} - 副本`,
        job_category_code: template.job_category_code,
        job_title: template.job_title,
        job_description: template.job_description,
        requirements: template.requirements,
        salary_min: template.salary_min,
        salary_max: template.salary_max,
        ability_model: template.ability_model,
      };
      await api.post('/jd-templates', newTemplate);
      message.success('模板复制成功');
      fetchData();
    } catch (e) {
      message.error('复制失败');
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = !categoryFilter || t.job_category_code.startsWith(categoryFilter);
    if (typeFilter === 'builtin') return t.is_builtin && matchesCategory;
    if (typeFilter === 'custom') return !t.is_builtin && matchesCategory;
    return matchesCategory;
  });

  const builtinTemplates = templates.filter(t => t.is_builtin);
  const customTemplates = templates.filter(t => !t.is_builtin);

  const renderTemplateCard = (template) => (
    <Card
      key={template.id}
      hoverable
      className="card-shadow"
      style={{ height: '100%' }}
      onClick={() => handleViewDetail(template)}
      actions={[
        <Tooltip key="use" title="使用模板创建职位">
          <Button
            type="link"
            icon={<ThunderboltOutlined />}
            onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
          >
            使用
          </Button>
        </Tooltip>,
        !template.is_builtin ? (
          <Tooltip key="edit" title="编辑模板">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
            >
              编辑
            </Button>
          </Tooltip>
        ) : (
          <Tooltip key="copy" title="复制模板">
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}
            >
              复制
            </Button>
          </Tooltip>
        ),
        !template.is_builtin ? (
          <Popconfirm
            key="delete"
            title="确定删除此模板？"
            onConfirm={(e) => { e.stopPropagation(); handleDelete(template.id); }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              删除
            </Button>
          </Popconfirm>
        ) : null,
      ].filter(Boolean)}
    >
      <Card.Meta
        avatar={
          <Avatar
            style={{
              background: `${getCategoryColor(template.job_category_code)}20`,
              width: 56,
              height: 56,
            }}
            icon={getCategoryIcon(template.job_category_code)}
          />
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{template.template_name}</span>
            {template.is_builtin ? (
              <Tag color="gold" icon={<StarOutlined />}>官方</Tag>
            ) : (
              <Tag color="blue">自定义</Tag>
            )}
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: 8 }}>
              <Tag color={getCategoryColor(template.job_category_code)}>
                {template.category_name}
              </Tag>
              <Tag color="red">
                {template.salary_min}K - {template.salary_max}K
              </Tag>
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {template.job_title}
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderBuiltinTemplates = () => (
    <div>
      <Divider orientation="left">
        <Space>
          <StarOutlined style={{ color: '#faad14' }} />
          <span style={{ fontWeight: 600 }}>官方推荐模板</span>
        </Space>
      </Divider>
      {builtinTemplates.length === 0 ? (
        <Empty description="暂无官方模板" />
      ) : (
        <Row gutter={[16, 16]}>
          {builtinTemplates.map(renderTemplateCard)}
        </Row>
      )}
    </div>
  );

  const renderCustomTemplates = () => (
    <div>
      <Divider orientation="left">
        <Space>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontWeight: 600 }}>我的模板</span>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建模板
          </Button>
        </Space>
      </Divider>
      {customTemplates.length === 0 ? (
        <Empty description="暂无自定义模板，点击上方按钮创建">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建第一个模板
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {customTemplates.map(renderTemplateCard)}
        </Row>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h2 style={{ margin: 0 }}>JD模板库</h2>
        <Space>
          <Select
            placeholder="按类别筛选"
            value={categoryFilter || undefined}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            allowClear
          >
            {categories.filter(c => !c.parent_code).map(cat => (
              <Option key={cat.category_code} value={cat.category_code}>
                {cat.category_name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="按类型筛选"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 140 }}
          >
            <Option value="all">全部模板</Option>
            <Option value="builtin">官方模板</Option>
            <Option value="custom">我的模板</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建模板
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ background: '#1677ff', width: 48, height: 48 }}>
                <FileSearchOutlined />
              </Avatar>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
                  {templates.length}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>模板总数</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ background: '#faad14', width: 48, height: 48 }}>
                <StarOutlined />
              </Avatar>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
                  {builtinTemplates.length}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>官方模板</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ background: '#52c41a', width: 48, height: 48 }}>
                <FileTextOutlined />
              </Avatar>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                  {customTemplates.length}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>自定义模板</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ background: '#722ed1', width: 48, height: 48 }}>
                <BookOutlined />
              </Avatar>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>
                  {categories.filter(c => !c.parent_code).length}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>职位类别</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {typeFilter === 'all' ? (
        <>
          {renderBuiltinTemplates()}
          {renderCustomTemplates()}
        </>
      ) : typeFilter === 'builtin' ? (
        renderBuiltinTemplates()
      ) : (
        renderCustomTemplates()
      )}

      <Modal
        title={editingTemplate ? '编辑模板' : '新建JD模板'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={720}
        confirmLoading={loading}
        okText={editingTemplate ? '保存' : '创建'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="template_name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="如：高级CNC工程师通用模板" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="job_category_code"
                label="职位类别"
                rules={[{ required: true, message: '请选择职位类别' }]}
              >
                <Select placeholder="请选择职位类别" showSearch>
                  {categories.map(cat => (
                    <Option key={cat.category_code} value={cat.category_code}>
                      {cat.category_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="job_title"
                label="职位名称"
                rules={[{ required: true, message: '请输入职位名称' }]}
              >
                <Input placeholder="如：高级CNC编程工程师" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="salary_min"
                label="最低薪资 (K/月)"
                rules={[{ required: true, message: '请输入最低薪资' }]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  placeholder="如：15"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salary_max"
                label="最高薪资 (K/月)"
                rules={[{ required: true, message: '请输入最高薪资' }]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  placeholder="如：25"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="job_description"
            label="职位描述"
            rules={[{ required: true, message: '请输入职位描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述岗位职责、工作内容等"
            />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="任职要求"
            rules={[{ required: true, message: '请输入任职要求' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述任职资格、技能要求等"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="模板详情"
        placement="right"
        width={640}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedTemplate && (
            <Space>
              <Button
                icon={<ThunderboltOutlined />}
                type="primary"
                onClick={() => handleUseTemplate(selectedTemplate)}
              >
                使用模板创建职位
              </Button>
              {!selectedTemplate.is_builtin ? (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    handleEdit(selectedTemplate);
                    setDetailVisible(false);
                  }}
                >
                  编辑
                </Button>
              ) : (
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => {
                    handleDuplicate(selectedTemplate);
                  }}
                >
                  复制
                </Button>
              )}
            </Space>
          )
        }
      >
        {selectedTemplate && (
          <>
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    style={{
                      background: `${getCategoryColor(selectedTemplate.job_category_code)}20`,
                      width: 48,
                      height: 48,
                    }}
                    icon={getCategoryIcon(selectedTemplate.job_category_code)}
                  />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {selectedTemplate.template_name}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {selectedTemplate.is_builtin ? '官方模板' : '自定义模板'} ·
                      创建于 {dayjs(selectedTemplate.created_at).format('YYYY-MM-DD')}
                    </div>
                  </div>
                </div>
              }
            >
              <Space>
                <Tag color={getCategoryColor(selectedTemplate.job_category_code)}>
                  {selectedTemplate.category_name}
                </Tag>
                <Tag color="red">
                  {selectedTemplate.salary_min}K - {selectedTemplate.salary_max}K
                </Tag>
                <Tag color="blue">{selectedTemplate.job_title}</Tag>
              </Space>
            </Card>

            <Card title="职位描述" size="small" style={{ marginBottom: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {selectedTemplate.job_description}
              </div>
            </Card>

            <Card title="任职要求" size="small" style={{ marginBottom: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {selectedTemplate.requirements}
              </div>
            </Card>

            {selectedTemplate.ability_model && Object.keys(selectedTemplate.ability_model).length > 0 && (
              <Card title="能力模型" size="small">
                <List
                  size="small"
                  dataSource={Object.entries(selectedTemplate.ability_model)}
                  renderItem={([key, value]) => (
                    <List.Item>
                      <span style={{ fontWeight: 500 }}>{key}</span>
                      <span style={{ color: '#1677ff' }}>{value}</span>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default EnterpriseTemplates;
