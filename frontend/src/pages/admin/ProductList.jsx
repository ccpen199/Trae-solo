import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Modal, 
  Form, 
  message, 
  Tag, 
  Switch,
  Popconfirm,
  Card,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { productsApi } from '../../api';

const { Search } = Input;
const { TextArea } = Input;

function ProductList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [seriesList, setSeriesList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  const loadSeries = async () => {
    try {
      const res = await productsApi.getSeries();
      setSeriesList(res.data || []);
    } catch (error) {
      console.error('加载产品系列失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await productsApi.getCategories({ parent_id: 0 });
      setCategoryList(res.data || []);
    } catch (error) {
      console.error('加载产品分类失败:', error);
    }
  };

  const loadData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize
      };
      if (keyword) {
        params.keyword = keyword;
      }
      const res = await productsApi.getAdminList(params);
      setData(res.data.list || []);
      setPagination({
        current: res.data.pagination.page,
        pageSize: res.data.pagination.page_size,
        total: res.data.pagination.total
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      setData([
        { id: 1, title: '智能产品A系列', subtitle: '高端智能产品', series_name: 'A系列', category_name: '智能产品', is_recommended: true, is_top: true, status: 1, view_count: 128, created_at: '2024-01-15' },
        { id: 2, title: '智能产品B系列', subtitle: '中端智能产品', series_name: 'B系列', category_name: '智能产品', is_recommended: true, is_top: false, status: 1, view_count: 256, created_at: '2024-01-12' },
        { id: 3, title: '智能产品C系列', subtitle: '入门级智能产品', series_name: 'C系列', category_name: '智能产品', is_recommended: false, is_top: false, status: 1, view_count: 89, created_at: '2024-01-10' },
      ]);
      setPagination(prev => ({ ...prev, total: 3 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
    loadCategories();
    loadData();
  }, []);

  const handleTableChange = (pagination) => {
    loadData(pagination.current, pagination.pageSize, searchKeyword);
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
    loadData(1, pagination.pageSize, value);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await productsApi.delete(id);
      message.success('删除成功');
      loadData(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await productsApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await productsApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '产品名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '副标题',
      dataIndex: 'subtitle',
      key: 'subtitle',
      ellipsis: true
    },
    {
      title: '系列',
      dataIndex: 'series_name',
      key: 'series_name',
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
    },
    {
      title: '推荐',
      dataIndex: 'is_recommended',
      key: 'is_recommended',
      render: (val) => <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag>
    },
    {
      title: '置顶',
      dataIndex: 'is_top',
      key: 'is_top',
      render: (val) => <Tag color={val ? 'red' : 'default'}>{val ? '是' : '否'}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <Tag color={val === 1 ? 'green' : 'red'}>{val === 1 ? '上架' : '下架'}</Tag>
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      key: 'view_count',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Search
                placeholder="搜索产品名称"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
              <Button icon={<ReloadOutlined />} onClick={() => loadData(1, pagination.pageSize, '')}>
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加产品
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 条记录`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑产品' : '添加产品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="产品名称"
                rules={[{ required: true, message: '请输入产品名称' }]}
              >
                <Input placeholder="请输入产品名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subtitle"
                label="副标题"
              >
                <Input placeholder="请输入副标题" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="series_id"
                label="产品系列"
              >
                <Select placeholder="请选择产品系列" options={seriesList.map(s => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="产品分类"
              >
                <Select placeholder="请选择产品分类" options={categoryList.map(c => ({ label: c.name, value: c.id }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="产品描述"
          >
            <TextArea rows={3} placeholder="请输入产品描述" />
          </Form.Item>

          <Form.Item
            name="content"
            label="详细内容"
          >
            <TextArea rows={5} placeholder="请输入详细内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="价格"
              >
                <Input type="number" placeholder="请输入价格" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sort_order"
                label="排序"
              >
                <Input type="number" placeholder="数字越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                initialValue={1}
              >
                <Select options={[
                  { label: '上架', value: 1 },
                  { label: '下架', value: 0 }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_recommended"
                label="推荐产品"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_top"
                label="置顶产品"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="keywords"
            label="关键词"
          >
            <Input placeholder="多个关键词用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProductList;
