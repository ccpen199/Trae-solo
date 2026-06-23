import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { jobs } from '../../api/endpoints';
import type { Job } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const JobList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;

      const response = await jobs.list(params);
      const list = response.data?.list || response.data?.data || response.data || [];
      const total = response.data?.total ?? 0;
      setData(list);
      setTotal(total);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    try {
      await jobs.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '招聘中' },
      paused: { color: 'orange', text: '已暂停' },
      closed: { color: 'default', text: '已关闭' },
      draft: { color: 'blue', text: '草稿' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: Job) => (
        <a onClick={() => navigate(`/enterprise/jobs/${record.id}/edit`)}>{text}</a>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '薪资范围',
      key: 'salary',
      width: 140,
      render: (_: any, record: Job) =>
        record.salaryMin && record.salaryMax
          ? `${record.salaryMin}K - ${record.salaryMax}K`
          : '面议',
    },
    {
      title: '工作地点',
      dataIndex: 'workLocation',
      key: 'workLocation',
      width: 140,
    },
    {
      title: '招聘类型',
      dataIndex: 'jobType',
      key: 'jobType',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: any, record: Job) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => navigate(`/enterprise/recommend?jobId=${record.id}`)}
          >
            推荐候选人
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/enterprise/jobs/${record.id}/edit`)}
          >
            编辑
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
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            岗位管理
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/enterprise/jobs/new')}>
            新增岗位
          </Button>
        </Col>
      </Row>

      <Space style={{ marginBottom: '16px' }} wrap>
        <Search
          placeholder="搜索岗位名称"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 280 }}
          onSearch={handleSearch}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 140 }}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
            setTimeout(fetchData, 0);
          }}
        >
          <Option value="active">招聘中</Option>
          <Option value="paused">已暂停</Option>
          <Option value="closed">已关闭</Option>
          <Option value="draft">草稿</Option>
        </Select>
        <Button onClick={handleSearch}>查询</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </div>
  );
};

export default JobList;
