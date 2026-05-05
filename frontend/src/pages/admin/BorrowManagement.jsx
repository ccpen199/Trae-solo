import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  message,
  Popconfirm,
  Select,
  Descriptions,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  RedoOutlined,
  UndoOutlined,
  EyeOutlined,
  BookOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { borrowApi, bookApi, readerApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const BorrowManagement = () => {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [readerName, setReaderName] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [status, setStatus] = useState(undefined);
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [books, setBooks] = useState([]);
  const [readers, setReaders] = useState([]);
  const [form] = Form.useForm();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
      };
      if (readerName) params.readerName = readerName;
      if (bookTitle) params.bookTitle = bookTitle;
      if (status) params.status = status;

      const response = await borrowApi.getAllRecords(params);
      setRecords(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      message.error('获取借阅记录失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await borrowApi.getStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await bookApi.getBooks({ pageSize: 100 });
      setBooks(response.data.data.filter(b => b.available_copies > 0));
    } catch (err) {
      console.error('获取图书列表失败:', err);
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
    fetchRecords();
    if (isAdmin()) {
      fetchStatistics();
      fetchBooks();
      fetchReaders();
    }
  }, [page, pageSize, isAdmin]);

  const handleSearch = () => {
    setPage(1);
    fetchRecords();
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
    setTimeout(() => fetchRecords(), 0);
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setDetailVisible(true);
  };

  const handleBorrow = () => {
    form.resetFields();
    setBorrowModalVisible(true);
  };

  const handleReturn = async (record) => {
    try {
      await borrowApi.returnBook(record.id);
      message.success('还书成功');
      fetchRecords();
      fetchStatistics();
    } catch (err) {
      message.error(err.response?.data?.message || '还书失败');
    }
  };

  const handleRenew = async (record) => {
    try {
      await borrowApi.renewBook(record.id);
      message.success('续借成功');
      fetchRecords();
    } catch (err) {
      message.error(err.response?.data?.message || '续借失败');
    }
  };

  const handleBorrowSubmit = async (values) => {
    try {
      await borrowApi.borrowBook(values);
      message.success('借书成功');
      setBorrowModalVisible(false);
      fetchRecords();
      fetchStatistics();
      fetchBooks();
    } catch (err) {
      message.error(err.response?.data?.message || '借书失败');
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'borrowed':
        return <Tag color="blue">借阅中</Tag>;
      case 'returned':
        return <Tag color="green">已归还</Tag>;
      case 'overdue':
        return <Tag color="red">已逾期</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: '读者',
      dataIndex: 'reader_name',
      key: 'reader_name',
      width: 100,
    },
    {
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
    },
    {
      title: '借阅日期',
      dataIndex: 'borrow_date',
      key: 'borrow_date',
      width: 110,
    },
    {
      title: '应还日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 110,
    },
    {
      title: '归还日期',
      dataIndex: 'return_date',
      key: 'return_date',
      width: 110,
      render: (date) => date || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: getStatusTag,
    },
    {
      title: '罚款',
      dataIndex: 'fine_amount',
      key: 'fine_amount',
      width: 80,
      render: (amount) => (amount ? `¥${amount}` : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'borrowed' && (
            <>
              <Button type="link" icon={<RedoOutlined />} onClick={() => handleRenew(record)}>
                续借
              </Button>
              <Popconfirm
                title="确认还书？"
                onConfirm={() => handleReturn(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" icon={<UndoOutlined />}>
                  还书
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="总藏册数"
                value={statistics.totalCopies}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="可借册数"
                value={statistics.availableCopies}
                valueStyle={{ color: '#3f8600' }}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="已借册数"
                value={statistics.borrowedRecords}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="逾期记录"
                value={statistics.overdueRecords}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="在籍读者"
                value={statistics.totalReaders}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="图书种类"
                value={statistics.totalBooks}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              借阅管理
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleBorrow}>
              借书登记
            </Button>
          </div>
          <Space wrap>
            <Search
              placeholder="搜索读者姓名"
              value={readerName}
              onChange={(e) => setReaderName(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
            <Search
              placeholder="搜索书名"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
            <Select
              placeholder="选择状态"
              allowClear
              value={status}
              onChange={handleStatusChange}
              style={{ width: 120 }}
            >
              <Option value="borrowed">借阅中</Option>
              <Option value="returned">已归还</Option>
              <Option value="overdue">已逾期</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={records}
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
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="借书登记"
        open={borrowModalVisible}
        onCancel={() => setBorrowModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleBorrowSubmit}>
          <Form.Item
            name="readerId"
            label="选择读者"
            rules={[{ required: true, message: '请选择读者' }]}
          >
            <Select placeholder="请选择读者" showSearch optionFilterProp="children">
              {readers.map((reader) => (
                <Option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.username})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="bookId"
            label="选择图书"
            rules={[{ required: true, message: '请选择图书' }]}
          >
            <Select placeholder="请选择可借图书" showSearch optionFilterProp="children">
              {books.map((book) => (
                <Option key={book.id} value={book.id}>
                  {book.title} - {book.author} (可借: {book.available_copies})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setBorrowModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认借书
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="借阅详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="读者" span={2}>
              {selectedRecord.reader_name}
            </Descriptions.Item>
            <Descriptions.Item label="书名" span={2}>
              {selectedRecord.title}
            </Descriptions.Item>
            <Descriptions.Item label="作者">{selectedRecord.author}</Descriptions.Item>
            <Descriptions.Item label="ISBN">{selectedRecord.isbn}</Descriptions.Item>
            <Descriptions.Item label="借阅日期">{selectedRecord.borrow_date}</Descriptions.Item>
            <Descriptions.Item label="应还日期">{selectedRecord.due_date}</Descriptions.Item>
            <Descriptions.Item label="归还日期">
              {selectedRecord.return_date || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedRecord.status)}</Descriptions.Item>
            <Descriptions.Item label="罚款金额" span={2}>
              {selectedRecord.fine_amount ? `¥${selectedRecord.fine_amount}` : '无罚款'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BorrowManagement;
