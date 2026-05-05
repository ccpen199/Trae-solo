import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Typography,
  Empty,
  Spin,
  message,
  Button,
  Space,
  Popconfirm,
} from 'antd';
import { useAuth } from '../../context/AuthContext';
import { borrowApi } from '../../utils/api';
import { RedoOutlined } from '@ant-design/icons';

const { Title } = Typography;

const BorrowRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchRecords = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await borrowApi.getMyRecords({
        page,
        pageSize,
      });
      setRecords(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      message.error('获取借阅记录失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user?.id, page, pageSize]);

  const handleRenew = async (record) => {
    try {
      await borrowApi.renewBook(record.id);
      message.success('续借成功');
      fetchRecords();
    } catch (err) {
      message.error(err.response?.data?.message || '续借失败');
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
      title: '书名',
      dataIndex: 'title',
      key: 'title',
      width: 200,
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
      title: '借阅日期',
      dataIndex: 'borrow_date',
      key: 'borrow_date',
      width: 120,
    },
    {
      title: '应还日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
    },
    {
      title: '归还日期',
      dataIndex: 'return_date',
      key: 'return_date',
      width: 120,
      render: (date) => date || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'borrowed' && (
            <Popconfirm
              title="确认续借？"
              description="续借将延长借阅期限15天"
              onConfirm={() => handleRenew(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<RedoOutlined />}>
                续借
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          我的借阅记录
        </Title>
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
          locale={{
            emptyText: (
              <Empty description="暂无借阅记录">
                <p>您目前还没有借阅任何图书</p>
              </Empty>
            ),
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default BorrowRecords;
