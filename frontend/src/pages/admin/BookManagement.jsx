import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Select,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  message,
  Popconfirm,
  Drawer,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { bookApi } from '../../utils/api';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(undefined);
  const [categories, setCategories] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form] = Form.useForm();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;

      const response = await bookApi.getBooks(params);
      setBooks(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      message.error('获取图书列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await bookApi.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('获取分类失败:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchBooks();
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
    setTimeout(() => fetchBooks(), 0);
  };

  const handleAdd = () => {
    setEditingBook(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    form.setFieldsValue({
      ...book,
    });
    setDrawerVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await bookApi.deleteBook(id);
      message.success('删除成功');
      fetchBooks();
    } catch (err) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBook) {
        await bookApi.updateBook(editingBook.id, values);
        message.success('更新成功');
      } else {
        await bookApi.createBook(values);
        message.success('添加成功');
      }
      setDrawerVisible(false);
      fetchBooks();
      fetchCategories();
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      width: 140,
    },
    {
      title: '出版社',
      dataIndex: 'publisher',
      key: 'publisher',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat) => cat && <Tag color="blue">{cat}</Tag>,
    },
    {
      title: '库存',
      key: 'stock',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tag color="green">可借: {record.available_copies}</Tag>
          <Tag color="blue">总藏: {record.total_copies}</Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这本图书吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              图书管理
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加图书
            </Button>
          </div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Search
              placeholder="搜索书名、作者、出版社或ISBN"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              style={{ width: 400 }}
            />
            <Select
              placeholder="选择分类"
              allowClear
              value={category}
              onChange={handleCategoryChange}
              style={{ width: 150 }}
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Space>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={books}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Drawer
        title={editingBook ? '编辑图书' : '添加图书'}
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              提交
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="书名"
            rules={[{ required: true, message: '请输入书名' }]}
          >
            <Input placeholder="请输入书名" />
          </Form.Item>

          <Form.Item name="isbn" label="ISBN">
            <Input placeholder="请输入ISBN" />
          </Form.Item>

          <Form.Item name="author" label="作者">
            <Input placeholder="请输入作者" />
          </Form.Item>

          <Form.Item name="publisher" label="出版社">
            <Input placeholder="请输入出版社" />
          </Form.Item>

          <Form.Item name="publish_date" label="出版日期">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="category" label="分类">
            <Input placeholder="请输入分类，如：计算机编程、文学小说" />
          </Form.Item>

          <Form.Item name="total_copies" label="总册数">
            <Input type="number" min="1" placeholder="请输入总册数" />
          </Form.Item>

          <Form.Item name="location" label="存放位置">
            <Input placeholder="请输入存放位置" />
          </Form.Item>

          <Form.Item name="price" label="定价">
            <Input type="number" min="0" step="0.01" placeholder="请输入定价" prefix="¥" />
          </Form.Item>

          <Form.Item name="description" label="简介">
            <TextArea rows={4} placeholder="请输入图书简介" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default BookManagement;
