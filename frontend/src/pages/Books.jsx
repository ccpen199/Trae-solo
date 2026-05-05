import React, { useState, useEffect, useRef } from 'react';
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
  Descriptions,
  Spin,
  message,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { bookApi, borrowApi, readerApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Books = () => {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState(undefined);
  const [categories, setCategories] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [selectedBorrowBook, setSelectedBorrowBook] = useState(null);
  const [readers, setReaders] = useState([]);
  const [selectedReader, setSelectedReader] = useState(undefined);
  const tableRef = useRef(null);
  const navigate = useNavigate();

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

  const fetchReaders = async () => {
    try {
      const response = await readerApi.getReaders({ pageSize: 100 });
      setReaders(response.data.data.filter(r => r.status === 'active'));
    } catch (err) {
      console.error('获取读者列表失败:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isAdmin()) {
      fetchReaders();
    }
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

  const handleViewDetail = async (book) => {
    setDetailLoading(true);
    try {
      const response = await bookApi.getBookById(book.id);
      setSelectedBook(response.data);
      setDetailModalVisible(true);
    } catch (err) {
      message.error('获取图书详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBorrow = (book) => {
    if (book.available_copies <= 0) {
      message.error('该图书已无库存');
      return;
    }
    setSelectedBorrowBook(book);
    setSelectedReader(undefined);
    setBorrowModalVisible(true);
  };

  const handleBorrowSubmit = async () => {
    try {
      if (isAdmin() && !selectedReader) {
        message.error('请选择读者');
        return;
      }

      const params = {
        bookId: selectedBorrowBook.id,
      };

      if (isAdmin() && selectedReader) {
        params.readerId = selectedReader;
      }

      await borrowApi.borrowBook(params);
      message.success('借书成功');
      setBorrowModalVisible(false);
      fetchBooks();
    } catch (err) {
      message.error(err.response?.data?.message || '借书失败');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ color: '#1890ff' }}>
          {text}
        </a>
      ),
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
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat) => cat && <Tag color="blue">{cat}</Tag>,
    },
    {
      title: '库存状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const available = record.available_copies;
        const total = record.total_copies;
        if (available > 0) {
          return <Tag color="green">可借 ({available}/{total})</Tag>;
        }
        return <Tag color="red">已借完 ({available}/{total})</Tag>;
      },
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.available_copies > 0 && (
            <Popconfirm
              title={isAdmin() ? '请在弹窗中选择读者后确认借书' : '确认借阅此书？'}
              onConfirm={() => handleBorrow(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                icon={<ShoppingCartOutlined />}
              >
                借书
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="no-print">
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              图书检索
            </Title>
            <Space style={{ marginBottom: 16, width: '100%' }} wrap>
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
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                打印列表
              </Button>
            </Space>
          </Space>
        </Card>
      </div>

      <div className="print-only" style={{ marginBottom: 20 }}>
        <Title level={3} style={{ textAlign: 'center' }}>
          图书检索列表
        </Title>
        <p style={{ textAlign: 'center', color: '#888' }}>
          打印时间: {new Date().toLocaleString()}
        </p>
      </div>

      <Card style={{ marginTop: 16 }}>
        <Table
          ref={tableRef}
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
            className: 'no-print',
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title="图书详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          selectedBook && selectedBook.available_copies > 0 && (
            <Button
              key="borrow"
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleBorrow(selectedBook);
              }}
            >
              借书
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : selectedBook ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="书名" span={2}>
              {selectedBook.title}
            </Descriptions.Item>
            <Descriptions.Item label="作者">{selectedBook.author}</Descriptions.Item>
            <Descriptions.Item label="ISBN">{selectedBook.isbn}</Descriptions.Item>
            <Descriptions.Item label="出版社">{selectedBook.publisher}</Descriptions.Item>
            <Descriptions.Item label="出版日期">{selectedBook.publish_date}</Descriptions.Item>
            <Descriptions.Item label="分类">{selectedBook.category}</Descriptions.Item>
            <Descriptions.Item label="价格">
              {selectedBook.price ? `¥${selectedBook.price}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="位置">{selectedBook.location}</Descriptions.Item>
            <Descriptions.Item label="库存状态">
              <Space>
                <Tag color={selectedBook.available_copies > 0 ? 'green' : 'red'}>
                  可借: {selectedBook.available_copies} 本
                </Tag>
                <Tag color="blue">总藏: {selectedBook.total_copies} 本</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="简介" span={2}>
              {selectedBook.description || '暂无简介'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title="借书登记"
        open={borrowModalVisible}
        onCancel={() => setBorrowModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBorrowModalVisible(false)}>
            取消
          </Button>,
          <Button key="borrow" type="primary" onClick={handleBorrowSubmit}>
            确认借书
          </Button>,
        ]}
        width={500}
      >
        {selectedBorrowBook && (
          <div>
            <p style={{ marginBottom: 16 }}>
              <strong>书名：</strong>{selectedBorrowBook.title}
            </p>
            <p style={{ marginBottom: 16 }}>
              <strong>作者：</strong>{selectedBorrowBook.author}
            </p>
            <p style={{ marginBottom: 16 }}>
              <strong>可借册数：</strong>
              <Tag color="green">{selectedBorrowBook.available_copies} 本</Tag>
            </p>
            <p style={{ marginBottom: 16 }}>
              <strong>借阅期限：</strong>30天
            </p>
            {isAdmin() && (
              <div style={{ marginTop: 20 }}>
                <Select
                  placeholder="请选择读者"
                  value={selectedReader}
                  onChange={setSelectedReader}
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {readers.map((reader) => (
                    <Option key={reader.id} value={reader.id}>
                      {reader.name} ({reader.username})
                    </Option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Books;
