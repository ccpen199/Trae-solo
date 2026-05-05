import { Table, Card, Button, Input, Select, Tag, Space, Popconfirm, message, DatePicker } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import StatusTag from '../components/StatusTag';
import dayjs from 'dayjs';

const { Search } = Input;

const ApplicationList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [expenseTypes, setExpenseTypes] = useState([]);

  useEffect(() => {
    const loadExpenseTypes = async () => {
      try {
        const response = await api.get('/common/expense-types');
        setExpenseTypes(response.data);
      } catch (error) {
        console.error('加载报销类型失败:', error);
      }
    };
    loadExpenseTypes();
  }, []);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        type: 'my',
        page,
        pageSize,
      };
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/applications', { params });
      setData(response.data.list);
      setPagination({
        current: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total,
      });
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchText, statusFilter]);

  const columns = [
    {
      title: '申请单号',
      dataIndex: 'application_no',
      key: 'application_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/applications/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
    },
    {
      title: '报销类型',
      dataIndex: 'expense_type_name',
      key: 'expense_type_name',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const canEdit = ['draft', 'approver_rejected', 'finance_rejected'].includes(record.status);
        return (
          <Space>
            <Button type="link" size="small" onClick={() => navigate(`/applications/${record.id}`)}>
              详情
            </Button>
            {canEdit && (
              <Button type="link" size="small" onClick={() => navigate(`/application/edit/${record.id}`)}>
                编辑
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <Card title="我的报销申请">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Button type="primary" onClick={() => navigate('/application/create')}>
            发起报销
          </Button>
          <Search
            placeholder="搜索申请单号、项目、申请人"
            allowClear
            style={{ width: 250 }}
            onSearch={(value) => setSearchText(value)}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 150 }}
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value)}
          >
            <Select.Option value="">全部状态</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="approving">审批中</Select.Option>
            <Select.Option value="approved">已通过</Select.Option>
            <Select.Option value="approver_rejected">业务员驳回</Select.Option>
            <Select.Option value="finance_rejected">财务驳回</Select.Option>
            <Select.Option value="archived">已归档</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default ApplicationList;
