import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Typography, Spin, message, Button, 
  Modal, Form, Input, Select, Space, Tree, Popconfirm,
  Row, Col, InputNumber, Switch, Divider
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined,
  UnorderedListOutlined, FolderOutlined, FileOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../api/index.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminKnowledge = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const [flatData, setFlatData] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('process');

  const CATEGORIES = [
    { value: 'process', label: '筹备流程', color: 'blue' },
    { value: 'etiquette', label: '婚礼礼仪', color: 'purple' },
    { value: 'budget', label: '预算规划', color: 'green' },
    { value: 'checklist', label: '物品清单', color: 'orange' },
    { value: 'tips', label: '经验分享', color: 'red' }
  ];

  const CATEGORY_COLOR_MAP = {
    process: 'blue',
    etiquette: 'purple',
    budget: 'green',
    checklist: 'orange',
    tips: 'red'
  };

  const buildTree = (nodes, parentId = 0) => {
    return nodes
      .filter(node => node.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(node => ({
        key: node.id,
        title: (
          <Space>
            {nodes.some(n => n.parent_id === node.id) ? (
              <FolderOutlined style={{ color: '#faad14' }} />
            ) : (
              <FileOutlined style={{ color: '#69c0ff' }} />
            )}
            <span>{node.title}</span>
            <Tag 
              color={CATEGORY_COLOR_MAP[node.category]} 
              style={{ marginLeft: 8 }}
            >
              {CATEGORIES.find(c => c.value === node.category)?.label}
            </Tag>
          </Space>
        ),
        children: buildTree(nodes, node.id),
        data: node
      }));
  };

  const fetchKnowledge = async (category = activeTab) => {
    setLoading(true);
    try {
      const response = await adminAPI.getKnowledge({ category });
      const nodes = response.data;
      setFlatData(nodes);
      setTreeData(buildTree(nodes));
    } catch (error) {
      message.error('获取知识图谱失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [activeTab]);

  const handleAdd = (parentId = 0) => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      category: activeTab,
      parent_id: parentId,
      sort_order: 0,
      status: 1
    });
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      content: item.content,
      category: item.category,
      parent_id: item.parent_id,
      sort_order: item.sort_order,
      status: item.status
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteKnowledge(id);
      message.success('删除成功');
      fetchKnowledge();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      
      if (editingItem) {
        await adminAPI.updateKnowledge(editingItem.id, values);
        message.success('更新成功');
      } else {
        await adminAPI.createKnowledge(values);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      fetchKnowledge();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space>
          {flatData.some(n => n.parent_id === record.id) ? (
            <FolderOutlined style={{ color: '#faad14' }} />
          ) : (
            <FileOutlined style={{ color: '#69c0ff' }} />
          )}
          <Text strong>{title}</Text>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        const cat = CATEGORIES.find(c => c.value === category);
        return <Tag color={cat?.color}>{cat?.label || category}</Tag>;
      }
    },
    {
      title: '父节点',
      dataIndex: 'parent_id',
      key: 'parent_id',
      width: 120,
      render: (parentId) => {
        if (parentId === 0) return <Tag color="default">根节点</Tag>;
        const parent = flatData.find(n => n.id === parentId);
        return parent?.title || '-';
      }
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (order) => <Text type="secondary">{order}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Switch 
          checked={status === 1} 
          checkedChildren="启用" 
          unCheckedChildren="禁用"
          size="small"
          disabled
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleAdd(record.id)}
          >
            添加子节点
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后将无法恢复，是否确认删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const parentOptions = [
    { value: 0, label: '根节点' },
    ...flatData
      .filter(n => n.parent_id === 0)
      .map(n => ({ value: n.id, label: n.title }))
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
            知识图谱管理
          </Title>
          <Text type="secondary">管理婚礼筹备知识库，帮助新人规划完美婚礼</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => handleAdd(0)}
          style={{
            background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
            border: 'none'
          }}
        >
          添加节点
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8} lg={6}>
          <Card 
            title={<Space><BookOutlined />知识分类</Space>}
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 12 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  type={activeTab === cat.value ? 'primary' : 'default'}
                  block
                  style={{
                    background: activeTab === cat.value 
                      ? `linear-gradient(135deg, ${
                          cat.value === 'process' ? '#1890ff' :
                          cat.value === 'etiquette' ? '#722ed1' :
                          cat.value === 'budget' ? '#52c41a' :
                          cat.value === 'checklist' ? '#fa8c16' : '#f5222d'
                        } 0%, ${
                          cat.value === 'process' ? '#69c0ff' :
                          cat.value === 'etiquette' ? '#b37feb' :
                          cat.value === 'budget' ? '#95de64' :
                          cat.value === 'checklist' ? '#ffc069' : '#ff7875'
                        } 100%)`
                      : undefined,
                    borderColor: activeTab === cat.value ? 'transparent' : undefined,
                    textAlign: 'left',
                    height: 44
                  }}
                  onClick={() => setActiveTab(cat.value)}
                >
                  <Space>
                    {cat.value === 'process' && <UnorderedListOutlined />}
                    {cat.value === 'etiquette' && <BookOutlined />}
                    {cat.value === 'budget' && <span>¥</span>}
                    {cat.value === 'checklist' && <SaveOutlined />}
                    {cat.value === 'tips' && <span>💡</span>}
                    {cat.label}
                    <Tag 
                      color={cat.color} 
                      style={{ marginLeft: 'auto' }}
                    >
                      {flatData.filter(n => n.category === cat.value).length}
                    </Tag>
                  </Space>
                </Button>
              ))}
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Title level={5} style={{ marginBottom: 12 }}>
              树形结构
            </Title>
            <Spin spinning={loading}>
              <Tree
                showLine
                blockNode
                treeData={treeData}
                selectedKeys={selectedKey ? [selectedKey] : []}
                onSelect={(keys) => setSelectedKey(keys[0])}
                onRightClick={({ node }) => {
                  const item = flatData.find(n => n.id === node.key);
                  if (item) handleEdit(item);
                }}
              />
            </Spin>
          </Card>
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Card style={{ borderRadius: 12 }}>
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={flatData.sort((a, b) => a.sort_order - b.sort_order)}
                rowKey="id"
                size="middle"
                scroll={{ x: 900 }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            {editingItem ? <EditOutlined /> : <PlusOutlined />}
            {editingItem ? '编辑知识节点' : '添加知识节点'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={actionLoading}
        okText={editingItem ? '保存修改' : '创建节点'}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="title"
                label="节点标题"
                rules={[{ required: true, message: '请输入节点标题' }]}
              >
                <Input placeholder="请输入标题，如：确定婚期、选择酒店等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="category"
                label="知识分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select>
                  {CATEGORIES.map(cat => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="parent_id"
                label="父节点"
                rules={[{ required: true, message: '请选择父节点' }]}
              >
                <Select>
                  {parentOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="sort_order"
                label="排序"
                rules={[{ required: true, message: '请输入排序值' }]}
                extra="数值越小越靠前"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="详细内容"
            extra="支持富文本内容，将在前端展示给用户"
          >
            <TextArea 
              rows={8} 
              placeholder="请输入详细的知识内容..."
              showCount
              maxLength={2000}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminKnowledge;
