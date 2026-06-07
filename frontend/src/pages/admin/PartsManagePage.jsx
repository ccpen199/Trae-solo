import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  message,
  Modal,
  Form,
  InputNumber,
  Typography,
  Switch,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  SwapOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { getParts, createPart, updatePart } from '../../services/adminService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PartsManagePage = () => {
  const [parts, setParts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [adjustingPart, setAdjustingPart] = useState(null);
  const [form] = Form.useForm();
  const [adjustForm] = Form.useForm();

  useEffect(() => {
    loadParts();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadParts = async () => {
    setLoading(true);
    try {
      const res = await getParts();
      let data = res.data || [];
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        data = data.filter(p =>
          p.name.toLowerCase().includes(keyword) ||
          p.sku.toLowerCase().includes(keyword)
        );
      }
      if (filters.lowStock) {
        data = data.filter(p => p.quantity < p.min_stock);
      }
      const start = (pagination.current - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      setParts(data.slice(start, end));
      setTotal(data.length);
    } catch (error) {
      message.error('加载配件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPart(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (part) => {
    setEditingPart(part);
    form.setFieldsValue({
      ...part,
      compatible_models: part.compatible_models ? JSON.parse(part.compatible_models).join('\n') : ''
    });
    setModalVisible(true);
  };

  const handleAdjust = (part) => {
    setAdjustingPart(part);
    adjustForm.setFieldsValue({ quantity: part.quantity });
    setAdjustModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const compatibleModels = values.compatible_models ?
        values.compatible_models.split('\n').filter(s => s.trim()) : [];

      const data = {
        sku: values.sku,
        name: values.name,
        category: values.category,
        compatible_models: JSON.stringify(compatibleModels),
        quantity: values.quantity || 0,
        price: values.price || 0,
        is_original: values.is_original !== undefined ? values.is_original : true,
        trace_code_prefix: values.trace_code_prefix,
        min_stock: values.min_stock || 10
      };

      if (editingPart) {
        await updatePart(editingPart.id, data);
        message.success('更新成功');
      } else {
        await createPart(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadParts();
    } catch (error) {
      message.error(editingPart ? '更新失败' : '创建失败');
    }
  };

  const handleAdjustSubmit = async () => {
    try {
      const values = await adjustForm.validateFields();
      await updatePart(adjustingPart.id, { quantity: values.quantity });
      message.success('库存调整成功');
      setAdjustModalVisible(false);
      loadParts();
    } catch (error) {
      message.error('调整失败');
    }
  };

  const parseCompatibleModels = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const categories = ['电池', '屏幕', '主板', '摄像头', '充电接口', '音频组件', '其他'];

  const columns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Text strong>{text}</Text>
          {record.is_original && <Tag color="green">原厂</Tag>}
        </Space>
      )
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '原厂溯源码',
      dataIndex: 'trace_code_prefix',
      key: 'trace_code_prefix',
      render: (text) => text || <Text type="secondary">无</Text>
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text, record) => {
        const isLow = text < record.min_stock;
        return (
          <Space>
            <span style={{ color: isLow ? '#f5222d' : 'inherit', fontWeight: isLow ? 'bold' : 'normal' }}>
              {text}
            </span>
            {isLow && <WarningOutlined style={{ color: '#f5222d' }} />}
          </Space>
        );
      },
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: '安全库存',
      dataIndex: 'min_stock',
      key: 'min_stock'
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (text) => <span style={{ color: '#faad14' }}>¥{text || 0}</span>
    },
    {
      title: '供应商',
      dataIndex: 'category',
      key: 'category',
      render: (text) => <Tag>{text || '其他'}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleAdjust(record)}
          >
            调整库存
          </Button>
        </Space>
      )
    }
  ];

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
  };

  return (
    <Card
      title="配件库存管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增配件
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="搜索名称/SKU"
                prefix={<SearchOutlined />}
                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="库存筛选"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => setFilters(f => ({ ...f, lowStock: v }))}
              >
                <Option value={true}>低库存预警</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={14}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={() => { setFilters({}); handleSearch(); }}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={parts}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      </Space>

      <Modal
        title={editingPart ? '编辑配件' : '新增配件'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingPart ? '确认更新' : '确认创建'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU编码"
                rules={[{ required: true, message: '请输入SKU编码' }]}
              >
                <Input placeholder="请输入SKU编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择">
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="name"
            label="配件名称"
            rules={[{ required: true, message: '请输入配件名称' }]}
          >
            <Input placeholder="请输入配件名称" />
          </Form.Item>
          <Form.Item
            name="trace_code_prefix"
            label="原厂溯源码前缀"
          >
            <Input placeholder="请输入溯源码前缀" />
          </Form.Item>
          <Form.Item
            name="compatible_models"
            label="兼容机型"
            help="每行一个机型"
          >
            <TextArea rows={3} placeholder="例如：&#10;iPhone 14&#10;iPhone 14 Pro&#10;iPhone 15" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="库存数量"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="min_stock"
                label="安全库存"
                rules={[{ required: true, message: '请输入安全库存' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="单价(元)"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="is_original"
            label="是否原厂"
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="调整库存"
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        onOk={handleAdjustSubmit}
        okText="确认调整"
      >
        {adjustingPart && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">配件名称</Text>
                  <Text strong>{adjustingPart.name}</Text>
                </Space>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">当前库存</Text>
                  <Text strong style={{ color: adjustingPart.quantity < adjustingPart.min_stock ? '#f5222d' : 'inherit' }}>
                    {adjustingPart.quantity}
                  </Text>
                </Space>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">安全库存</Text>
                  <Text>{adjustingPart.min_stock}</Text>
                </Space>
              </Space>
            </Card>
            <Form form={adjustForm} layout="vertical">
              <Form.Item
                name="quantity"
                label="调整后库存"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Card>
  );
};

export default PartsManagePage;
