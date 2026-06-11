import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Spin,
  message,
  Popconfirm,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { jobs } from '../api';

const { Search } = Input;
const { Option } = Select;

function Jobs() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'all',
    job_type: '',
    work_city: '',
  });

  const jobTypeOptions = [
    { value: 'full_time', label: '全职' },
    { value: 'part_time', label: '兼职' },
    { value: 'internship', label: '实习' },
    { value: 'contract', label: '合同' },
  ];

  const cityOptions = [
    { value: '北京', label: '北京' },
    { value: '上海', label: '上海' },
    { value: '广州', label: '广州' },
    { value: '深圳', label: '深圳' },
    { value: '杭州', label: '杭州' },
    { value: '成都', label: '成都' },
  ];

  useEffect(() => {
    if (token) {
      loadJobList();
    }
  }, [token, pagination.current, pagination.pageSize, filters]);

  const loadJobList = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };
      if (params.status === 'all') delete params.status;
      if (!params.job_type) delete params.job_type;
      if (!params.work_city) delete params.work_city;
      if (!params.keyword) delete params.keyword;

      const res = await jobs.getList(params);
      if (res.code === 0) {
        setJobList(res.data.list || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      message.error('加载岗位列表失败');
      console.error('加载岗位列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, keyword: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      published: { color: 'success', text: '已发布' },
      draft: { color: 'default', text: '草稿' },
      closed: { color: 'error', text: '已关闭' },
      offline: { color: 'warning', text: '已下架' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      let res;
      if (currentStatus === 'published') {
        res = await jobs.unpublish(id);
      } else {
        res = await jobs.publish(id);
      }
      if (res.code === 0) {
        message.success(currentStatus === 'published' ? '下架成功' : '发布成功');
        loadJobList();
      }
    } catch (err) {
      message.error('操作失败');
      console.error('操作失败:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await jobs.delete(id);
      if (res.code === 0) {
        message.success('删除成功');
        loadJobList();
      }
    } catch (err) {
      message.error('删除失败');
      console.error('删除失败:', err);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的岗位');
      return;
    }
    try {
      await Promise.all(selectedRowKeys.map((id) => jobs.delete(id)));
      message.success(`成功删除 ${selectedRowKeys.length} 个岗位`);
      setSelectedRowKeys([]);
      loadJobList();
    } catch (err) {
      message.error('批量删除失败');
      console.error('批量删除失败:', err);
    }
  };

  const columns = [
    {
      title: '岗位标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/jobs/${record.id}`)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: '城市',
      dataIndex: 'work_city',
      key: 'work_city',
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '薪资范围',
      dataIndex: 'salary_range',
      key: 'salary_range',
      render: (_, record) => {
        if (record.salary_negotiable) return <Tag>面议</Tag>;
        return `${record.salary_min || 0}K - ${record.salary_max || 0}K`;
      },
      responsive: ['sm', 'md', 'lg', 'xl'],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: '投递数',
      dataIndex: 'application_count',
      key: 'application_count',
      render: (count) => count || 0,
      responsive: ['md', 'lg', 'xl'],
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
      responsive: ['lg', 'xl'],
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/jobs/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/jobs/create?id=${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 'published' ? <DownloadOutlined /> : <UploadOutlined />}
            onClick={() => handlePublish(record.id, record.status)}
          >
            {record.status === 'published' ? '下架' : '发布'}
          </Button>
          <Popconfirm
            title="确定要删除这个岗位吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  if (loading && jobList.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索岗位标题、部门..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Select
              placeholder="状态筛选"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={filters.status === 'all' ? undefined : filters.status}
              onChange={(value) => handleFilterChange('status', value || 'all')}
            >
              <Option value="all">全部状态</Option>
              <Option value="published">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="closed">已关闭</Option>
              <Option value="offline">已下架</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={3}>
            <Select
              placeholder="职位类型"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={filters.job_type || undefined}
              onChange={(value) => handleFilterChange('job_type', value || '')}
            >
              {jobTypeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4} lg={3}>
            <Select
              placeholder="工作城市"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={filters.work_city || undefined}
              onChange={(value) => handleFilterChange('work_city', value || '')}
            >
              {cityOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={8} lg={9} style={{ textAlign: 'right' }}>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 个岗位吗？`}
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/jobs/create')}
              >
                新建岗位
              </Button>
            </Space>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#e6f7ff', borderRadius: 4 }}>
            <Checkbox
              checked={selectedRowKeys.length === jobList.length && total === jobList.length}
              indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < jobList.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRowKeys(jobList.map((j) => j.id));
                } else {
                  setSelectedRowKeys([]);
                }
              }}
            >
              已选择 {selectedRowKeys.length} 项
            </Checkbox>
          </div>
        )}

        <Table
          rowSelection={rowSelection}
          dataSource={jobList}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: handlePageChange,
          }}
        />
      </Card>
    </div>
  );
}

export default Jobs;
